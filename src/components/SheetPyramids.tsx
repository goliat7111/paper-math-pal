import { SheetHeader } from "./SheetHeader";
import type { NumberPyramid, PyramidMode } from "@/lib/number-pyramids";

export function SheetPyramids({ pyramids, rowCount, mode, topTotal, answers }: {
  pyramids: NumberPyramid[];
  rowCount: 3 | 4 | 5;
  mode: PyramidMode;
  topTotal: number;
  answers: boolean;
}) {
  const modeLabel = mode === "bottom" ? "Botten-tal" : "Topp-tal";
  return (
    <div className="a4-page pyramid-page">
      <SheetHeader
        title={answers ? "Talpyramider – Facit" : "Talpyramider"}
        subtitle={`${rowCount} rader · ${modeLabel}${mode === "top" ? ` ${topTotal}` : ""}`}
        score={`av ${pyramids.length}`}
      />
      <div className={`pyramid-grid pyramid-grid--${rowCount}`}>
        {pyramids.map((pyramid, index) => (
          <section className="pyramid-task" aria-label={`Talpyramid ${index + 1}`} key={index}>
            <strong>{index + 1})</strong>
            <div className="pyramid-shape">
              {pyramid.rows.map((row, rowIndex) => (
                <div className="pyramid-row" key={rowIndex}>
                  {row.map((value, cellIndex) => (
                    <div className={`pyramid-cell${answers || pyramid.given[rowIndex]![cellIndex] ? " is-filled" : ""}`} key={cellIndex}>
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
