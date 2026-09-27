import { SheetHeader } from "./SheetHeader";

export type GridCount = 2 | 4 | 6 | 8;

/** En tom 10 × 10-multiplikationsruta med faktorerna 1–10 längs båda kanterna. */
function HundredGrid() {
  return (
    <table className="hundred-grid" aria-label="Tom multiplikationsruta 1 till 10">
      <thead><tr><th aria-label="Faktorer" />{Array.from({ length: 10 }, (_, i) => <th key={i} scope="col">{i + 1}</th>)}</tr></thead>
      <tbody>{Array.from({ length: 10 }, (_, row) => (
        <tr key={row}><th scope="row">{row + 1}</th>{Array.from({ length: 10 }, (_, col) => <td key={col} />)}</tr>
      ))}</tbody>
    </table>
  );
}

export function SheetHundredGrid({ count }: { count: GridCount }) {
  return (
    <div className="a4-page hundred-grid-page flex flex-col">
      <SheetHeader title="100-rutan" subtitle="Multiplikation · 1–10" score={`av ${count * 100}`} />
      <div className={`hundred-grid-layout hundred-grid-layout--${count}`}>
        {Array.from({ length: count }, (_, i) => <HundredGrid key={i} />)}
      </div>
    </div>
  );
}