
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dice5, Eraser, FileDown, Printer } from "lucide-react";
import { SheetBattleship } from "@/components/SheetBattleship";
import { randomFleet, type Ship } from "@/lib/battleship";
import { buildSheetsPdf, saveBlob } from "@/lib/exportPdf";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";

export const Route = createFileRoute("/sanka-skepp")({ component: MathGamesPage });

function MathGamesPage() {
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [count,setCount] = useState<1|2|4>(2);
  const [rules,setRules] = useState(false);
  const [fleets,setFleets] = useState<Ship[][] | null>(null);
  const [exporting,setExporting] = useState(false);
  const [preview,setPreview] = useState<{blob:Blob;pages:number;images:string[]}|null>(null);
  const [fileName,setFileName] = useState("sanka-skepp");
  const randomize = () => setFleets(Array.from({length:count},()=>randomFleet()));
  const clear = () => setFleets(null);
  const downloadPdf = async () => { setExporting(true); try { setPreview(await buildSheetsPdf(count !== 2 ? "landscape" : "portrait")); } finally { setExporting(false); } };
  return <div className="min-h-screen bg-background">
    <header className="no-print border-b border-border bg-card"><div className="mx-auto max-w-6xl px-6 py-4"><h1 className="font-display text-2xl font-semibold">Mattespel</h1><p className="text-sm text-muted-foreground">Utskrivbara matematikspel · A4</p></div></header>
    <div className="no-print mx-auto max-w-7xl px-6 pt-6"><Link to="/mattespel" className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">← Tillbaka till spelval</Link></div>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-80">
        <div><h2 className="font-display text-xl font-semibold">Sänka skepp</h2><p className="mt-1 text-sm text-muted-foreground">Fast spelplan 10 × 10 · A–J och 1–10</p></div>
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Spelarkort per A4</legend>{([1,2,4] as const).map(n=><label key={n} className="flex items-center gap-2 text-sm"><input type="radio" name="cards" checked={count===n} onChange={()=>{setCount(n);setFleets(null)}} />{n}{n===4 ? " – kompakt, liggande" : n===1 ? " – liggande" : ""}</label>)}</fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rules} onChange={e=>setRules(e.target.checked)} />Skriv ut enkla regler</label>
        <div className="space-y-2"><button onClick={randomize} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Dice5 className="h-4 w-4"/>Slumpa ut skepp</button><button onClick={clear} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"><Eraser className="h-4 w-4"/>Rensa skepp</button></div>
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Varje spelarkort innehåller ”Mina skepp”, ”Fiendens skepp”, namnrad och flottlista. Slumpning ger olika placering på varje kort.</p>
        <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
        <div className="space-y-2"><button disabled={exporting} onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"><FileDown className="h-4 w-4"/>{exporting ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}</button><button type="button" onClick={()=>window.print()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Printer className="h-4 w-4"/>Skriv ut</button></div>
      </aside>
      <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto"><SheetBattleship count={count} fleets={fleets} rules={rules}/></main>
    </div>
    {preview && <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"><div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Förhandsgranskning av PDF</h2><button onClick={()=>setPreview(null)}>Stäng</button></div><PdfPagesPreview images={preview.images}/><div className="flex items-end gap-2"><label className="flex-1 text-sm font-medium">Filnamn<input className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5" value={fileName} onChange={e=>setFileName(e.target.value)}/></label><button onClick={()=>{saveBlob(preview.blob,fileName);setPreview(null)}} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ladda ner</button></div></div></div>}
  </div>;
}
