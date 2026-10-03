import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { SheetHeader } from "@/components/SheetHeader";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { buildSheetsPdf, saveBlob } from "@/lib/exportPdf";
import { generateThemeWords } from "@/lib/word-search.functions";
import {
  generateWordSearch,
  prepareWordList,
  type WordSearchPuzzle,
  type WordSearchSize,
} from "@/lib/word-search";

export const Route = createFileRoute("/ordgomma")({
  head: () => ({
    meta: [
      { title: "Ordgömma – Räknebladet" },
      {
        name: "description",
        content: "Skapa ordgömmor med eget område och ordlista, klara att skriva ut på A4.",
      },
      { property: "og:title", content: "Ordgömma – Räknebladet" },
      { property: "og:description", content: "Skapa och skriv ut ordgömmor med egna ord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WordSearchPage,
});

interface SavedPuzzle extends WordSearchPuzzle {
  area: string;
  size: WordSearchSize;
}

function WordSearchPage() {
  const [area, setArea] = useState("");
  const [wordInput, setWordInput] = useState("");
  const [size, setSize] = useState<WordSearchSize>(15);
  const [aiWordCount, setAiWordCount] = useState(20);
  const [wordSources, setWordSources] = useState<{ title: string; url: string }[]>([]);
  const [puzzle, setPuzzle] = useState<SavedPuzzle | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [generatingWords, setGeneratingWords] = useState(false);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof buildSheetsPdf>>>(null);
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const buttonClass =
    "w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent";

  function updateInput(update: () => void) {
    update();
    setPuzzle(null);
    setPreview(null);
    setError("");
  }

  function createPuzzle() {
    const topic = area.trim();
    if (!topic) {
      setError("Skriv ett område eller tema.");
      setPuzzle(null);
      return;
    }

    const prepared = prepareWordList(wordInput, size);
    if (prepared.error) {
      setError(prepared.error);
      setPuzzle(null);
      return;
    }

    const generated = generateWordSearch(prepared.words, size);
    if (!generated) {
      setError("Orden gick inte att få plats med. Prova färre eller kortare ord.");
      setPuzzle(null);
      return;
    }

    setPuzzle({ ...generated, area: topic, size });
    setError("");
  }

  async function createThemeWords() {
    const topic = area.trim();
    if (!topic) {
      setError("Skriv ett område eller tema innan du ber AI:n skapa ord.");
      return;
    }
    const current = prepareWordList(wordInput, size);
    if (wordInput.trim() && current.error) {
      setError(current.error);
      return;
    }
    const availableWords = size * size - current.words.length;
    if (aiWordCount > availableWords) {
      setError(
        `Det finns plats för högst ${availableWords} nya ord i den här spelplanen. Välj en större spelplan eller minska antalet.`,
      );
      return;
    }
    const count = aiWordCount;

    setGeneratingWords(true);
    setError("");
    try {
      const result = await generateThemeWords({
        data: {
          area: topic,
          count,
          maxLength: size,
          existingWords: current.words,
        },
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setWordInput((previous) =>
        [
          ...previous
            .split(/\r?\n/)
            .map((word) => word.trim())
            .filter(Boolean),
          ...result.words,
        ].join("\n"),
      );
      setWordSources((previous) => {
        const sources = new Map(previous.map((source) => [source.url, source]));
        for (const source of result.sources) sources.set(source.url, source);
        return [...sources.values()];
      });
      setPuzzle(null);
      setPreview(null);
    } catch {
      setError("AI-orden kunde inte hämtas. Kontrollera anslutningen och försök igen.");
    } finally {
      setGeneratingWords(false);
    }
  }

  function resetForm() {
    setArea("");
    setWordInput("");
    setSize(15);
    setAiWordCount(20);
    setWordSources([]);
    setPuzzle(null);
    setPreview(null);
    setError("");
  }

  async function exportPdf() {
    setBusy(true);
    setError("");
    try {
      setPreview(await buildSheetsPdf("portrait"));
    } catch {
      setError("PDF kunde inte skapas. Försök igen.");
    } finally {
      setBusy(false);
    }
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
          <h2 className="font-display text-xl font-semibold">Ordgömma</h2>
          <label className="block text-sm font-medium">
            Område
            <input
              className="mt-2 w-full rounded-md border bg-background p-2"
              value={area}
              maxLength={100}
              placeholder="Tema"
              onChange={(event) => updateInput(() => setArea(event.target.value))}
            />
          </label>
          <label className="block text-sm font-medium">
            Antal nya ord från AI
            <input
              className="mt-2 w-full rounded-md border bg-background p-2"
              type="number"
              min={1}
              max={size * size}
              value={aiWordCount}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isInteger(value) && value > 0)
                  setAiWordCount(Math.min(size * size, value));
              }}
            />
          </label>
          <button
            className="w-full rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            disabled={generatingWords || busy}
            onClick={createThemeWords}
          >
            {generatingWords ? "Skapar ord med AI…" : "Föreslå ord med AI"}
          </button>
          <p className="text-xs text-muted-foreground">
            Sökning sker på svenska Wikipedia. AI:n använder träffarnas innehåll som underlag.
          </p>
          {wordSources.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Webbkällor till AI-förslagen</summary>
              <ul className="mt-2 space-y-1">
                {wordSources.map((source) => (
                  <li key={source.url}>
                    <a className="underline" href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <label className="block text-sm font-medium">
            Ord – ett per rad
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border bg-background p-2"
              value={wordInput}
              placeholder="Skriv de ord som du vill använda i en lista"
              onChange={(event) => updateInput(() => setWordInput(event.target.value))}
            />
          </label>
          <label className="block text-sm font-medium">
            Storlek på spelplanen
            <select
              className="mt-2 w-full rounded-md border bg-background p-2"
              value={size}
              onChange={(event) =>
                updateInput(() => setSize(Number(event.target.value) as WordSearchSize))
              }
            >
              {[10, 12, 15].map((value) => (
                <option key={value} value={value}>
                  {value} × {value} rutor
                </option>
              ))}
            </select>
          </label>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={createPuzzle}
          >
            Skapa ordgömma
          </button>
          <button
            className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            onClick={resetForm}
          >
            Återställ
          </button>
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <button className={buttonClass} disabled={!puzzle || busy} onClick={exportPdf}>
            {busy ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}
          </button>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            disabled={!puzzle || busy}
            onClick={() => window.print()}
          >
            Skriv ut
          </button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </aside>
        <main
          {...mainProps}
          className="print-area flex min-w-0 flex-1 flex-col items-center gap-6 overflow-auto"
        >
          {puzzle ? (
            <div className="a4-page word-search-page">
              <SheetHeader title="Ordgömma" subtitle={puzzle.area} score="" />
              <div className="word-search-content">
                <section className="word-search-list" aria-label="Ord att hitta">
                  <h3>Hitta orden</h3>
                  <ul>
                    {puzzle.words.map((word) => (
                      <li key={word}>{word}</li>
                    ))}
                  </ul>
                </section>
                <div
                  className="word-search-grid"
                  role="grid"
                  aria-label={`${puzzle.size} gånger ${puzzle.size} bokstäver`}
                  style={{
                    width: `${puzzle.size * 9.1}mm`,
                    gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))`,
                  }}
                >
                  {puzzle.grid.flatMap((row, rowIndex) =>
                    row.map((letter, columnIndex) => (
                      <div role="gridcell" key={`${rowIndex}-${columnIndex}`}>
                        {letter}
                      </div>
                    )),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="no-print rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              Välj område, skriv egna ord och skapa en ordgömma för att förhandsgranska den här.
            </p>
          )}
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
            <button className={buttonClass} onClick={() => saveBlob(preview.blob, "ordgomma")}>
              Ladda ner PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
