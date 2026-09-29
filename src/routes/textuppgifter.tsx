import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, Wand2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PrintContentChoice, keySuffix, showKey, showSheet, type PrintContent } from "@/components/PrintContentChoice";
import { SheetHeader } from "@/components/SheetHeader";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { generateTextTasks, type TextTask } from "@/lib/textuppgifter.functions";

export const Route = createFileRoute("/textuppgifter")({
  head: () => ({
    meta: [
      { title: "Textuppgifter – Räknebladet" },
      { name: "description", content: "Skapa nivåanpassade textuppgifter i alla fyra räknesätten med valfritt tema och facit, utskriftsklara på A4." },
      { property: "og:title", content: "Textuppgifter – Räknebladet" },
      { property: "og:description", content: "AI-skapade textuppgifter i alla fyra räknesätten, anpassade efter årskurs och tema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TextuppgifterPage,
});

type Op = "add" | "sub" | "mul" | "div" | "all";
const OPS: { v: Op; label: string }[] = [
  { v: "add", label: "Addition" }, { v: "sub", label: "Subtraktion" }, { v: "mul", label: "Multiplikation" },
  { v: "div", label: "Division" }, { v: "all", label: "Alla räknesätt" },
];

function Sheet({ tasks, answers, grade, theme, opLabel }: { tasks: TextTask[]; answers: boolean; grade: number; theme: string; opLabel: string }) {
  return <div className="a4-page">
    <SheetHeader title={answers ? "Textuppgifter – Facit" : "Textuppgifter"} subtitle={`Åk ${grade} · ${opLabel} · ${theme}`} score={`av ${tasks.length}`} />
    <ol className="mt-5 flex flex-col gap-4 text-[15px] leading-snug text-sheet-ink">
      {tasks.map((t, i) => <li key={i} className="flex gap-3" style={{ breakInside: "avoid" }}>
        <span className="w-6 shrink-0 font-bold">{i + 1})</span>
        <div className="flex-1">
          <p>{t.question}</p>
          {answers ? <p className="mt-1 font-semibold text-destructive">Svar: {t.answer}</p>
            : <div className="mt-2 h-16 border-b border-sheet-muted" aria-hidden><span className="text-sm text-sheet-muted">Svar:</span></div>}
        </div>
      </li>)}
    </ol>
  </div>;
}

function TextuppgifterPage() {
  const gen = useServerFn(generateTextTasks);
  const [grade, setGrade] = useState(3);
  const [tMin, setTMin] = useState("2");
  const [tMax, setTMax] = useState("5");
  const [theme, setTheme] = useState("Djur på bondgården");
  const [count, setCount] = useState(6);
  const [op, setOp] = useState<Op>("mul");
  const [maxNumber, setMaxNumber] = useState(100);
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [tasks, setTasks] = useState<TextTask[]>([]);
  const [meta, setMeta] = useState({ grade: 3, theme: "", op: "mul" as Op });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; pages: number; images: string[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const previewUrl = useRef<string | null>(null);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null; setPreview(null);
  };
  const downloadPdf = async () => {
    setExporting(true); setError("");
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf("portrait");
      if (!result) throw new Error("Inga blad att spara. Skapa uppgifter först.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob); previewUrl.current = url;
      setPreview({ ...result, url });
      setFileName(`textuppgifter-ak${meta.grade}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`);
    } catch { setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut."); }
    finally { setExporting(false); }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName); closePreview();
  };
  const input = "mt-1 block rounded-md border border-input bg-background px-2 py-1.5";

  const opLabel = OPS.find(o => o.v === meta.op)!.label;
  const run = async () => {
    setLoading(true); setError("");
    try {
      const r = await gen({ data: { grade, tableMin: Number(tMin), tableMax: Number(tMax), theme, count, op, maxNumber } });
      if ("error" in r) setError(r.error); else { setTasks(r.tasks); setMeta({ grade, theme, op }); }
    } catch { setError("Något gick fel. Kontrollera inställningarna och försök igen."); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-background">
    <header className="no-print border-b border-border bg-card"><div className="mx-auto max-w-6xl px-6 py-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Alla räknesätt</Link>
      <h1 className="font-display text-2xl font-semibold">Textuppgifter</h1><p className="text-sm text-muted-foreground">Problemlösning i alla räknesätt · A4</p>
    </div></header>
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
        <h2 className="font-display text-lg font-semibold">Inställningar</h2>
        <form onSubmit={e => { e.preventDefault(); run(); }} className="space-y-5">
          <label className="block text-sm font-medium">Årskurs<select className={`${input} w-auto`} value={grade} onChange={e => setGrade(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9].map(g => <option key={g} value={g}>Åk {g}</option>)}</select></label>
          <fieldset><legend className="mb-2 text-sm font-medium">Räknesätt</legend><div className="flex flex-wrap gap-1.5">
            {OPS.map(o => <button key={o.v} type="button" aria-pressed={op === o.v} onClick={() => setOp(o.v)} className={`rounded-md border px-2.5 py-1.5 text-sm ${op === o.v ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"}`}>{o.label}</button>)}
          </div></fieldset>
          {(op === "add" || op === "sub" || op === "all") && <label className="block text-sm font-medium">Tal upp till (+ och −)<select className={`${input} w-auto`} value={maxNumber} onChange={e => setMaxNumber(Number(e.target.value))}>{[10,20,100,1000,10000].map(n => <option key={n} value={n}>{n}</option>)}</select></label>}
          {(op === "mul" || op === "div" || op === "all") && <fieldset><legend className="mb-2 text-sm font-medium">Multiplikationstabeller</legend><div className="flex items-end gap-2">
            <label className="text-sm">Från<input aria-label="Tabell från" className={`${input} w-16 text-center`} type="number" min={0} max={12} required value={tMin} onChange={e => setTMin(e.target.value)} /></label><span className="pb-2">till</span>
            <label className="text-sm">Till<input aria-label="Tabell till" className={`${input} w-16 text-center`} type="number" min={0} max={12} required value={tMax} onChange={e => setTMax(e.target.value)} /></label>
          </div></fieldset>}
          <label className="block text-sm font-medium">Tema<input className={`${input} w-full`} maxLength={80} required value={theme} onChange={e => setTheme(e.target.value)} placeholder="t.ex. Fotboll, Rymden" /></label>
          <label className="block text-sm font-medium">Antal uppgifter<select className={`${input} w-auto`} value={count} onChange={e => setCount(Number(e.target.value))}>{[4,5,6,7,8,10].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"><Wand2 className="h-4 w-4" />{loading ? "Skapar uppgifter…" : tasks.length ? "Skapa nya uppgifter" : "Skapa uppgifter"}</button>
        </form>
        <p className="text-xs text-muted-foreground">Uppgifterna skrivs av AI – läs igenom dem och facit innan utskrift.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <PrintContentChoice value={content} onChange={setContent} />
        <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
        <div className="space-y-2">
          <button disabled={exporting || !tasks.length} onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"><FileDown className="h-4 w-4" />{exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}</button>
          <button disabled={!tasks.length} onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"><Printer className="h-4 w-4" />Skriv ut</button>
        </div>
      </aside>
      <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
        {!tasks.length && <p className="no-print mt-10 text-muted-foreground">{loading ? "Skapar uppgifter – det tar några sekunder…" : "Välj inställningar och klicka på Skapa uppgifter."}</p>}
        {tasks.length > 0 && <>{showSheet(content) && <Sheet tasks={tasks} answers={false} {...meta} opLabel={opLabel} />}{showKey(content) && <Sheet tasks={tasks} answers {...meta} opLabel={opLabel} />}</>}
      </main>
    </div>
    {preview && <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-label="Förhandsgranskning av PDF" aria-modal="true">
      <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Förhandsgranskning av PDF · {preview.pages} {preview.pages === 1 ? "sida" : "sidor"}</h2><button onClick={closePreview} className="rounded-md px-2 py-1 text-sm hover:bg-accent">Stäng</button></div>
        <PdfPagesPreview images={preview.images} />
        <div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-sm font-medium">Filnamn<div className="mt-1 flex items-center gap-1"><input className="w-full rounded-md border border-input bg-background px-2 py-1.5" value={fileName} onChange={e => setFileName(e.target.value)} /><span>.pdf</span></div></label>
          <button onClick={closePreview} className="rounded-lg border border-input px-4 py-2 text-sm">Avbryt</button><button onClick={savePreview} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ladda ner</button></div>
      </div>
    </div>}
  </div>;
}
