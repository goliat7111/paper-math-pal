import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetHundredGrid, type GridCount } from "@/components/SheetHundredGrid";
import { SheetSumGrid, type SumRange } from "@/components/SheetSumGrid";
import { SheetTalkamrater, type TalkamratRange } from "@/components/SheetTalkamrater";

type Template = "hundred" | "sum10" | "sum20" | "talkamrater";
const TEMPLATES: { id: Template; label: string }[] = [
  { id: "hundred", label: "100-rutan" },
  { id: "sum10", label: "Addition 2–10" },
  { id: "sum20", label: "Addition 2–20" },
  { id: "talkamrater", label: "Talkamrater" },
];

export const Route = createFileRoute("/mallar")({
  head: () => ({ meta: [
    { title: "Utskrivbara mallar – Räknebladet" },
    { name: "description", content: "Skriv ut ifyllda eller tomma multiplikationsrutor och additionsrutor med summor 2–10 eller 2–20 på A4." },
    { property: "og:title", content: "Utskrivbara mallar – Räknebladet" },
    { property: "og:description", content: "Skriv ut ifyllda eller tomma 100-rutor i multiplikation och additionsrutor på A4." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MallarPage,
});

function MallarPage() {
  const [template, setTemplate] = useState<Template>("hundred");
  const [count, setCount] = useState<GridCount>(4);
  const [showProducts, setShowProducts] = useState(true);
  const [tkRange, setTkRange] = useState<TalkamratRange>("10");
  const [tkColors, setTkColors] = useState(true);
  const [tkSums, setTkSums] = useState<number[]>([8]);
  const selectSum = (n: number) => setTkSums([n]);
  const [tkLayout, setTkLayout] = useState<"staplade" | "liggande">("staplade");
  const tkColorsEff = tkRange === "custom" ? false : tkColors;
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [fileName, setFileName] = useState("100-rutan-4-per-a4");
  const previewUrl = useRef<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(1);
  const zoomStep = (dir: number) => setZoom(z => Math.min(3, Math.max(0.5, Math.round((z + dir * 0.25) * 100) / 100)));
  useEffect(() => {
    const el = mainRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, el.clientWidth / (297 * 96 / 25.4))));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };
  const createPdf = async () => {
    const landscape = template === "talkamrater" && tkRange === "both" && tkLayout === "liggande";
    setError(""); setExporting(true);
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf(landscape ? "landscape" : "portrait");
      if (!result) throw new Error("Inget blad hittades.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob);
      previewUrl.current = url;
      setPreview({ url, blob: result.blob });
      setFileName(template === "talkamrater" ? `talkamrater-${tkRange === "both" ? "10-och-20" : tkRange === "custom" ? [...tkSums].sort((a, b) => a - b).join("-") : `upp-till-${tkRange}`}${tkColorsEff ? "-farg" : ""}${showProducts ? "" : "-tom"}${landscape ? "-liggande" : ""}` : template === "hundred" ? `100-rutan-${count}-per-a4` : `additionsrutan-2-${template === "sum10" ? "10" : "20"}-${count}-per-a4`);
    } catch {
      setError("PDF-filen kunde inte skapas. Försök igen eller välj Skriv ut.");
    } finally { setExporting(false); }
  };
  const savePdf = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName);
    closePreview();
  };

  return <div className="min-h-screen bg-background">
    {template === "talkamrater" && tkRange === "both" && tkLayout === "liggande" && <style media="print">{"@page { size: A4 landscape; margin: 0; }"}</style>}
    <header className="no-print border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Till startsidan</Link>
        <h1 className="font-display text-2xl font-semibold text-foreground">Utskrivbara mallar</h1>
        <p className="text-sm text-muted-foreground">100-rutan · Additionsrutor · Talkamrater</p>
      </div>
    </header>
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
        <h2 className="font-display text-lg font-semibold text-foreground">{TEMPLATES.find(t => t.id === template)?.label}</h2>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Mall</legend>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => <Button key={t.id} type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={template === t.id ? "default" : "outline"} aria-pressed={template === t.id} onClick={() => setTemplate(t.id)}>{t.label}</Button>)}
          </div>
        </fieldset>
        {template === "talkamrater" ? <>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Talområde</legend>
          <div className="flex flex-wrap gap-2">
            {([["10", "Upp till 10"], ["20", "Upp till 20"], ["both", "Båda"], ["custom", "Välj tal"]] as const).map(([v, l]) => <Button key={v} type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={tkRange === v ? "default" : "outline"} aria-pressed={tkRange === v} onClick={() => setTkRange(v)}>{l}</Button>)}
          </div>
        </fieldset>
        {tkRange === "custom" && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Välj tal</legend>
          <select
            className="h-9 w-auto rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value={tkSums[0]}
            aria-label="Välj tal för talkamrater"
            onChange={e => selectSum(Number(e.target.value))}
          >
            {Array.from({ length: 19 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}-kamrater</option>)}
          </select>
        </fieldset>
        )}
        {tkRange !== "custom" && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Färgmarkera strategier</legend>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={tkColors ? "default" : "outline"} aria-pressed={tkColors} onClick={() => setTkColors(true)}>Med färg</Button>
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={!tkColors ? "default" : "outline"} aria-pressed={!tkColors} onClick={() => setTkColors(false)}>Utan färg</Button>
          </div>
        </fieldset>
        )}
        {tkRange === "both" && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Layout</legend>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={tkLayout === "staplade" ? "default" : "outline"} aria-pressed={tkLayout === "staplade"} onClick={() => setTkLayout("staplade")}>Stående</Button>
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={tkLayout === "liggande" ? "default" : "outline"} aria-pressed={tkLayout === "liggande"} onClick={() => setTkLayout("liggande")}>Liggande (2 per sida)</Button>
          </div>
        </fieldset>
        )}
        </> : <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Antal rutor per A4</legend>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 4, 6, 8] as const).map(n => <Button key={n} type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={count === n ? "default" : "outline"} aria-pressed={count === n} aria-label={`${n} rutor per A4`} onClick={() => setCount(n)}>{n} st</Button>)}
          </div>
        </fieldset>}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">{template === "hundred" ? "Produkter i rutorna" : template === "talkamrater" ? "Talkamrater i rutorna" : "Summor i rutan"}</legend>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={showProducts ? "default" : "outline"} aria-pressed={showProducts} onClick={() => setShowProducts(true)}>Visa</Button>
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={!showProducts ? "default" : "outline"} aria-pressed={!showProducts} onClick={() => setShowProducts(false)}>Dölj</Button>
          </div>
        </fieldset>
        <p className="text-sm text-muted-foreground">{template === "talkamrater"
          ? tkRange === "custom"
            ? `Alla kombinationer som ger ${tkSums[0]} · enkel tabell utan färger · stående A4 · 1 sida`
            : `Talkamrater ${tkRange === "both" ? "upp till 10 och 20" : `upp till ${tkRange}`}${showProducts ? "" : " med tomma rutor"}${tkColorsEff ? " · färg per strategi" : ""} · ${tkRange === "both" && tkLayout === "liggande" ? "liggande A4, en tabell per halvsida" : "stående A4"} · 1 sida`
          : template === "hundred"
          ? `${count} ${showProducts ? "ifyllda" : "tomma"} rutor med faktorerna 1–10 · A4 stående · 1 sida`
          : `${count} ${showProducts ? "ifyllda" : "tomma"} rutor med alla summor mellan 2 och ${template === "sum10" ? "10" : "20"} · A4 stående · 1 sida`}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Zoom i förhandsgranskningen</legend>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={zoom === 1 ? "default" : "outline"} aria-pressed={zoom === 1} onClick={() => setZoom(1)}>Hel sida</Button>
            <Button type="button" size="sm" className="h-7 w-7 px-0" variant="outline" aria-label="Zooma ut" disabled={zoom <= 0.5} onClick={() => zoomStep(-1)}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="w-12 text-center text-xs font-semibold tabular-nums" aria-live="polite">{Math.round(zoom * 100)} %</span>
            <Button type="button" size="sm" className="h-7 w-7 px-0" variant="outline" aria-label="Zooma in" disabled={zoom >= 3} onClick={() => zoomStep(1)}><ZoomIn className="h-3.5 w-3.5" /></Button>
          </div>
        </fieldset>
        <div className="space-y-2">
          <Button type="button" variant="outline" className="w-full" onClick={createPdf} disabled={exporting}><FileDown />{exporting ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}</Button>
          <Button type="button" className="w-full" onClick={() => window.print()}><Printer />Skriv ut</Button>
        </div>
      </aside>
<main ref={mainRef} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8" style={{ ["--fit" as string]: fit, ["--zoom" as string]: zoom }}>{template === "talkamrater"
        ? <SheetTalkamrater range={tkRange} colors={tkColors} showPairs={showProducts} landscape={tkRange === "both" && tkLayout === "liggande"} sums={tkSums} />
        : template === "hundred"
        ? <SheetHundredGrid count={count} showProducts={showProducts} />
        : <SheetSumGrid range={(template === "sum10" ? 10 : 20) as SumRange} count={count} showSums={showProducts} />}</main>
    </div>
    {preview && <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-label="Förhandsgranskning av PDF" aria-modal="true">
      <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-lg bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Förhandsgranskning av PDF · 1 sida</h2><Button type="button" variant="ghost" onClick={closePreview}>Stäng</Button></div>
        <iframe title="PDF-förhandsgranskning" src={`${preview.url}#view=Fit`} className="min-h-0 flex-1 rounded-md border border-input" />
        <div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-sm font-medium">Filnamn<input className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5" value={fileName} onChange={e => setFileName(e.target.value)} /></label><span className="pb-2 text-sm text-muted-foreground">.pdf</span>
          <Button type="button" variant="outline" onClick={closePreview}>Avbryt</Button><Button type="button" onClick={savePdf}><FileDown /> Ladda ner</Button></div>
      </div>
    </div>}
  </div>;
}