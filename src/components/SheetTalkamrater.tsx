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
  // Summor 11–20 med ALLA kombinationer a+b=s (a från s ner till hälften, även x+0) — som "Välj tal".
  return Array.from({ length: 10 }, (_, i) => {
    const s = i + 11;
    const pairs: Pair[] = [];
    for (let a = s; a >= Math.ceil(s / 2); a--) pairs.push([a, s - a] as Pair);
    return { sum: s, pairs };
  });
}

/** Talkamrater för valda summor (2–20) — alla heltalskombinationer; över 8 par delas upp i två kolumner. */
export function customColumns(sums: number[]): { sum: number; pairs: Pair[] }[] {
  return [...sums].sort((a, b) => a - b).flatMap(s => {
    const pairs: Pair[] = [];
    for (let a = s; a >= Math.ceil(s / 2); a--) pairs.push([a, s - a]);
    const half = Math.ceil(pairs.length / 2);
    return pairs.length > 8
      ? [{ sum: s, pairs: pairs.slice(0, half) }, { sum: s, pairs: pairs.slice(half) }]
      : [{ sum: s, pairs }];
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
            const label = `${p[0]}+${p[1]}`;
            // Bredaste additionen ("10+10") får en aning mindre storlek så den inte nuddar kanten.
            const wide = range === "20" && label.length > 4;
            const st = colors ? strategyFor(p[0], p[1]) : null;
            return <td key={c.sum} className={st ? `tk-${st}` : undefined} style={wide ? ({ "--fs": 0.82 } as CSSProperties) : undefined}>{showPairs ? label : null}</td>;
          })}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function SheetTalkamrater({ range, colors, showPairs, landscape = false, sums = [], count = 1 }: { range: TalkamratRange; colors: boolean; showPairs: boolean; landscape?: boolean; sums?: number[]; count?: 1 | 2 | 4 }) {
  const parts: ("10" | "20" | "custom")[] = range === "both" ? ["10", "20"] : [range];
  const sorted = [...sums].sort((a, b) => a - b);
  const subtitle = range === "10" ? "Addition upp till 10" : range === "20" ? "Addition upp till 20" : range === "custom" ? `${sorted.join(", ")}-kamrater` : "Addition upp till 10 och 20";
  const wide = range === "both" && landscape;
  const useColors = range === "custom" ? false : colors;
  const legend = useColors && (
    <ul className="talkamrat-legend" aria-label="Förklaring av färger">
      {STRATEGIES.map(s => <li key={s.id}><span className={`tk-swatch tk-${s.id}`} />{s.label}</li>)}
    </ul>
  );
  // Flera tabeller på samma A4-sida (endast för enskilda talområden).
  const perPage = count > 1 && (range === "10" || range === "20") ? count : 1;
  if (perPage > 1) {
    const r = range as "10" | "20";
    return (
      <div className="a4-page hundred-grid-page flex flex-col">
        <SheetHeader title="Talkamrater" subtitle={subtitle} score="" compact={perPage === 4} />
        <div className="talkamrat-layout">
          <div className={perPage === 4 ? "talkamrat-grid-4" : "talkamrat-grid-2"}>
            {Array.from({ length: perPage }, (_, i) => (
              <section key={i} className="talkamrat-section">
                <h3 className="talkamrat-title">{`Talkamrater – upp till ${r}`}</h3>
                <Table range={r} colors={useColors} showPairs={showPairs} sums={sorted} />
              </section>
            ))}
          </div>
        </div>
        {legend}
      </div>
    );
  }
  return (
    <div className={`a4-page hundred-grid-page flex flex-col${wide ? " landscape talkamrat-page--landscape" : ""}`}>
      <SheetHeader title="Talkamrater" subtitle={subtitle} score="" />
      <div className={wide ? "talkamrat-layout talkamrat-layout--landscape" : "talkamrat-layout"}>
        {range === "custom" ? (
          <div className="talkamrat-grid-4">
            {[0, 1, 2, 3].map(i => (
              <section key={i} className="talkamrat-section">
                <h3 className="talkamrat-title">{`${sorted.join(", ")}-kamrater — alla kombinationer`}</h3>
                <Table range="custom" colors={false} showPairs={showPairs} sums={sorted} />
              </section>
            ))}
          </div>
        ) : parts.map(p => (
          <section key={p} className="talkamrat-section">
            <h3 className="talkamrat-title">{`Talkamrater – upp till ${p}`}</h3>
            <Table range={p} colors={useColors} showPairs={showPairs} sums={sorted} />
          </section>
        ))}
      </div>
      {legend}
    </div>
  );
}
