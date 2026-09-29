import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { PrintContentChoice, keySuffix, showKey, showSheet, type PrintContent } from "@/components/PrintContentChoice";
import { SheetMixed } from "@/components/SheetMixed";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { genMixed, type MixedLevel, type MixedTasks } from "@/lib/mixed";

export const Route = createFileRoute("/blandade-mallar")({
  head: () => ({
    meta: [
      { title: "Blandade övningar – Räknebladet" },
      { name: "description", content: "Bygg blandade övningar med flera räknesätt på samma A4-blad, med eller utan facit." },
      { property: "og:title", content: "Blandade övningar – Räknebladet" },
      { property: "og:description", content: "Bygg blandade övningar med flera räknesätt på samma A4-blad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlandadeMallarPage,
});

function BlandadeMallarPage() {
  const [level, setLevel] = useState<MixedLevel>(1);
  const [randomDec, setRandomDec] = useState(false);
  const [tasks, setTasks] = useState<MixedTasks | null>(null);
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ url: string; blob: Blob; pages: number; images: string[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const previewUrl = useRef<string | null>(null);
  useEffect(() => { setTasks(genMixed(1)); }, []);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const closePreview = () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; setPreview(null); };
  const downloadPdf = async () => {
    setExporting(true); setError("");
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf("portrait");
      if (!result) throw new Error("Inget blad");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob); previewUrl.current = url;
      setPreview({ ...result, url });
      setFileName(`blandade-ovningar-niva-${level}${randomDec ? "-slumpade-decimaler" : ""}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`);
    } catch { setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut."); }
    finally { setExporting(false); }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName); closePreview();
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Alla räknesätt</Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">Blandade övningar</h1>
          <p className="text-sm text-muted-foreground">Fyra räknesätt · A4</p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold">Inställningar</h2>
          <label className="block text-sm font-medium">Svårighetsgrad
            <select className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={level} onChange={e => { const next = Number(e.target.value) as MixedLevel; setLevel(next); setTasks(genMixed(next, randomDec)); }}>
              <option value={1}>1 – Mycket enkel</option><option value={2}>2 – Enkel</option><option value={3}>3 – Medel</option><option value={4}>4 – Svår</option><option value={5}>5 – Mycket svår</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={randomDec} onChange={e => { setRandomDec(e.target.checked); setTasks(genMixed(level, e.target.checked)); }} />Slumpade decimaler</label>
          {randomDec && <p className="text-xs text-muted-foreground">Uppgifterna får olika antal decimaler på samma blad.</p>}
          <PrintContentChoice value={content} onChange={setContent} />
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setTasks(genMixed(level, randomDec))}><RefreshCw className="h-4 w-4" />Ny slumpad variant</Button>
            <Button variant="outline" className="w-full" disabled={exporting || !tasks} onClick={downloadPdf}><FileDown className="h-4 w-4" />{exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}</Button>
            <Button className="w-full" disabled={!tasks} onClick={() => window.print()}><Printer className="h-4 w-4" />Skriv ut</Button>
          </div>
        </aside>
        <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
          {tasks && showSheet(content) && <SheetMixed tasks={tasks} level={level} answers={false} />}
          {tasks && showKey(content) && <SheetMixed tasks={tasks} level={level} answers />}
        </main>
      </div>
      {preview && <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-label="Förhandsgranskning av PDF" aria-modal="true">
        <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Förhandsgranskning av PDF · {preview.pages} {preview.pages === 1 ? "sida" : "sidor"}</h2><Button variant="ghost" onClick={closePreview}>Stäng</Button></div>
          <PdfPagesPreview images={preview.images} />
          <div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-sm font-medium">Filnamn<div className="mt-1 flex items-center gap-1"><input className="w-full rounded-md border border-input bg-background px-2 py-1.5" value={fileName} onChange={e => setFileName(e.target.value)} /><span>.pdf</span></div></label>
            <Button variant="outline" onClick={closePreview}>Avbryt</Button><Button onClick={savePreview}>Ladda ner</Button></div>
        </div>
      </div>}
    </div>
  );
}
