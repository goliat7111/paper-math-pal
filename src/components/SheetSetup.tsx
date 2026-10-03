import { Fragment, type CSSProperties } from "react";
import { setupLayout, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

// Sifferkolumnernas bredd och rutnätets mellanrum anpassas efter längsta talet
const digitLabel = (range: [number, number], singular: string, plural: string) => {
  const [lo, hi] = [...range].sort((a, b) => a - b);
  return lo === hi ? `${lo}-${singular}` : `${lo}–${hi} ${plural}`;
};

export function SheetSetup({
  tasks,
  answers,
  topDigits,
  bottomDigits,
}: {
  tasks: SetupTask[];
  answers: boolean;
  topDigits: [number, number];
  bottomDigits: [number, number];
}) {
  const shown = tasks.slice(0, 12);

  return (
    <div className="a4-page exercise-twelve-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle={`Uppställning · ${digitLabel(topDigits, "siffrigt tal", "siffror")} · ${digitLabel(bottomDigits, "siffrig faktor", "siffror")}${tasks.some((t) => t.dt || t.db) ? " · decimaltal" : ""}`}
        score={`av ${shown.length}`}
      />
      <div className="exercise-twelve-grid">
        {shown.map((t, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
            <div className="own-setup-expression addsub-expression"><span className="own-setup-number">{i + 1})</span></div>
            <div className="exercise-twelve-box"><Problem n={i + 1} t={t} answers={answers} digitMm={5.5} showNumber={false} /></div>
          </section>
        ))}
      </div>
    </div>
  );
}


export function Problem({
  n,
  t,
  answers,
  digitMm,
  showNumber = true,
}: {
  n: number;
  t: SetupTask;
  answers: boolean;
  digitMm: number;
  showNumber?: boolean;
}) {
  const L = setupLayout(t);
  const cellSize = L.nCols >= 8 ? Math.min(digitMm, 4) : L.nCols >= 7 ? Math.min(digitMm, 4.5) : digitMm;
  const gridCols = `repeat(${L.nCols}, ${cellSize}mm) 14mm`;
  const cellH = `${cellSize}mm`;
  const multi = L.partialRows.length > 0;
  // Rad 1 är minnessiffrornas rad, därefter faktorer, streck och delprodukter
  const partialStartRow = multi ? 5 : 4;
  const productRowIdx = partialStartRow + L.partialRows.length;

  // Teckenrad: × plus den undre faktorn högerställd mot ental
  const signRow = L.bottomRow.map((c, i) => (i === L.signCol ? "×" : c));

  return (
    <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      {showNumber && <div className="mb-1 text-[15px] font-bold text-sheet-ink">{n})</div>}
      <div className="setup-surround" style={{ "--setup-cell": cellH } as CSSProperties}>
      <div className="grid-sheet" style={{ gridTemplateColumns: gridCols, gridTemplateRows: multi ? `4mm repeat(2, ${cellH}) 4mm repeat(${L.partialRows.length + 1}, ${cellH})` : `4mm repeat(3, ${cellH})` }}>
        {/* Rad 1: multiplikationens minnessiffror, ovanför den övre faktorn */}
        {L.carryRow.map((c, i) => (
          <div
            key={`cr${i}`}
            className="flex items-center justify-center border border-sheet-grid font-mono text-[11px] font-bold text-sheet-answer"
            style={{ gridColumn: i + 1, gridRow: 1, height: "4mm" }}
          >
            {answers ? c : ""}
          </div>
        ))}
        {/* Rad 2: övre faktorn */}
        {L.topRow.map((c, i) => (
          <Cell key={`t${i}`} v={c} col={i + 1} row={2} height={cellH} comma={i === L.commas.top} />
        ))}
        {/* Rad 3: teckenrad */}
        {signRow.map((c, i) => (
          <Cell key={`s${i}`} v={c} col={i + 1} row={3} height={cellH} comma={i === L.commas.bottom} />
        ))}
        {/* Tjockt streck under teckenraden, över hela uppställningens bredd */}
        <div style={{ gridColumn: "1 / -1", gridRow: 3, borderBottom: "2px solid var(--sheet-ink)", position: "relative", zIndex: 1 }} />
        {/* Lägre rad för additionens minnessiffror, direkt under övre strecket */}
        {multi && L.additionCarries.map((c, i) => (
          <div
            key={`ac${i}`}
            className="flex items-center justify-center border border-sheet-grid font-mono text-[11px] font-bold text-sheet-answer"
            style={{ gridColumn: i + 1, gridRow: 4, height: "4mm" }}
          >
            {answers ? c : ""}
          </div>
        ))}
        {/* Delprodukter (minnessiffrorna ligger i den övre rutan) */}
        {L.partialRows.map((p, r) => (
          <Fragment key={`par${r}`}>
            {p.cells.map((c, i) => (
              <Cell
                key={`p${r}-${i}`}
                v={answers ? c : ""}
                col={i + 1}
                row={partialStartRow + r}
                height={cellH}
                answer={answers}
              />
            ))}
          </Fragment>
        ))}
        {/* Plus-tecknet står på sista delproduktraden, vänster om additionsdelen */}
        {multi && (
          <Cell v="+" col={L.sumLeft} row={partialStartRow + L.partialRows.length - 1} height={cellH} />
        )}
        {/* Tjockt streck ovanför summan, så brett som additionsdelen */}
        {multi && (
          <div
            style={{
              gridColumn: `${L.sumLeft} / ${L.nCols + 1}`,
              gridRow: productRowIdx,
              borderTop: "2px solid var(--sheet-ink)",
              position: "relative",
              zIndex: 1,
            }}
          />
        )}
        {/* Produkten */}
        {L.productRow.map((c, i) => (
          <Cell
            key={`pr${i}`}
            v={answers ? c : ""}
            col={i + 1}
            row={productRowIdx}
            height={cellH}
            answer={answers}
            comma={answers && i === L.commas.product}
          />
        ))}
      </div>
      </div>
    </div>
  );
}

function Cell({
  v,
  col,
  row,
  height,
  answer,
  comma,
}: {
  v: string;
  col: number;
  row: number;
  height: string;
  answer?: boolean;
  comma?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{
        gridColumn: col,
        gridRow: row,
        height,
      }}
    >
      {v.trim() || "\u00a0"}
      {comma && <span className="absolute -right-[0.3em] bottom-[-0.1em] z-10 leading-none">,</span>}
    </div>
  );
}
