import { SheetHeader } from "./SheetHeader";

export type GridCount = 2 | 4 | 6 | 8;

/** En 10 × 10-multiplikationsruta med faktorerna 1–10 längs båda kanterna. */
function HundredGrid({ showProducts }: { showProducts: boolean }) {
  return (
    <table className="hundred-grid" aria-label={`${showProducts ? "Ifylld" : "Tom"} multiplikationsruta 1 till 10`}>
      <thead><tr><th aria-label="Faktorer" />{Array.from({ length: 10 }, (_, i) => <th key={i} scope="col">{i + 1}</th>)}</tr></thead>
      <tbody>{Array.from({ length: 10 }, (_, row) => (
        <tr key={row}><th scope="row">{row + 1}</th>{Array.from({ length: 10 }, (_, col) => <td key={col}>{showProducts ? (row + 1) * (col + 1) : null}</td>)}</tr>
      ))}</tbody>
    </table>
  );
}

export function SheetHundredGrid({ count, showProducts }: { count: GridCount; showProducts: boolean }) {
  return (
    <div className="a4-page hundred-grid-page flex flex-col">
      <SheetHeader title="100-rutan" subtitle="Multiplikation" score={`av ${count * 100}`} />
      <div className={`hundred-grid-layout hundred-grid-layout--${count}`}>
        {Array.from({ length: count }, (_, i) => <HundredGrid key={i} showProducts={showProducts} />)}
      </div>
    </div>
  );
}