import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, RefreshCw } from "lucide-react";
import { PrintContentChoice, keySuffix, showKey, showSheet, type PrintContent } from "@/components/PrintContentChoice";
import { genDivision, genExtendDivision, type DivisionTask } from "@/lib/division";
import { divisionProgression, genDivisionProgression } from "@/lib/division-complexity";
import { genChallengeDivision, randomizeSheetDecimals } from "@/lib/mixed-division";
import type { MixedLevel } from "@/lib/mixed";
import { SheetDivision } from "@/components/SheetDivision";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";

export const Route = createFileRoute("/division")({
  head: () => ({ meta: [{ title: "Division – Räknebladet" }, { name: "description", content: "Skapa divisionsblad med åtta uppgifter, egen uppställning och facit på A4." }] }),
  component: DivisionPage,
});

function DivisionPage() {
  const [divMin, setDivMin] = useState("10");
  const [divMax, setDivMax] = useState("99");
  const [min, setMin] = useState("2");
  const [max, setMax] = useState("9");
  const [mode, setMode] = useState<"even" | "rest" | "extra" | "extend" | "challenges" | "progression">("even");
  const [generatedMode, setGeneratedMode] = useState(mode);
  const tasksPerPage = generatedMode === "progression" ? 6 : 8;
  const [level, setLevel] = useState<MixedLevel>(3);
  const withRemainder = mode === "rest";
  const [dec, setDec] = useState(0);
  const [extra, setExtra] = useState(1);
  const [ownSetup, setOwnSetup] = useState(true);
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [tasks, setTasks] = useState<DivisionTask[]>([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; pages: number; images: string[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [challengeDec, setChallengeDec] = useState(false);
  const previewUrl = useRef<string | null>(null);
  useEffect(() => { setTasks(genDivision(10, 99, 2, 9, 8)); return () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }; }, []);
  const generate = () => {
    try {
      const result = mode === "progression" ? genDivisionProgression()
        : mode === "extend" ? genExtendDivision(8)
        : mode === "challenges" ? (challengeDec ? randomizeSheetDecimals(genChallengeDivision(level, 8)) : genChallengeDivision(level, 8)).map(t => {
            const { shown, ...rest } = t;
            if (!shown) return rest;
            const scale = Math.round(Math.log10(rest.dividend / shown.dividend));
            return { ...rest, shownDecimals: { dividend: shown.dividendDecimals + scale, divisor: shown.divisorDecimals } };
          })
        : genDivision(Number(divMin), Number(divMax), Number(min), Number(max), 8, withRemainder, dec, mode === "extra" ? extra : 0);
      setTasks(result); setGeneratedMode(mode); setDirty(false); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Kontrollera inställningarna."); }
  };
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
      setFileName(`division-${ownSetup ? "egen-uppstallning" : "kort-division"}-${generatedMode === "progression" ? "progressionsserie" : mode === "extend" ? "forlanga-forkorta" : mode === "challenges" ? `utmaningar-niva-${level}${challengeDec ? "-slumpade-decimaler" : ""}` : tasks.some(t => t.remainder > 0) ? "med-rest" : mode === "extra" ? extra === -1 ? "slumpade-extra-decimaler" : `${extra}-extra-decimaler` : "utan-rest"}${generatedMode === "progression" ? "" : dec === -1 ? "-slumpade-decimaler" : dec ? `-${dec}-decimaler` : ""}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`);
    } catch { setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut."); }
    finally { setExporting(false); }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName); closePreview();
  };

  return <div className="min-h-screen bg-background">
    <header className="no-print border-b border-border bg-card"><div className="mx-auto max-w-6xl px-6 py-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Alla räknesätt</Link>
      <h1 className="font-display text-2xl font-semibold">Division</h1><p className="text-sm text-muted-foreground">Kort division · A4</p>
    </div></header>
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
        <h2 className="font-display text-lg font-semibold">Inställningar</h2>
        <form onSubmit={e => { e.preventDefault(); generate(); }} className="space-y-5">
          {mode !== "progression" && <><fieldset><legend className="mb-2 text-sm font-medium">Täljare mellan</legend><div className="flex items-end gap-2">
            <label className="text-sm">Från<input aria-label="Täljare från" className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center" type="number" min={2} max={9999} step={1} required value={divMin} onChange={e => { setDivMin(e.target.value); setDirty(true); }} /></label><span className="pb-2">och</span>
            <label className="text-sm">Till<input aria-label="Täljare till" className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center" type="number" min={2} max={9999} step={1} required value={divMax} onChange={e => { setDivMax(e.target.value); setDirty(true); }} /></label>
          </div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">Nämnare mellan</legend><div className="flex items-end gap-2">
            <label className="text-sm">Från<input aria-label="Nämnare från" className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center" type="number" min={2} max={9} step={1} required value={min} onChange={e => { setMin(e.target.value); setDirty(true); }} /></label><span className="pb-2">och</span>
            <label className="text-sm">Till<input aria-label="Nämnare till" className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center" type="number" min={2} max={9} step={1} required value={max} onChange={e => { setMax(e.target.value); setDirty(true); }} /></label>
          </div></fieldset>
          <label className="block text-sm font-medium">Decimaler i täljaren<select className="mt-2 block w-auto rounded-md border border-input bg-background px-2 py-2" value={dec} onChange={e => { const v = Number(e.target.value); setDec(v); if (v !== 0 && mode === "rest") setMode("even"); setDirty(true); }}><option value={0}>Heltal</option><option value={1}>1 decimal</option><option value={2}>2 decimaler</option><option value={3}>3 decimaler</option><option value={-1}>Slumpa (0–3)</option></select></label>
          </>}
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Typ av division</legend>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="remainder" checked={mode === "even"} onChange={() => { setMode("even"); setDirty(true); }} />Går jämnt ut</label>
            <label className={`flex items-center gap-2 text-sm${dec !== 0 ? " opacity-50" : ""}`}><input type="radio" name="remainder" disabled={dec !== 0} checked={mode === "rest"} onChange={() => { setMode("rest"); setDirty(true); }} />Med rest (bara heltal)</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="remainder" checked={mode === "extra"} onChange={() => { setMode("extra"); setDirty(true); }} />Extra decimaler i svaret</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="remainder" checked={mode === "extend"} onChange={() => { setMode("extend"); setDirty(true); }} />Förlänga/förkorta (huvudräkning)</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="remainder" checked={mode === "challenges"} onChange={() => { setMode("challenges"); setDirty(true); }} />Utmaningar (progression)</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="remainder" checked={mode === "progression"} onChange={() => { setMode("progression"); setDirty(true); }} />Progressionsserie</label>
            {mode === "challenges" && <select aria-label="Svårighetsgrad" className="ml-6 block rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={level} onChange={e => { setLevel(Number(e.target.value) as MixedLevel); setDirty(true); }}>
              <option value={1}>Nivå 1 – mycket enkel</option><option value={2}>Nivå 2 – enkel</option><option value={3}>Nivå 3 – medel</option><option value={4}>Nivå 4 – svår</option><option value={5}>Nivå 5 – mycket svår</option>
            </select>}
            {mode === "extra" && <select aria-label="Antal extra decimaler" className="ml-6 block rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={extra} onChange={e => { setExtra(Number(e.target.value)); setDirty(true); }}><option value={1}>1 extra decimal</option><option value={2}>2 extra decimaler</option><option value={3}>3 extra decimaler</option><option value={-1}>Slumpa (1–3)</option></select>}
          </fieldset>
          {mode === "challenges" && <label className="ml-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={challengeDec} onChange={e => { setChallengeDec(e.target.checked); setDirty(true); }} />Slumpade decimaler</label>}
          <p className="text-sm text-muted-foreground">{mode === "progression" ? "Tio heltalsuppgifter i en fast progression med nya slumpade tal. Serien använder egna talområden och ensiffriga nämnare. Facit visar vilket moment varje uppgift tränar." : mode === "challenges" ? `Uppgifter med olika utmaningar på nivå ${level}, t.ex. växling, nollor, rest och decimaler. Facit visar vilken utmaning varje uppgift tränar. Talområdena ovan används inte i det här läget.` : mode === "extend" ? "Nämnaren är ett decimaltal (t.ex. 0,6 eller 0,06). Eleven förlänger eller förkortar så att nämnaren blir ett heltal och räknar sedan i huvudet. Talområdena ovan används inte i det här läget." : dec === -1 ? "Varje uppgift får ett slumpat antal decimaler (0–3) i täljaren. Alla uppgifter går jämnt ut." : mode === "rest" ? "Alla uppgifter får en rest." : mode === "extra" ? extra === -1 ? "Varje uppgift får ett slumpat antal extra decimaler (1–3) i svaret, t.ex. 4 / 8 = 0,5 eller 1 / 8 = 0,125. Nämnare som inte räcker till för en uppgift hoppas över." : `Svaret får ${extra} decimal${extra > 1 ? "er" : ""} mer än täljaren, t.ex. ${extra === 1 ? "4 / 8 = 0,5" : extra === 2 ? "0,8 / 5 = 0,16" : "1 / 8 = 0,125"}. ${extra === 3 ? "Kräver nämnaren 8." : extra === 2 ? "Kräver nämnaren 4 eller 8." : "Nämnare 3, 7 och 9 hoppas över."}` : dec > 0 ? "Alla uppgifter går jämnt ut, t.ex. 4,8 / 4 = 1,2." : "Alla uppgifter går jämnt ut."}</p>
          {mode === "progression" && <div className="text-sm text-muted-foreground"><p className="font-medium">Division - komplexitetsmatris</p><ol className="mt-2 list-decimal space-y-1 pl-5">{divisionProgression.map(step => <li key={step.label}>{step.label}</li>)}</ol></div>}
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Utformning av elevblad</legend>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="division-style" checked={!ownSetup} onChange={() => setOwnSetup(false)} />Med uppställning (kort division)</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="division-style" checked={ownSetup} onChange={() => setOwnSetup(true)} />Egen uppställning i tom ruta</label>
          </fieldset>
          {dirty && <p role="status" className="text-sm text-muted-foreground">Klicka på Ny slumpad variant för att använda de ändrade talinställningarna.</p>}
        </form>
        <PrintContentChoice value={content} onChange={setContent} />
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{tasks.length} uppgifter · högst {tasksPerPage / 2} rader × 2 kolumner per sida.<br />PDF: {Math.ceil(tasks.length / tasksPerPage) * (content === "both" ? 2 : 1)} {tasks.length > tasksPerPage || content === "both" ? "sidor" : "sida"} · A4 stående.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
        <div className="space-y-2"><button type="button" onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"><RefreshCw className="h-4 w-4" />Ny slumpad variant</button>
          <button disabled={exporting || !tasks.length} onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"><FileDown className="h-4 w-4" />{exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}</button>
          <button disabled={!tasks.length} onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Printer className="h-4 w-4" />Skriv ut</button></div>
        <p className="text-xs text-muted-foreground">Välj A4 stående, 100 % skala, inga marginaler och inga sidhuvuden eller sidfötter.</p>
      </aside>
      <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">{tasks.length > 0 && <>{showSheet(content) && Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }, (_, page) => <SheetDivision key={`sheet-${page}`} tasks={tasks.slice(page * tasksPerPage, (page + 1) * tasksPerPage)} answers={false} ownSetup={ownSetup} progression={generatedMode === "progression"} startIndex={page * tasksPerPage} />)}{showKey(content) && Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }, (_, page) => <SheetDivision key={`key-${page}`} tasks={tasks.slice(page * tasksPerPage, (page + 1) * tasksPerPage)} answers ownSetup={ownSetup} progression={generatedMode === "progression"} startIndex={page * tasksPerPage} />)}</>}</main>
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

