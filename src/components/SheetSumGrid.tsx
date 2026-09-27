import type { CSSProperties } from "react";
import { SheetHeader } from "./SheetHeader";
import type { GridCount } from "./SheetHundredGrid";

export type SumRange = 10 | 20;

/** Antal termer längs varje kant: 1–5 ger summorna 2–10, 1–10 ger summorna 2–20. */
function sizeFor(range: SumRange) {
  return range === 10 ? 5 : 10;
}

/** Additionsruta med termerna längs kanterna och summorna i cellerna. */
function SumGrid({ range, count, showSums }: { range: SumRange; count: GridCount; showSums: boolean }) {
  const n = sizeFor(range);
  const rowH = `${100 / (n + 1)}%`; // rubrikrad + n rader — alla lika höga
  // Förstoringsfaktor endast för 2–20 i minsta varianten (8 rutor per sida).
  const fs = range === 20 && count === 8 ? 1.35 : 1;
  return (
    <div className="hundred-grid-box" style={{ "--rows": n + 1, "--fs": fs } as CSSProperties}>
    <table className="hundred-grid" aria-label={`${showSums ? "Ifylld" : "Tom"} additionsruta med summor 2 till ${range}`}>
      <thead style={{ height: rowH }}><tr style={{ height: rowH }}><th aria-label="Additionstecken">+</th>{Array.from({ length: n }, (_, i) => <th key={i} scope="col">{i + 1}</th>)}</tr></thead>
      <tbody>{Array.from({ length: n }, (_, row) => (
        <tr key={row} style={{ height: rowH }}><th scope="row">{row + 1}</th>{Array.from({ length: n }, (_, col) => <td key={col}>{showSums ? row + col + 2 : null}</td>)}</tr>
      ))}</tbody>
    </table>
    </div>
  );
}

export function SheetSumGrid({ range, count, showSums }: { range: SumRange; count: GridCount; showSums: boolean }) {
  const n = sizeFor(range);
  return (
    <div className="a4-page hundred-grid-page flex flex-col">
      <SheetHeader title={`Additionsrutan 2–${range}`} subtitle="Addition" score={`av ${count * n * n}`} />
      <div className={`hundred-grid-layout hundred-grid-layout--${count}`}>
        {Array.from({ length: count }, (_, i) => <SumGrid key={i} range={range} count={count} showSums={showSums} />)}
      </div>
    </div>
  );
}
