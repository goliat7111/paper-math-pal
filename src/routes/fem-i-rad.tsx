import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { buildSheetsPdf, saveBlob } from "@/lib/exportPdf";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";

export const Route = createFileRoute("/fem-i-rad")({
  head: () => ({
    meta: [
      { title: "5-i-rad – Räknebladet" },
      {
        name: "description",
        content: "Skriv ut spelplaner för 5-i-rad med tomma rutor eller matematikuppgifter.",
      },
      { property: "og:title", content: "5-i-rad – Räknebladet" },
      { property: "og:description", content: "Skapa utskrivbara 5-i-rad-spel i matematik." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FiveInRow,
});
import { makeBoards, type Mode } from "@/lib/five-in-row";
const layouts = {
  2: { columns: 2, rows: 1, landscape: true },
  4: { columns: 2, rows: 2, landscape: false },
  6: { columns: 2, rows: 3, landscape: false },
  8: { columns: 4, rows: 2, landscape: true },
  10: { columns: 5, rows: 2, landscape: true },
  15: { columns: 5, rows: 3, landscape: true },
} as const;
function FiveInRow() {
  const [count, setCount] = useState<2 | 4 | 6 | 8 | 10 | 15>(2);
  const [mode, setMode] = useState<Mode>("blank");
  const [boards, setBoards] = useState(() => makeBoards("blank"));
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof buildSheetsPdf>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const layout = layouts[count];
  const actionClass =
    "w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent";
  async function exportPdf() {
    setBusy(true);
    setError("");
    try {
      setPreview(await buildSheetsPdf(layout.landscape ? "landscape" : "portrait"));
    } catch {
      setError("PDF kunde inte skapas. Försök igen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-2xl font-semibold">Mattespel</h1>
        </div>
      </header>
      <div className="no-print mx-auto max-w-7xl px-6 pt-6">
        <Link
          to="/mattespel"
          className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          ← Tillbaka till spelval
        </Link>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border bg-card p-5 lg:sticky lg:top-6 lg:w-80">
          <h2 className="font-display text-xl font-semibold">5-i-rad · 5 × 5 rutor</h2>
          <label className="block text-sm font-medium">
            Spelplaner per A4
            <select
              className="mt-2 w-full rounded-md border bg-background p-2"
              value={count}
              onChange={(e) => setCount(Number(e.target.value) as keyof typeof layouts)}
            >
              {([2, 4, 6, 8, 10, 15] as const).map((n) => (
                <option key={n} value={n}>
                  {n} – {layouts[n].landscape ? "liggande" : "stående"}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Räknesätt
            <select
              className="mt-2 w-full rounded-md border bg-background p-2"
              value={mode}
              onChange={(e) => {
                const value = e.target.value as Mode;
                setMode(value);
                setBoards(makeBoards(value));
              }}
            >
              <option value="blank">Tomma rutor</option>
              <option value="addition">Addition · tal 1–10</option>
              <option value="subtraction">Subtraktion · tal 1–10</option>
              <option value="multiplication">Multiplikation · tabell 1–10</option>
              <option value="division">Division · utan rest</option>
              <option value="mixed-boards">Blandat – ett räknesätt per spelplan</option>
              <option value="mixed-cells">Blandat – olika räknesätt i rutorna</option>
            </select>
          </label>
          {mode === "mixed-boards" && (
            <p className="text-sm text-muted-foreground">
              Varje spelplan har ett eget räknesätt. Alla fyra räknesätt används när du väljer minst
              fyra spelplaner.
            </p>
          )}
          {mode === "mixed-cells" && (
            <p className="text-sm text-muted-foreground">
              Alla fyra räknesätt blandas jämnt och placeras slumpmässigt inom varje spelplan.
            </p>
          )}
          {mode !== "blank" && (
            <button className={actionClass} onClick={() => setBoards(makeBoards(mode))}>
              Slumpa nya uppgifter
            </button>
          )}
          <p className="text-sm text-muted-foreground">
            Två spelare delar en spelplan. Turas om att markera en ledig ruta med X eller O.{" "}
            {mode !== "blank" &&
              "Lös först uppgiften och låt motspelaren kontrollera svaret. Fel svar gör att turen går vidare. "}
            Först med fem i rad vågrätt, lodrätt eller diagonalt vinner. Full plan utan vinnare blir
            oavgjort.
          </p>
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <button className={actionClass} disabled={busy} onClick={exportPdf}>
            {busy ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}
          </button>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.print()}
          >
            Skriv ut
          </button>
          {error && <p role="alert">{error}</p>}
        </aside>
        <main
          {...mainProps}
          className="print-area flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto"
        >
          <div
            className={`a4-page five-page five-count-${count} ${layout.landscape ? "landscape" : ""}`}
          >
            <div
              className="five-cards"
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
              }}
            >
              {boards.slice(0, count).map((cells, index) => (
                <section className="five-card" key={index}>
                  <div className="five-head">
                    <h2>5-i-rad</h2>
                    <span>X: __________ O: __________</span>
                  </div>
                  <div className="five-grid">
                    {cells.map((cell, i) => (
                      <div className="five-cell" key={i}>
                        {cell}
                      </div>
                    ))}
                  </div>
                  <p className="five-rules">
                    {mode !== "blank"
                      ? "Rätt svar → markera en ruta. "
                      : "Turas om att markera X eller O. "}
                    Fem i rad vinner – även diagonalt.
                  </p>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Förhandsgranskning av PDF"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
        >
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4">
            <div className="flex justify-between">
              <h2>Förhandsgranskning av PDF</h2>
              <button onClick={() => setPreview(null)}>Stäng</button>
            </div>
            <PdfPagesPreview images={preview.images} />
            <button className={actionClass} onClick={() => saveBlob(preview.blob, "fem-i-rad")}>
              Ladda ner PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
