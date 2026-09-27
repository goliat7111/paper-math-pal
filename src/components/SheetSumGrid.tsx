import { SheetHeader } from "./SheetHeader";

export type SumRange = 10 | 20;

/** Antal termer längs varje kant: 1–5 ger summorna 2–10, 1–10 ger summorna 2–20. */
function sizeFor(range: SumRange) {
  return range === 10 ? 5 : 10;
}

/** Additionsruta med termerna längs kanterna och summorna i cellerna. */
function SumGrid({ range, showSums }: { range: SumRange; showSums: boolean }) {
  const n = sizeFor(range);
  return (
    <table className="hundred-grid" aria-label={`${showSums ? "Ifylld" : "Tom"} additionsruta med summor 2 till ${range}`}>
      <thead><tr><th aria-label="Termer">+</th>{Array.from({ length: n }, (_, i) => <th key={i} scope="col">{i + 1}</th>)}</tr></thead>
      <tbody>{Array.from({ length: n }, (_, row) => (
        <tr key={row}><th scope="row">{row + 1}</th>{Array.from({ length: n }, (_, col) => <td key={col}>{showSums ? row + col + 2 : null}</td>)}</tr>
      ))}</tbody>
    </table>
  );
}

export function SheetSumGrid({ range, showSums }: { range: SumRange; showSums: boolean }) {
  const n = sizeFor(range);
  return (
    <div className="a4-page hundred-grid-page flex flex-col">
      <SheetHeader title={`Additionsrutan 2–${range}`} subtitle="Addition" score={`av ${n * n}`} />
      <div className="hundred-grid-layout hundred-grid-layout--1">
        <SumGrid range={range} showSums={showSums} />
      </div>
    </div>
  );
}
