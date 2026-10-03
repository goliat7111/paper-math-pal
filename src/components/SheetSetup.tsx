import { Fragment } from "react";
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
  const cellH = `${cellSize}mm`;
  const multi = L.partialRows.length > 0;
  // Uppställningen ligger i ett rutnät med en tom rutrad runt om (ring), så
  // alla linjer linjerar exakt. Innehållet förskjuts ett steg (+1 rad/kolumn).
  // Multiplikationens minnessiffror ligger ovanför delprodukterna.
  const carryRowIdx = 4;
  const partialStartRow = multi ? 5 : 4;
  const additionCarryRowIdx = multi ? partialStartRow + L.partialRows.length : -1;
  const productRowIdx = multi ? additionCarryRowIdx + 1 : carryRowIdx + 1;
  const totalRows = productRowIdx + 1; // sista raden är ringens nederkant
  const totalCols = L.nCols + 2;

  // Teckenrad: × plus den undre faktorn högerställd mot ental
  const signRow = L.bottomRow.map((c, i) => (i === L.signCol ? "×" : c));

  // Tomma ringceller runt uppställningen
  const ring: { col: number; row: number }[] = [];
  for (let c = 1; c <= totalCols; c++) {
    ring.push({ col: c, row: 1 }, { col: c, row: totalRows });
  }
  for (let r = 2; r < totalRows; r++) {
    ring.push({ col: 1, row: r }, { col: totalCols, row: r });
  }

  return (
    <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      {showNumber && <div className="mb-1 text-[15px] font-bold text-sheet-ink">{n})</div>}
      <div className="grid-sheet" style={{ gridTemplateColumns: `repeat(${totalCols}, ${cellH})`, gridTemplateRows: multi ? `${cellH} repeat(2, ${cellH}) 4mm repeat(${L.partialRows.length}, ${cellH}) 4mm ${cellH} ${cellH}` : `${cellH} repeat(2, ${cellH}) 4mm ${cellH} ${cellH}` }}>
        {/* Tom rutrad runt uppställningen */}
        {ring.map((cell, i) => (
          <div key={`ring${i}`} className="border border-sheet-grid" style={{ gridColumn: cell.col, gridRow: cell.row }} />
        ))}
        {/* Rad 2: övre faktorn */}
        {L.topRow.map((c, i) => (
          <Cell key={`t${i}`} v={c} col={i + 2} row={2} height={cellH} comma={i === L.commas.top} />
        ))}
        {/* Rad 3: teckenrad */}
        {signRow.map((c, i) => (
          <Cell key={`s${i}`} v={c} col={i + 2} row={3} height={cellH} comma={i === L.commas.bottom} />
        ))}
        {/* Tjockt streck under teckenraden, över hela uppställningens bredd */}
        <div style={{ gridColumn: "2 / -2", gridRow: 3, borderBottom: "2px solid var(--sheet-ink)", position: "relative", zIndex: 1 }} />
        {/* Delprodukter */}
        {L.partialRows.map((p, r) => (
          <Fragment key={`par${r}`}>
            {p.cells.map((c, i) => (
              <Cell
                key={`p${r}-${i}`}
                v={answers ? c : ""}
                col={i + 2}
                row={partialStartRow + r}
                height={cellH}
                answer={answers}
              />
            ))}
          </Fragment>
        ))}
        {/* Plus-tecknet står på sista delproduktraden, vänster om additionsdelen */}
        {multi && (
          <Cell v="+" col={L.sumLeft + 1} row={partialStartRow + L.partialRows.length - 1} height={cellH} />
        )}
        {/* Tjockt streck under delprodukterna, direkt ovanför produkten */}
        {multi && (
          <div
            style={{
              gridColumn: `${L.sumLeft + 1} / ${L.nCols + 2}`,
              gridRow: productRowIdx,
              borderTop: "2px solid var(--sheet-ink)",
              position: "relative",
              zIndex: 1,
            }}
          />
        )}
        {/* Minnessiffrorna från multiplikationen */}
        {L.carryRow.map((c, i) => (
          <div
            key={`mul-cr${i}`}
            className="flex items-center justify-center border border-sheet-grid font-mono text-[11px] font-bold text-sheet-answer"
            style={{ gridColumn: i + 2, gridRow: carryRowIdx, height: "4mm" }}
          >
            {answers ? c : ""}
          </div>
        ))}
        {/* Minnessiffrorna från additionen av delprodukterna */}
        {multi && L.additionCarries.map((c, i) => (
          <div
            key={`add-cr${i}`}
            className="flex items-center justify-center border border-sheet-grid font-mono text-[11px] font-bold text-sheet-answer"
            style={{ gridColumn: i + 2, gridRow: additionCarryRowIdx, height: "4mm" }}
          >
            {answers ? c : ""}
          </div>
        ))}
        {/* Produkten */}
        {L.productRow.map((c, i) => (
          <Cell
            key={`pr${i}`}
            v={answers ? c : ""}
            col={i + 2}
            row={productRowIdx}
            height={cellH}
            answer={answers}
            comma={answers && i === L.commas.product}
          />
        ))}
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
