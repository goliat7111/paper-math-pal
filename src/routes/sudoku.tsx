import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Printer, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GamePicker } from "@/components/GamePicker";
import { generateSudokuPuzzle, getSudokuDifficultyLabel, type Difficulty } from "@/lib/sudoku";

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

function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [visibleClues, setVisibleClues] = useState(32);
  const [showSolution, setShowSolution] = useState(false);
  const [puzzleSet, setPuzzleSet] = useState(() => generateSudokuPuzzle("medium", 32));

  const board = useMemo(
    () => (showSolution ? puzzleSet.solution : puzzleSet.puzzle),
    [puzzleSet, showSolution],
  );

  const generateNewPuzzle = (nextDifficulty: Difficulty = difficulty, nextClues = visibleClues) => {
    setPuzzleSet(generateSudokuPuzzle(nextDifficulty, nextClues));
    setShowSolution(false);
  };

  const handleVisibleCluesChange = (value: number) => {
    const nextValue = Math.max(17, Math.min(81, value));
    setVisibleClues(nextValue);
    generateNewPuzzle(difficulty, nextValue);
  };

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          body {
            background: white;
          }

          .sudoku-print-shell {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .sudoku-board-wrap {
            display: flex !important;
            justify-content: center !important;
            overflow: visible !important;
            width: 100% !important;
          }

          .sudoku-board {
            width: min(170mm, 100%) !important;
            max-width: 170mm !important;
            min-width: 0 !important;
            overflow: visible !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-background text-foreground sudoku-print-shell">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Till startsidan
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold">Sudoku-generator</h1>
          <p className="text-sm text-muted-foreground">
            Slumpade sudoku-brickor med utskriftsvänlig layout
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <GamePicker current="sudoku" />

        <div className="no-print mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              <Button type="button" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Skriv ut
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-4 shadow-sm print:border-0 print:bg-white print:p-0">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3 print:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sudoku</p>
              <h2 className="font-display text-2xl font-semibold">
                {getSudokuDifficultyLabel(difficulty)}
              </h2>
            </div>
            <div className="rounded-md border border-dashed border-border px-3 py-1 text-sm text-muted-foreground">
              Namn: ____________________
            </div>
          </div>

          <div className="sudoku-board-wrap flex justify-center overflow-x-auto print:overflow-visible">
            <div className="sudoku-board grid w-full max-w-[min(82vw,560px)] grid-cols-9 overflow-hidden rounded-lg border-[3px] border-slate-900 bg-white print:max-w-[170mm]">
              {board.map((row, rowIndex) =>
                row.map((value, colIndex) => {
                  const isOriginal = puzzleSet.puzzle[rowIndex][colIndex] !== 0 && !showSolution;
                  const isBorderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8;
                  const isBorderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
                  const isBorderLeft = colIndex === 0;
                  const isBorderTop = rowIndex === 0;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={[
                        "flex aspect-square items-center justify-center text-xl font-semibold text-slate-900 sm:text-2xl",
                        isOriginal ? "bg-slate-100" : "bg-white",
                        isBorderLeft
                          ? "border-l-[3px] border-slate-900"
                          : "border-l border-slate-700",
                        isBorderTop
                          ? "border-t-[3px] border-slate-900"
                          : "border-t border-slate-700",
                        isBorderRight
                          ? "border-r-[3px] border-slate-900"
                          : "border-r border-slate-700",
                        isBorderBottom
                          ? "border-b-[3px] border-slate-900"
                          : "border-b border-slate-700",
                      ].join(" ")}
                    >
                      {value === 0 ? "" : value}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
