import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildSheetsPdf, saveBlob } from "@/lib/exportPdf";
import {
  bingoModes,
  makeBingo,
  makeNumberBingo,
  normalizeBingoWord,
  randomBingoWord,
  type BingoMode,
  type BingoGame,
  type NumberBingoRange,
} from "@/lib/bingo";

const CALLS_PER_PAGE = 60;

export const Route = createFileRoute("/mattebingo")({
  head: () => ({
    meta: [
      { title: "Mattebingo – Räknebladet" },
      {
        name: "description",
        content: "Skapa bingobrickor med matematikuppgifter och lärarens utropslista för utskrift.",
      },
      { property: "og:title", content: "Mattebingo – Räknebladet" },
      {
        property: "og:description",
        content: "Utskrivbara bingobrickor och utropslista i matematik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BingoPage,
});
type BingoExercise = "math" | "numbers-25" | "numbers-75";

function makeExerciseGame(
  exercise: BingoExercise,
  mode: BingoMode,
  count: number,
  free: boolean,
): BingoGame {
  if (exercise === "math") return makeBingo(mode, count, free);
  return makeNumberBingo(exercise === "numbers-25" ? 25 : 75, count, free);
}

function BingoPage() {
  const [exercise, setExercise] = useState<BingoExercise>("math");
  const [mode, setMode] = useState<BingoMode>("multiplication");
  const [count, setCount] = useState(20);
  const [perPage, setPerPage] = useState(2);
  const [free, setFree] = useState(false);
  const [wordInput, setWordInput] = useState("BINGO");
  const [content, setContent] = useState("boards");
  const [game, setGame] = useState<BingoGame | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof buildSheetsPdf>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const isNumberBingo = exercise !== "math";
  const numberRange: NumberBingoRange | null =
    exercise === "numbers-25" ? 25 : exercise === "numbers-75" ? 75 : null;
  const landscape =
    (numberRange === 25 && perPage === 2) ||
    (numberRange === 75 && perPage === 3) ||
    (exercise === "math" && perPage === 2);
  const alternatePerPage = numberRange === 75 ? (perPage === 2 ? 3 : 2) : perPage === 2 ? 4 : 2;
  const bingoWord = normalizeBingoWord(wordInput);
  const gameTitle = numberRange ? `Nummerbingo 1–${numberRange}` : "Mattebingo";
  useEffect(() => {
    setGame(makeExerciseGame(exercise, mode, count, free));
  }, [exercise, mode, count, free]);
  const callsPerPage = numberRange === 75 ? 75 : CALLS_PER_PAGE;
  const field = "mt-2 w-full rounded-md border bg-background p-2";
  const button = "w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent";
  const cardsPerPage = perPage;
  const cardPages = game
    ? Array.from({ length: Math.ceil(game.boards.length / cardsPerPage) }, (_, i) =>
        game.boards.slice(i * cardsPerPage, (i + 1) * cardsPerPage),
      )
    : [];
  const callPages = game
    ? Array.from({ length: Math.ceil(game.calls.length / callsPerPage) }, (_, i) =>
        game.calls.slice(i * callsPerPage, (i + 1) * callsPerPage),
      )
    : [];
  async function pdf() {
    setBusy(true);
    setError("");
    try {
      setPreview(await buildSheetsPdf(landscape ? "landscape" : "portrait"));
    } catch {
      setError("PDF kunde inte skapas. Försök igen.");
    } finally {
      setBusy(false);
    }
  }
  function resetSettings() {
    setExercise("math");
    setMode("multiplication");
    setCount(20);
    setPerPage(2);
    setFree(false);
    setWordInput("BINGO");
    setContent("boards");
    setGame(makeBingo("multiplication", 20, false));
    setPreview(null);
    setError("");
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card px-6 py-4">
        <h1 className="mx-auto max-w-7xl font-display text-2xl font-semibold">Mattespel</h1>
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
        <aside className="no-print w-full shrink-0 space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-6 lg:w-80">
          <h2 className="font-display text-xl font-semibold">{gameTitle}</h2>
          <label className="block text-sm font-medium">
            Övning
            <select
              className={field}
              value={exercise}
              onChange={(e) => {
                const next = e.target.value as BingoExercise;
                setExercise(next);
                setPerPage(next === "numbers-75" ? 3 : 2);
              }}
            >
              <option value="math">Mattebingo</option>
              <option value="numbers-25">Nummerbingo 1–25</option>
              <option value="numbers-75">Nummerbingo 1–75</option>
            </select>
          </label>
          {!isNumberBingo && (
            <>
              <label className="block text-sm font-medium">
                Räknesätt
                <select
                  className={field}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as BingoMode)}
                >
                  {Object.entries(bingoModes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm font-medium">
            Antal olika elevbrickor
            <select
              className={field}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[2, 4, 6, 8, 10, 15, 20, 25, 30, 40].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {numberRange === 75 ? "Brickor per sida" : "Brickor per A4"}: {perPage}
            </p>
            <button
              className={`${button} border-green-300 bg-green-100 text-green-900 hover:bg-green-200`}
              type="button"
              onClick={() => setPerPage(alternatePerPage)}
            >
              Visa {alternatePerPage} brickor per sida
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${button} ${free ? "bg-primary text-primary-foreground" : ""}`}
              type="button"
              aria-pressed={free}
              onClick={() => setFree((value) => !value)}
            >
              Fri mittruta
            </button>
            <button className={button} type="button" onClick={resetSettings}>
              Återställ
            </button>
          </div>
          <label className="block text-sm font-medium">
            Bokstäver på brickorna
            <input
              className={field}
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              aria-invalid={!bingoWord}
            />
          </label>
          {!bingoWord && (
            <p className="text-sm text-destructive" role="alert">
              Skriv ett ord med exakt fem olika bokstäver (A–Z, Å, Ä eller Ö).
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${button} whitespace-normal leading-tight`}
              type="button"
              onClick={() => setWordInput(randomBingoWord(bingoWord ?? undefined))}
            >
              Slumpa
              <br />
              ord
            </button>
            <button
              className={`${button} whitespace-normal leading-tight`}
              disabled={busy}
              onClick={() => setGame(makeExerciseGame(exercise, mode, count, free))}
            >
              Slumpa
              <br />
              spel
            </button>
          </div>
          <label className="block text-sm font-medium">
            Visa och skriv ut
            <select className={field} value={content} onChange={(e) => setContent(e.target.value)}>
              <option value="boards">Elevbrickor</option>
              <option value="calls">Lärarens utropslista med facit</option>
              <option value="all">Elevbrickor och utropslista</option>
            </select>
          </label>
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <button className={button} disabled={busy || !game || !bingoWord} onClick={pdf}>
            {busy ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}
          </button>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            disabled={!game || busy || !bingoWord}
            onClick={() => window.print()}
          >
            Skriv ut
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button className={button} type="button">
                Regler
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regler för {gameTitle}</DialogTitle>
                <DialogDescription>Så här spelar ni Mattebingo.</DialogDescription>
              </DialogHeader>
              {!isNumberBingo && (
                <p className="text-sm">
                  {mode === "addition"
                    ? "Uppgifterna använder termer 1–20."
                    : mode === "subtraction"
                      ? "Uppgifterna använder tal upp till 30 och ger inga negativa svar."
                      : mode === "multiplication"
                        ? "Uppgifterna kommer från multiplikationstabellerna 1–10."
                        : mode === "division"
                          ? "Uppgifterna har heltalssvar 1–30, delare 2–10 och ingen rest."
                          : "Alla fyra räknesätt blandas i utropslistan. Svaren är heltal utan negativa tal."}
                </p>
              )}
              {isNumberBingo && (
                <p className="text-sm">
                  Dra nummer 1–{numberRange} från utropslistan. Kolumnerna följer bokstävernas
                  ordning och har varsitt nummerintervall.
                </p>
              )}
              <p className="text-sm">
                {isNumberBingo
                  ? "Markera numret som ropas upp."
                  : "Läs upp en uppgift och låt eleverna markera svaret på sina brickor."}{" "}
                Fem i rad vågrätt, lodrätt eller diagonalt ger bingo. En fri mittruta räknas som
                markerad.
              </p>
              <p className="text-sm">
                Utropslistan hör ihop med de aktuella brickorna. Byter du spelinställningar eller
                väljer ”Slumpa spel” skapas nya brickor och en ny utropslista.
              </p>
            </DialogContent>
          </Dialog>
          {error && <p role="alert">{error}</p>}
        </aside>
        <main
          {...mainProps}
          className="print-area flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto"
        >
          {content !== "calls" &&
            cardPages.map((cards, page) => (
              <div
                key={`boards-${page}`}
                className={`a4-page bingo-page ${numberRange ? `bingo-number-${numberRange}` : exercise === "math" ? "bingo-math" : ""} ${landscape ? "landscape" : ""} bingo-per-${perPage}`}
              >
                <div className="bingo-cards">
                  {cards.map((cells, card) => (
                    <section key={card} className="bingo-card">
                      {numberRange || exercise === "math" ? (
                        <>
                          <h3>Bricka {page * cardsPerPage + card + 1}</h3>
                          <h4 className="bingo-card-subtitle">{gameTitle}</h4>
                        </>
                      ) : (
                        <h3>
                          {gameTitle} · Bricka {page * cardsPerPage + card + 1}
                        </h3>
                      )}
                      <p
                        className={`bingo-name ${numberRange || exercise === "math" ? "bingo-number-name" : ""}`}
                      >
                        {numberRange || exercise === "math" ? (
                          <>
                            <span className="bingo-number-name-label">Namn:</span>
                            <span className="bingo-name-line" />
                          </>
                        ) : (
                          "Namn: ____________________"
                        )}
                      </p>
                      {numberRange === 75 ? (
                        <div className="bingo-75-panels">
                          <div className="bingo-column-headers" aria-hidden="true">
                            {Array.from(bingoWord ?? "").map((letter, i) => (
                              <span key={i}>{letter}</span>
                            ))}
                          </div>
                          {[0, 1, 2].map((panel) => (
                            <div className="bingo-75-panel" key={panel}>
                              <div className="bingo-grid">
                                {cells.slice(panel * 25, panel * 25 + 25).map((value, i) => (
                                  <div
                                    className={value === null ? "bingo-free-cell" : undefined}
                                    key={i}
                                  >
                                    {value === null ? "FRI" : value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="bingo-column-headers" aria-hidden="true">
                            {Array.from(bingoWord ?? "").map((letter, i) => (
                              <span key={i}>{letter}</span>
                            ))}
                          </div>
                          <div className="bingo-grid">
                            {cells.map((value, i) => (
                              <div
                                className={value === null ? "bingo-free-cell" : undefined}
                                key={i}
                              >
                                {value === null ? "FRI" : value}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <p>Fem i rad – vågrätt, lodrätt eller diagonalt.</p>
                    </section>
                  ))}
                </div>
              </div>
            ))}
          {content !== "boards" &&
            callPages.map((calls, page) => (
              <div key={`calls-${page}`} className="a4-page bingo-page portrait-page">
                <h2 className="bingo-call-title">{gameTitle} – utropslista</h2>
                <p className="bingo-instruction">
                  {isNumberBingo
                    ? "Dra ett nummer, läs upp det och kryssa i det här. Listan hör till de aktuella elevbrickorna."
                    : "Läs upp uppgiften, låt eleverna markera svaret och kryssa i lästa uppgifter. Listan hör till de aktuella elevbrickorna. Samma svar ropas bara en gång."}
                </p>
                <div
                  className={`bingo-call-columns ${numberRange === 75 ? "bingo-call-columns--three" : ""}`}
                >
                  {Array.from({ length: numberRange === 75 ? 3 : 2 }, (_, column) => {
                    const columnCount = numberRange === 75 ? 3 : 2;
                    const split = Math.ceil(calls.length / columnCount);
                    const start = column * split;
                    return (
                      <table
                        key={column}
                        className={`bingo-calls ${isNumberBingo ? "" : "bingo-calls-math"} ${numberRange === 75 ? "bingo-calls-numbers-75" : ""}`}
                      >
                        <thead>
                          <tr>
                            <th>Läst</th>
                            <th>Nr</th>
                            <th>{isNumberBingo ? "Nummer" : "Uppgift"}</th>
                            {!isNumberBingo && <th>Svar</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {calls.slice(start, start + split).map((call, i) => (
                            <tr key={call.answer}>
                              <td>
                                <span className="bingo-call-checkbox" aria-hidden="true" />
                              </td>
                              <td>{page * callsPerPage + start + i + 1}</td>
                              <td>{call.question}</td>
                              {!isNumberBingo && <td>{call.answer}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })}
                </div>
              </div>
            ))}
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
            <button className={button} onClick={() => saveBlob(preview.blob, "mattebingo")}>
              Ladda ner PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
