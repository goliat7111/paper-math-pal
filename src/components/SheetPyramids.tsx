import { SheetHeader } from "./SheetHeader";
import type { NumberPyramid, PyramidMode } from "@/lib/number-pyramids";

export function SheetPyramids({
  pyramids,
  rowCount,
  mode,
  topTotal,
  answers,
  clean = false,
  showHeader = true,
  startIndex = 0,
  scoreTotal = pyramids.length,
}: {
  pyramids: NumberPyramid[];
  rowCount: 3 | 4 | 5;
  mode: PyramidMode;
  topTotal: number;
  answers: boolean;
  clean?: boolean;
  showHeader?: boolean;
  startIndex?: number;
  scoreTotal?: number;
}) {
  const modeLabel = mode === "bottom" ? "Botten-tal" : "Topp-tal";
  return (
    <div className={`a4-page pyramid-page${clean && !answers ? " clean-worksheet" : ""}`}>
      {showHeader && (
        <SheetHeader
          title={answers ? "Talpyramider – Facit" : "Talpyramider"}
          subtitle={`${rowCount} rader · ${modeLabel}${mode === "top" ? ` ${topTotal}` : ""}`}
          score={`av ${scoreTotal}`}
        />
      )}
      <div
        className={`pyramid-grid pyramid-grid--${rowCount}${clean && !answers ? " pyramid-grid--clean" : ""}`}
      >
        {pyramids.map((pyramid, index) => (
          <section
            className="pyramid-task"
            aria-label={`Talpyramid ${startIndex + index + 1}`}
            key={index}
          >
            <strong>{startIndex + index + 1})</strong>
            <div className="pyramid-shape">
              {pyramid.rows.map((row, rowIndex) => (
                <div className="pyramid-row" key={rowIndex}>
                  {row.map((value, cellIndex) => (
                    <div
                      className={`pyramid-cell${answers || pyramid.given[rowIndex]![cellIndex] ? " is-filled" : ""}`}
                      key={cellIndex}
                    >
                      {answers || pyramid.given[rowIndex]![cellIndex] ? value : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
