import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, RefreshCw } from "lucide-react";
import { PrintContentChoice, keySuffix, pagesLabel, showKey, showSheet, type PrintContent } from "@/components/PrintContentChoice";
import { genAddSub, type AddSubOp, type AddSubTask } from "@/lib/addsub";
import { SheetAddSub } from "./SheetAddSub";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";

const COUNT = 12;
const btn = (on: boolean) =>
  `rounded-md border px-3 py-1.5 text-sm font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"}`;

export function AddSubPage({ op }: { op: AddSubOp }) {
  const title = op === "add" ? "Addition" : "Subtraktion";
  const [lo, setLo] = useState(3);
  const [hi, setHi] = useState(3);
  const [dec, setDec] = useState<number | "slumpa" | "slumpa-decimaler">(0);
  const [terms, setTerms] = useState(2);
  const [regroup, setRegroup] = useState(true);
  const [ownSetup, setOwnSetup] = useState(false);
  const [ownGrid, setOwnGrid] = useState(true);
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [tasks, setTasks] = useState<AddSubTask[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ url: string; blob: Blob; pages: number; images: string[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    const l = lo, h = Math.max(hi, l);
    if (l !== lo) setLo(l);
    if (h !== hi) setHi(h);
    setTasks(genAddSub({ op, digits: [l, h], dec, terms, regroup, count: COUNT }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, lo, hi, dec, terms, regroup]);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  const generate = () => setTasks(genAddSub({ op, digits: [lo, hi], dec, terms, regroup, count: COUNT }));
  const closePreview = () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; setPreview(null); };
  const downloadPdf = async () => {
    setExporting(true); setError("");
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf("portrait");
      if (!result) throw new Error();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob); previewUrl.current = url;
      setPreview({ ...result, url });
      setFileName(`${op === "add" ? "addition" : "subtraktion"}-${ownSetup ? `egen-uppstallning${ownGrid ? "-med-rutnat" : ""}` : "uppstallning"}-${regroup ? "med" : "utan"}-vaxling${dec === "slumpa" || dec === "slumpa-decimaler" ? "-slumpade-decimaler" : dec ? `-${dec}-decimaler` : ""}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`);
    } catch { setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut."); }
    finally { setExporting(false); }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName); closePreview();
  };
  const sel = "mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm";

  return <div className="min-h-screen bg-background">
    <header className="no-print border-b border-border bg-card"><div className="mx-auto max-w-6xl px-6 py-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Alla räknesätt</Link>
      <h1 className="font-display text-2xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">Uppställning · A4</p>
    </div></header>
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
        <h2 className="font-display text-lg font-semibold">Inställningar</h2>
        <fieldset><legend className="mb-2 text-sm font-medium">Växling</legend><div className="flex gap-2">
          <button type="button" className={btn(regroup)} onClick={() => setRegroup(true)}>Med växling</button>
          <button type="button" className={btn(!regroup)} onClick={() => setRegroup(false)}>Utan växling</button>
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-medium">Tal</legend><div className="flex gap-2">
          <button type="button" className={btn(dec === 0)} onClick={() => setDec(0)}>Heltal</button>
          <button type="button" className={btn((typeof dec === "number" && dec > 0) || dec === "slumpa-decimaler")} onClick={() => setDec(typeof dec === "number" && dec > 0 ? dec : dec === "slumpa-decimaler" ? dec : 1)}>Decimaltal</button>
          <button type="button" className={btn(dec === "slumpa")} onClick={() => setDec("slumpa")}>Slumpa</button>
        </div>
          {(typeof dec === "number" && dec > 0) || dec === "slumpa-decimaler" ? <label className="mt-2 block text-sm">Antal decimaler<select className={sel} value={dec === "slumpa-decimaler" ? "slumpa-decimaler" : dec} onChange={e => setDec(e.target.value === "slumpa-decimaler" ? "slumpa-decimaler" : Number(e.target.value))}>{[1, 2, 3].map(n => <option key={n} value={n}>{n} decimal{n > 1 ? "er" : ""}</option>)}<option value="slumpa-decimaler">Slumpa decimaler</option></select></label> : null}
          {dec === "slumpa-decimaler" && <p className="mt-2 text-xs text-muted-foreground">Varje term får ett slumpat antal decimaler (1–3).</p>}
          {dec === "slumpa" && <p className="mt-2 text-xs text-muted-foreground">Varje term får ett slumpat antal decimaler utifrån sitt sifferantal.</p>}
        </fieldset>
        <div className={op === "add" ? "flex flex-wrap items-start gap-x-3 gap-y-3" : undefined}>
          <fieldset className={op === "add" ? "min-w-0" : undefined}>
            <legend className="mb-0.5 text-sm font-medium">Antal siffror per tal</legend>
            {dec !== 0 && <p className="mb-2 text-xs text-muted-foreground">(inkl. decimaler)</p>}
            <div className="flex items-end gap-2">
              <label className="text-sm">Från<select aria-label="Siffror från" className={sel} value={lo} onChange={e => { const v = Number(e.target.value); setLo(v); if (v > hi) setHi(v); }}>{[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
              <label className="text-sm">Till<select aria-label="Siffror till" className={sel} value={hi} onChange={e => { const v = Number(e.target.value); setHi(v); if (v < lo) setLo(v); }}>{[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
            </div>
          </fieldset>
          {op === "add" && <fieldset><legend className="mb-2 text-sm font-medium">Antal termer</legend><div className="flex gap-2">
            {[2, 3].map(n => <button key={n} type="button" className={btn(terms === n)} onClick={() => setTerms(n)}>{n} tal</button>)}
          </div></fieldset>}
        </div>
        <fieldset><legend className="mb-2 text-sm font-medium">Elevblad</legend><div className="flex flex-wrap gap-2">
          <button type="button" className={btn(!ownSetup)} onClick={() => setOwnSetup(false)}>Färdig uppställning</button>
          <button type="button" className={btn(ownSetup)} onClick={() => setOwnSetup(true)}>Tom ruta</button>
        </div></fieldset>
        {ownSetup && <fieldset><legend className="mb-2 text-sm font-medium">Rutnät i rutan</legend><div className="flex gap-2">
          <button type="button" className={btn(ownGrid)} onClick={() => setOwnGrid(true)}>Med rutnät</button>
          <button type="button" className={btn(!ownGrid)} onClick={() => setOwnGrid(false)}>Utan rutnät</button>
        </div></fieldset>}
        <PrintContentChoice value={content} onChange={setContent} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
        <button onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"><RefreshCw className="h-4 w-4" />Ny slumpad variant</button>
        <div className="space-y-2"><button disabled={exporting || !tasks.length} onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"><FileDown className="h-4 w-4" />{exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}</button>
          <button disabled={!tasks.length} onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Printer className="h-4 w-4" />Skriv ut</button></div>
        <p className="text-xs text-muted-foreground">Välj A4 stående, 100 % skala, inga marginaler och inga sidhuvuden eller sidfötter.</p>
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{COUNT} uppgifter · 4 rader × 3 kolumner.<br />PDF: {pagesLabel(content)} · A4 stående.</p>
      </aside>
      <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">{tasks.length > 0 && <>{showSheet(content) && <SheetAddSub tasks={tasks} answers={false} ownSetup={ownSetup} ownGrid={ownGrid} />}{showKey(content) && <SheetAddSub tasks={tasks} answers ownSetup={ownSetup} ownGrid={ownGrid} />}</>}</main>
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
