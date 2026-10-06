import type { CSSProperties } from "react";
import { SheetHeader } from "./SheetHeader";
import {
  STRATEGIES,
  customColumns,
  strategyFor,
  talkamratColumns,
  talkamratRangeLabel,
} from "@/lib/talkamrater";
import type { TalkamratRange } from "@/lib/talkamrater";

export type { TalkamratRange } from "@/lib/talkamrater";

function Table({
  range,
  colors,
  showPairs,
  sums = [],
  fs = 1,
}: {
  range: "10" | "20" | "custom";
  colors: boolean;
  showPairs: boolean;
  sums?: number[];
  fs?: number;
}) {
  const cols = range === "custom" ? customColumns(sums) : talkamratColumns(range);
  const rows = Math.max(...cols.map((c) => c.pairs.length));
  const rowH = `${100 / (rows + 1)}%`;
  return (
    <div
      className={"hundred-grid-box" + (range === "custom" ? " talkamrat-box--custom" : "")}
      style={{ "--rows": rows + 1, "--fs": range === "20" ? fs : 1 } as CSSProperties}
    >
      <table
        className="hundred-grid talkamrat-grid"
        aria-label={range === "custom" ? "Valda talkamrater" : `Talkamrater upp till ${range}`}
      >
        <thead>
          <tr style={{ height: rowH }}>
            {cols.map((c) => (
              <th key={c.sum} scope="col">
                {c.sum}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} style={{ height: rowH }}>
              {cols.map((c) => {
                const p = c.pairs[r];
                if (!p) return <td key={c.sum} className="is-empty" />;
                const label = `${p[0]}+${p[1]}`;
                // Bredaste additionen ("10+10") får en aning mindre storlek så den inte nuddar kanten.
                const wide = range === "20" && label.length > 4;
                const st = colors ? strategyFor(p[0], p[1]) : null;
                return (
                  <td
                    key={c.sum}
                    className={st ? `tk-${st}` : undefined}
                    style={wide ? ({ "--fs": fs * 0.78 } as CSSProperties) : undefined}
                  >
                    {showPairs ? label : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SheetTalkamrater({
  range,
  colors,
  showPairs,
  landscape = false,
  sums = [],
  count = 1,
}: {
  range: TalkamratRange;
  colors: boolean;
  showPairs: boolean;
  landscape?: boolean;
  sums?: number[];
  count?: 1 | 2 | 4;
}) {
  const parts: ("10" | "20" | "custom")[] = range === "both" ? ["10", "20"] : [range];
  const sorted = [...sums].sort((a, b) => a - b);
  const subrange = range === "custom" ? null : talkamratRangeLabel(range);
  const subtitle =
    range === "custom"
      ? `${sorted.join(", ")}-kamrater`
      : range === "both"
        ? "Addition upp till 10 och 20"
        : `Addition ${subrange!.toLowerCase()}`;
  const wide = range === "both" && landscape;
  const useColors = range === "custom" ? false : colors;
  const legend = useColors && (
    <ul className="talkamrat-legend" aria-label="Förklaring av färger">
      {STRATEGIES.map((s) => (
        <li key={s.id}>
          <span className={`tk-swatch tk-${s.id}`} />
          {s.label}
        </li>
      ))}
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
                <Table
                  range={r}
                  colors={useColors}
                  showPairs={showPairs}
                  sums={sorted}
                  fs={perPage === 4 ? 0.8 : 1}
                />
              </section>
            ))}
          </div>
        </div>
        {legend}
      </div>
    );
  }
  return (
    <div
      className={`a4-page hundred-grid-page flex flex-col${wide ? " landscape talkamrat-page--landscape" : ""}`}
    >
      <SheetHeader title="Talkamrater" subtitle={subtitle} score="" />
      <div className={wide ? "talkamrat-layout talkamrat-halves" : "talkamrat-layout"}>
        {wide ? (
          // Två identiska halvor sida vid sida: upp till 10 överst, upp till 20 under,
          // färgförklaringen längst ner — ett klipp i mitten ger varje elev en komplett halva.
          [0, 1].map((set) => (
            <div key={set} className="talkamrat-half">
              {parts.map((p) => (
                <section key={p} className="talkamrat-section">
                  <h3 className="talkamrat-title">{`Talkamrater – upp till ${p}`}</h3>
                  <Table range={p} colors={useColors} showPairs={showPairs} sums={sorted} />
                </section>
              ))}
              {legend}
            </div>
          ))
        ) : range === "custom" ? (
          <div className="talkamrat-grid-4">
            {[0, 1, 2, 3].map((i) => (
              <section key={i} className="talkamrat-section">
                <h3 className="talkamrat-title">{`${sorted.join(", ")}-kamrater — alla kombinationer`}</h3>
                <Table range="custom" colors={false} showPairs={showPairs} sums={sorted} />
              </section>
            ))}
          </div>
        ) : (
          parts.map((p) => (
            <section key={p} className="talkamrat-section">
              <h3 className="talkamrat-title">{`Talkamrater – upp till ${p}`}</h3>
              <Table range={p} colors={useColors} showPairs={showPairs} sums={sorted} />
            </section>
          ))
        )}
      </div>
      {!wide && legend}
    </div>
  );
}
