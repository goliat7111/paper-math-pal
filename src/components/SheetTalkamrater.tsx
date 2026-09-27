import type { CSSProperties } from "react";
import { SheetHeader } from "./SheetHeader";

export type TalkamratRange = "10" | "20" | "both" | "custom";
export type Strategy = "dubbel" | "tio" | "ett" | "nastan" | "tva" | "tre";

export const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: "ett", label: "Öka med ett" },
  { id: "tva", label: "Öka med två" },
  { id: "tre", label: "Öka med tre" },
  { id: "dubbel", label: "Dubblor" },
  { id: "nastan", label: "Nästan dubblor" },
  { id: "tio", label: "Tiokamrater" },
];

/** Strategi för en talkamrat — en färg per ruta, i prioritetsordning. */
export function strategyFor(a: number, b: number): Strategy | null {
  if (a === b) return "dubbel";
  if (a + b === 10) return "tio";
  const m = Math.min(a, b);
  if (m === 1) return "ett";
  if (Math.abs(a - b) === 1) return "nastan";
  if (m === 2) return "tva";
  if (m === 3) return "tre";
  return null;
}

type Pair = [number, number];

/** Kolumner (summa → talkamrater), som i Excel-mallen. */
export function talkamratColumns(range: "10" | "20"): { sum: number; pairs: Pair[] }[] {
  if (range === "10") {
    return Array.from({ length: 9 }, (_, i) => {
      const s = i + 2;
      return { sum: s, pairs: Array.from({ length: s - 1 }, (_, k) => [s - k - 1, k + 1] as Pair) };
    });
  }
  return Array.from({ length: 8 }, (_, i) => {
    const s = i + 11;
    return { sum: s, pairs: Array.from({ length: 19 - s }, (_, k) => [9 - k, s - 9 + k] as Pair) };
  });
}

/** Talkamrater för valda summor (2–20) — alla heltalskombinationer, termer 0–9 (vid 19–20 tillåts 10). */
export function customColumns(sums: number[]): { sum: number; pairs: Pair[] }[] {
  return [...sums].sort((a, b) => a - b).map(s => {
    const pairs: Pair[] = [];
    const maxTerm = s <= 18 ? 9 : 10;
    for (let a = Math.min(maxTerm, s); a >= Math.max(0, s - maxTerm); a--) pairs.push([a, s - a]);
    return { sum: s, pairs };
  });
}

function Table({ range, colors, showPairs, sums = [] }: { range: "10" | "20" | "custom"; colors: boolean; showPairs: boolean; sums?: number[] }) {
  const cols = range === "custom" ? customColumns(sums) : talkamratColumns(range);
  const rows = Math.max(...cols.map(c => c.pairs.length));
  const rowH = `${100 / (rows + 1)}%`;
  return (
    <div className={"hundred-grid-box" + (range === "custom" ? " talkamrat-box--custom" : "")} style={{ "--rows": rows + 1 } as CSSProperties}>
      <table className="hundred-grid talkamrat-grid" aria-label={range === "custom" ? "Valda talkamrater" : `Talkamrater upp till ${range}`}>
        <thead><tr style={{ height: rowH }}>{cols.map(c => <th key={c.sum} scope="col">{c.sum}</th>)}</tr></thead>
        <tbody>{Array.from({ length: rows }, (_, r) => (
          <tr key={r} style={{ height: rowH }}>{cols.map(c => {
            const p = c.pairs[r];
            if (!p) return <td key={c.sum} className="is-empty" />;
            const st = colors ? strategyFor(p[0], p[1]) : null;
            return <td key={c.sum} className={st ? `tk-${st}` : undefined}>{showPairs ? `${p[0]}+${p[1]}` : null}</td>;
          })}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function SheetTalkamrater({ range, colors, showPairs, landscape = false, sums = [] }: { range: TalkamratRange; colors: boolean; showPairs: boolean; landscape?: boolean; sums?: number[] }) {
  const parts: ("10" | "20" | "custom")[] = range === "both" ? ["10", "20"] : [range];
  const sorted = [...sums].sort((a, b) => a - b);
  const subtitle = range === "10" ? "Addition upp till 10" : range === "20" ? "Addition upp till 20" : range === "custom" ? `${sorted.join(", ")}-kamrater` : "Addition upp till 10 och 20";
  const wide = range === "both" && landscape;
  const useColors = range === "custom" ? false : colors;
  return (
    <div className={`a4-page hundred-grid-page flex flex-col${wide ? " landscape talkamrat-page--landscape" : ""}`}>
      <SheetHeader title="Talkamrater" subtitle={subtitle} score="" />
      <div className={wide ? "talkamrat-layout talkamrat-layout--landscape" : "talkamrat-layout"}>
        {parts.map(p => (
          <section key={p} className="talkamrat-section">
            <h3 className="talkamrat-title">{p === "custom" ? `${sorted.join(", ")}-kamrater — alla kombinationer` : `Talkamrater – upp till ${p}`}</h3>
            <Table range={p} colors={useColors} showPairs={showPairs} sums={sorted} />
          </section>
        ))}
      </div>
      {useColors && (
        <ul className="talkamrat-legend" aria-label="Förklaring av färger">
          {STRATEGIES.map(s => <li key={s.id}><span className={`tk-swatch tk-${s.id}`} />{s.label}</li>)}
        </ul>
      )}
    </div>
  );
}
