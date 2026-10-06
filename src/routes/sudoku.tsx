import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Maximize, Minimize, Printer, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { Button } from "@/components/ui/button";
import {
  generateSudokuPuzzle,
  getSudokuDifficultyLabel,
  getSudokuDifficultyForClues,
  SUDOKU_CLUE_RANGES,
  type Difficulty,
} from "@/lib/sudoku";

export const Route = createFileRoute("/sudoku")({
  head: () => ({
    meta: [
      { title: "Sudoku – Räknebladet" },
      {
        name: "description",
        content:
          "Generera slumpade sudoku-pussel i tre svårighetsgrader och skriv ut dem direkt på A4.",
      },
      { property: "og:title", content: "Sudoku – Räknebladet" },
      {
        property: "og:description",
        content: "Slumpade sudokubrickor för utskrift och övning i klassrummet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SudokuPage,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
type PerPage = 1 | 2 | 4 | 8 | 15;
const PER_PAGE: PerPage[] = [1, 2, 4, 8, 15];
// Spelplanens sida i mm och kolumner per rad för varje antal per A4.
const LAYOUT: Record<PerPage, { size: number; cols: number; gap: number }> = {
  1: { size: 176, cols: 1, gap: 0 },
  2: { size: 125, cols: 2, gap: 14 },
  4: { size: 86, cols: 2, gap: 8 },
  8: { size: 62, cols: 4, gap: 6 },
  15: { size: 50, cols: 5, gap: 6 },
};
function makePuzzles(count: number, d: Difficulty, clues: number) {
  return Array.from({ length: count }, () => generateSudokuPuzzle(d, clues));
}

function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [visibleClues, setVisibleClues] = useState(32);
  const [showSolution, setShowSolution] = useState(false);
  const [perPage, setPerPage] = useState<PerPage>(1);
  const [puzzles, setPuzzles] = useState(() => makePuzzles(1, "medium", 32));
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const viewRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === viewRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void viewRef.current?.requestFullscreen?.();
  };

  const generateNewPuzzle = (
    nextDifficulty: Difficulty = difficulty,
    nextClues = visibleClues,
    count: PerPage = perPage,
  ) => {
    setPuzzles(makePuzzles(count, nextDifficulty, nextClues));
    setShowSolution(false);
  };

  const handleVisibleCluesChange = (value: number) => {
    const nextValue = Math.max(17, Math.min(81, value));
    setVisibleClues(nextValue);
    setDifficulty(getSudokuDifficultyForClues(nextValue));
    generateNewPuzzle(getSudokuDifficultyForClues(nextValue), nextValue);
  };

  const clueRange = SUDOKU_CLUE_RANGES[difficulty];

  return (
    <>
      <div className="min-h-screen bg-background text-foreground sudoku-print-shell">
        <header className="no-print border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <Link
              to="/mattespel"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till spelval
            </Link>
            <h1 className="mt-2 font-display text-2xl font-semibold">Sudoku-generator</h1>
            <p className="text-sm text-muted-foreground">
              Slumpade sudoku-brickor med utskriftsvänlig layout
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="no-print mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    onClick={() => {
                      setDifficulty(level);
                      const defaultClues = { easy: 39, medium: 32, hard: 26 }[level];
                      setVisibleClues(defaultClues);
                      generateNewPuzzle(level, defaultClues);
                    }}
                  >
                    {getSudokuDifficultyLabel(level)}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Spelplaner per A4</span>
                {PER_PAGE.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={perPage === n ? "default" : "outline"}
                    onClick={() => {
                      setPerPage(n);
                      generateNewPuzzle(difficulty, visibleClues, n);
                    }}
                  >
                    {n}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <span>Synliga siffror</span>
                  <input
                    type="range"
                    min={17}
                    max={81}
                    step={1}
                    value={visibleClues}
                    aria-label="Antal synliga siffror i sudokut"
                    onChange={(event) => handleVisibleCluesChange(Number(event.target.value))}
                  />
                  <span className="min-w-10 text-right font-semibold">{visibleClues}</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSolution((current) => !current)}
                >
                  {showSolution ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showSolution ? "Dölj lösning" : "Visa lösning"}
                </Button>
                <Button type="button" variant="outline" onClick={() => generateNewPuzzle()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Ny ruta
                </Button>
                <Button type="button" variant="outline" onClick={toggleFullscreen}>
                  <Maximize className="mr-2 h-4 w-4" />
                  Helskärm
                </Button>
                <Button type="button" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Skriv ut
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 print:hidden">
            <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          </div>
          <div
            ref={(el) => {
              viewRef.current = el;
              (mainProps.ref as { current: HTMLElement | null }).current = el;
            }}
            className={`print-area mt-4 flex justify-center overflow-auto${fullscreen ? " items-center bg-muted p-4" : ""}`}
            style={{
              ...mainProps.style,
              position: "static",
              height: fullscreen ? "100vh" : "auto",
            }}
          >
            {fullscreen && (
              <div className="fixed right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-background p-2 shadow print:hidden">
                <Button type="button" size="sm" variant="outline" onClick={() => zoomStep(-1)}>
                  −
                </Button>
                <span className="w-12 text-center text-xs font-semibold tabular-nums">
                  {Math.round(zoom * 100)} %
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => zoomStep(1)}>
                  +
                </Button>
                <Button type="button" size="sm" onClick={toggleFullscreen}>
                  <Minimize className="mr-2 h-4 w-4" />
                  Avsluta helskärm
                </Button>
              </div>
            )}
            <div
              className={`a4-page${perPage === 1 ? "" : " landscape"}`}
              style={{
                padding: perPage === 1 ? "20mm 10mm 10mm" : "10mm",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="flex items-end justify-between"
                style={{ height: "8mm", fontSize: "calc(14px + 4pt)" }}
              >
                <span className="font-semibold">
                  Sudoku – {getSudokuDifficultyLabel(difficulty)} ({clueRange.min}–{clueRange.max}{" "}
                  siffror)
                  {showSolution ? " (lösning)" : ""}
                </span>
                <span className="inline-flex items-end gap-1">
                  Namn:
                  <span
                    aria-hidden="true"
                    className="inline-block border-current"
                    style={{ width: "calc(24ch + 40mm)", borderBottom: "1.5pt solid currentColor" }}
                  />
                </span>
              </div>
              <div
                className="flex-1"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${LAYOUT[perPage].cols}, ${LAYOUT[perPage].size}mm)`,
                  gap: `${LAYOUT[perPage].gap}mm`,
                  marginTop: "7mm",
                  justifyContent: "center",
                  alignContent: "start",
                }}
              >
                {puzzles.map((p, i) => (
                  <SudokuBoard
                    key={i}
                    puzzle={p.puzzle}
                    board={showSolution ? p.solution : p.puzzle}
                    showSolution={showSolution}
                    size={LAYOUT[perPage].size}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function SudokuBoard({
  puzzle,
  board,
  showSolution,
  size,
}: {
  puzzle: number[][];
  board: number[][];
  showSolution: boolean;
  size: number;
}) {
  const thick = size >= 100 ? "0.8mm" : "0.6mm";
  const thin = "0.2mm";
  return (
    <div
      style={{
        width: `${size}mm`,
        height: `${size}mm`,
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "repeat(9, 1fr)",
        border: `${thick} solid currentColor`,
        boxSizing: "border-box",
        fontSize: `${(size / 9) * 0.55}mm`,
      }}
    >
      {board.map((row, r) =>
        row.map((value, c) => {
          const original = puzzle[r]![c] !== 0;
          return (
            <div
              key={`${r}-${c}`}
              className="flex items-center justify-center"
              style={{
                borderRight:
                  c === 8 ? "none" : `${(c + 1) % 3 === 0 ? thick : thin} solid currentColor`,
                borderBottom:
                  r === 8 ? "none" : `${(r + 1) % 3 === 0 ? thick : thin} solid currentColor`,
                fontWeight: original ? 700 : 400,
                opacity: showSolution && !original ? 0.6 : 1,
                lineHeight: 1,
              }}
            >
              {value === 0 ? "" : value}
            </div>
          );
        }),
      )}
    </div>
  );
}
