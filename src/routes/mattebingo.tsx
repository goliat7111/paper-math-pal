import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SheetHeader } from "@/components/SheetHeader";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { buildSheetsPdf, saveBlob } from "@/lib/exportPdf";
import { bingoModes, makeBingo, type BingoMode, type BingoGame } from "@/lib/bingo";

export const Route = createFileRoute("/mattebingo")({ component: BingoPage });
function BingoPage() {
  const [mode, setMode] = useState<BingoMode>("multiplication");
  const [count, setCount] = useState(20);
  const [perPage, setPerPage] = useState(2);
  const [free, setFree] = useState(false);
  const [content, setContent] = useState("boards");
  const [game, setGame] = useState<BingoGame | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof buildSheetsPdf>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  useEffect(() => { setGame(makeBingo(mode, count, free)); }, [mode, count, free]);
  const field = "mt-2 w-full rounded-md border bg-background p-2";
  const button = "w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent";
  const cardPages = game ? Array.from({ length: Math.ceil(game.boards.length / perPage) }, (_, i) => game.boards.slice(i * perPage, (i + 1) * perPage)) : [];
  const callPages = game ? Array.from({ length: Math.ceil(game.calls.length / 80) }, (_, i) => game.calls.slice(i * 80, (i + 1) * 80)) : [];
  async function pdf() {
    setBusy(true); setError("");
    try { setPreview(await buildSheetsPdf("portrait")); }
    catch { setError("PDF kunde inte skapas. Försök igen."); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background">
    <header className="no-print border-b bg-card px-6 py-4"><h1 className="mx-auto max-w-7xl font-display text-2xl font-semibold">Mattespel</h1></header>
    <div className="no-print mx-auto max-w-7xl px-6 pt-6"><Link to="/mattespel" className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">← Tillbaka till spelval</Link></div>
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
      <aside className="no-print w-full shrink-0 space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-6 lg:w-80">
        <h2 className="font-display text-xl font-semibold">Mattebingo</h2>
        <label className="block text-sm font-medium">Räknesätt<select className={field} value={mode} onChange={e => setMode(e.target.value as BingoMode)}>{Object.entries(bingoModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <p className="text-sm text-muted-foreground">{mode === "addition" ? "Termer 1–20." : mode === "subtraction" ? "Tal upp till 30, utan negativa svar." : mode === "multiplication" ? "Multiplikationstabellerna 1–10." : mode === "division" ? "Heltalssvar 1–30, delare 2–10. Ingen rest." : "Alla fyra räknesätt i samma utropslista. Heltalssvar, utan negativa tal."}</p>
        <label className="block text-sm font-medium">Antal olika elevbrickor<select className={field} value={count} onChange={e => setCount(Number(e.target.value))}>{[2,4,6,8,10,15,20,25,30,40].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="block text-sm font-medium">Brickor per A4<select className={field} value={perPage} onChange={e => setPerPage(Number(e.target.value))}><option value={2}>2 – stora brickor</option><option value={4}>4 – mindre brickor</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={e => setFree(e.target.checked)} />Fri mittruta</label>
        <button className={button} disabled={busy} onClick={() => setGame(makeBingo(mode, count, free))}>Slumpa nytt spel</button>
        <p className="text-sm text-muted-foreground">Läs en uppgift från utropslistan. Eleverna markerar svaret. Fem i rad vågrätt, lodrätt eller diagonalt ger bingo. En fri mittruta räknas som markerad.</p>
        <label className="block text-sm font-medium">Visa och skriv ut<select className={field} value={content} onChange={e => setContent(e.target.value)}><option value="boards">Elevbrickor</option><option value="calls">Lärarens utropslista med facit</option><option value="all">Elevbrickor och utropslista</option></select></label>
        <p className="text-xs text-muted-foreground">Byt mellan brickor och utropslista för samma spel. ”Slumpa nytt spel” eller ändrade spelinställningar skapar nya brickor och en ny lista.</p>
        <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
        <button className={button} disabled={busy || !game} onClick={pdf}>{busy ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}</button>
        <button className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground" disabled={!game || busy} onClick={() => window.print()}>Skriv ut</button>
        {error && <p role="alert">{error}</p>}
      </aside>
      <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto">
        {content !== "calls" && cardPages.map((cards, page) => <div key={`boards-${page}`} className={`a4-page bingo-page bingo-per-${perPage}`}>
          <SheetHeader title="Mattebingo" subtitle={bingoModes[mode]} score="" compact />
          <div className="bingo-cards">{cards.map((cells, card) => <section key={card} className="bingo-card">
            <h3>Mattebingo · Bricka {page * perPage + card + 1}</h3>
            <p>Namn: ____________________</p>
            <div className="bingo-grid">{cells.map((value, i) => <div key={i}>{value === null ? "FRI" : value}</div>)}</div>
            <p>Fem i rad – vågrätt, lodrätt eller diagonalt.</p>
          </section>)}</div>
        </div>)}
        {content !== "boards" && callPages.map((calls, page) => <div key={`calls-${page}`} className="a4-page bingo-page">
          <SheetHeader title="Mattebingo – utropslista" subtitle={bingoModes[mode]} score="" compact />
          <p className="bingo-instruction">Läs upp uppgiften, låt eleverna markera svaret och kryssa i lästa uppgifter. Listan hör till de aktuella elevbrickorna. Samma svar ropas bara en gång.</p>
          <div className="bingo-call-columns">{[0, 1].map(column => {
            const split = Math.ceil(calls.length / 2);
            const start = column * split;
            return <table key={column} className="bingo-calls"><thead><tr><th>Läst</th><th>Nr</th><th>Uppgift</th><th>Svar</th></tr></thead><tbody>{calls.slice(start, start + split).map((call, i) => <tr key={call.answer}><td>□</td><td>{page * 80 + start + i + 1}</td><td>{call.question}</td><td>{call.answer}</td></tr>)}</tbody></table>;
          })}</div>
        </div>)}
      </main>
    </div>
    {preview && <div role="dialog" aria-modal="true" aria-label="Förhandsgranskning av PDF" className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"><div className="flex max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4"><div className="flex justify-between"><h2>Förhandsgranskning av PDF</h2><button onClick={() => setPreview(null)}>Stäng</button></div><PdfPagesPreview images={preview.images} /><button className={button} onClick={() => saveBlob(preview.blob, "mattebingo")}>Ladda ner PDF</button></div></div>}
  </div>;
}