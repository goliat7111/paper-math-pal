import { Fragment } from "react";
import { digitValue, formatDecimal, setupLayout, type SetupTask } from "@/lib/worksheets";
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
  clean = false,
  showHeader = true,
  startIndex = 0,
  scoreTotal = Math.min(tasks.length, 12),
}: {
  tasks: SetupTask[];
  answers: boolean;
  topDigits: [number, number];
  bottomDigits: [number, number];
  clean?: boolean;
  showHeader?: boolean;
  startIndex?: number;
  scoreTotal?: number;
}) {
  const shown = tasks.slice(0, 12);

  return (
    <div
      className={`a4-page exercise-twelve-page${clean && !answers ? " clean-worksheet" : ""}${!showHeader ? " clean-page-without-header" : ""}`}
    >
      {showHeader && (
        <SheetHeader
          title={answers ? "Multiplikation – Facit" : "Multiplikation"}
          subtitle={`Uppställning · ${digitLabel(topDigits, "siffrigt tal", "siffror")} · ${digitLabel(bottomDigits, "siffrig faktor", "siffror")}${tasks.some((t) => t.dt || t.db) ? " · decimaltal" : ""}`}
          score={`av ${scoreTotal}`}
        />
      )}
      {clean && !answers && (
        <p className="own-setup-instruction">Räkna ut uppgifterna i ditt räknehäfte.</p>
      )}
      <div className="exercise-twelve-grid">
        {shown.map((t, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${startIndex + i + 1}`}>
            <div className="own-setup-expression addsub-expression">
              <span className="own-setup-number">{startIndex + i + 1})</span>
              {clean && !answers && (
                <span>
                  {formatDecimal(digitValue(t.digits), t.dt)} ×{" "}
                  {formatDecimal(digitValue(t.m), t.db)}
                </span>
              )}
            </div>
            {!(clean && !answers) && (
              <div className="exercise-twelve-box">
                <Problem
                  n={startIndex + i + 1}
                  t={t}
                  answers={answers}
                  digitMm={5.5}
                  showNumber={false}
                />
              </div>
            )}
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
  emptyGrid = false,
}: {
  n: number;
  t: SetupTask;
  answers: boolean;
  digitMm: number;
  showNumber?: boolean;
  emptyGrid?: boolean;
}) {
  const L = setupLayout(t);
  const cellSize =
    L.nCols >= 8 ? Math.min(digitMm, 4) : L.nCols >= 7 ? Math.min(digitMm, 4.5) : digitMm;
  const fontSize = `${Math.min(cellSize, 5)}mm`;
  const multi = L.partialRows.length > 0;
  // De två högra kolumnerna är reserverade för multiplikationens minnessiffror.
  const partialStartRow = 5;
  const totalRows = 9;
  const totalCols = 10;
  const carryColumn = totalCols - 1;
  const operationWidth = carryColumn - 2;
  const operationOffset = operationWidth - L.nCols;
  const additionCarryRowIdx = 4;
  const productRowIdx = multi ? 7 : 5;
  const carryValues = multi ? L.partialRows.flatMap((row) => row.carries) : L.carries;
  const gridRows = Array.from({ length: totalRows }, (_, index) =>
    index === 3 ? "3mm" : "minmax(5mm, 1fr)",
  ).join(" ");
  const operationCol = (layoutCol: number) => layoutCol + operationOffset;

  // Teckenrad: × plus den undre faktorn högerställd mot ental
  const signRow = L.bottomRow.map((c, i) => (i === L.signCol ? "×" : c));

  const cells = Array.from({ length: totalRows * totalCols }, (_, index) => ({
    col: (index % totalCols) + 1,
    row: Math.floor(index / totalCols) + 1,
  }));
  const gridStyle = {
    width: "100%",
    height: "100%",
    gridTemplateColumns: `repeat(${totalCols}, minmax(5mm, 1fr))`,
    gridTemplateRows: emptyGrid ? `repeat(${totalRows}, minmax(5mm, 1fr))` : gridRows,
  };
  const gridCells = cells.map((cell, i) => (
    <div
      key={`grid${i}`}
      className="border border-sheet-grid"
      style={{ gridColumn: cell.col, gridRow: cell.row }}
    />
  ));

  return (
    <div
      style={{
        breakInside: "avoid",
        pageBreakInside: "avoid",
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      {showNumber && <div className="mb-1 text-[15px] font-bold text-sheet-ink">{n})</div>}
      {emptyGrid ? (
        <div
          className="grid-sheet multiplication-answer-grid multiplication-answer-grid--empty"
          style={gridStyle}
          aria-hidden="true"
        >
          {gridCells}
        </div>
      ) : (
        <div className="grid-sheet multiplication-answer-grid" style={gridStyle}>
          {gridCells}
          {/* Rad 2: övre faktorn */}
          {L.topRow.map((c, i) => (
            <Cell
              key={`t${i}`}
              v={c}
              col={operationCol(i + 2)}
              row={2}
              fontSize={fontSize}
              comma={i === L.commas.top}
            />
          ))}
          {/* Rad 3: teckenrad */}
          {signRow.map((c, i) => (
            <Cell
              key={`s${i}`}
              v={c}
              col={operationCol(i + 2)}
              row={3}
              fontSize={fontSize}
              comma={i === L.commas.bottom}
            />
          ))}
          {/* Strecket under multiplikationen fortsätter under minnessiffrornas två kolumner. */}
          <div
            style={{
              gridColumn: `${2 + operationOffset} / ${carryColumn}`,
              gridRow: 3,
              borderBottom: "2px solid var(--sheet-ink)",
              position: "relative",
              zIndex: 1,
            }}
          />
          <div
            style={{
              gridColumn: `${carryColumn} / ${totalCols + 1}`,
              gridRow: 3,
              borderBottom: "2px solid var(--sheet-ink)",
              position: "relative",
              zIndex: 1,
            }}
          />
          {/* Delprodukter */}
          {L.partialRows.map((p, r) => (
            <Fragment key={`par${r}`}>
              {p.cells.map((c, i) => (
                <Cell
                  key={`p${r}-${i}`}
                  v={answers ? c : ""}
                  col={operationCol(i + 2)}
                  row={partialStartRow + L.partialRows.length - r - 1}
                  fontSize={fontSize}
                  answer={answers}
                />
              ))}
            </Fragment>
          ))}
          {/* Plus-tecknet står på sista delproduktraden, vänster om additionsdelen */}
          {multi && (
            <Cell
              v="+"
              col={operationCol(L.sumLeft + 1)}
              row={partialStartRow + L.partialRows.length - 1}
              fontSize={fontSize}
            />
          )}
          {/* Streck mellan delprodukterna och summan. */}
          {multi && (
            <div
              style={{
                gridColumn: `${operationCol(L.sumLeft + 1)} / ${carryColumn}`,
                gridRow: productRowIdx,
                borderTop: "2px solid var(--sheet-ink)",
                position: "relative",
                zIndex: 1,
              }}
            />
          )}
          {/* Multiplikationens minnessiffror visas i två rutkolumner ovanför strecket. */}
          {answers &&
            carryValues.map((value, index) => (
              <div
                key={`mul-cr${index}`}
                className="multiplication-carry-digit flex items-center justify-center font-mono text-[9px] font-bold text-sheet-answer"
                style={{
                  gridColumn: carryColumn + (index % 2),
                  gridRow: Math.floor(index / 2) + 1,
                }}
              >
                {value}
              </div>
            ))}
          {/* Minnessiffrorna från additionen av delprodukterna */}
          {multi &&
            L.additionCarries.map((c, i) => (
              <div
                key={`add-cr${i}`}
                className="flex items-center justify-center font-mono text-[9px] font-bold text-sheet-answer"
                style={{
                  gridColumn: operationCol(i + 2),
                  gridRow: additionCarryRowIdx,
                  height: "100%",
                }}
              >
                {answers ? c : ""}
              </div>
            ))}
          {/* Produkten */}
          {L.productRow.map((c, i) => (
            <Cell
              key={`pr${i}`}
              v={answers ? c : ""}
              col={operationCol(i + 2)}
              row={productRowIdx}
              fontSize={fontSize}
              answer={answers}
              comma={answers && i === L.commas.product}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({
  v,
  col,
  row,
  fontSize,
  answer,
  comma,
}: {
  v: string;
  col: number;
  row: number;
  fontSize: string;
  answer?: boolean;
  comma?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex items-center justify-center font-mono tabular-nums text-[20px] text-sheet-ink",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{ gridColumn: col, gridRow: row, height: "100%", fontSize }}
    >
      {v.trim() || "\u00a0"}
      {comma && <span className="worksheet-comma">,</span>}
    </div>
  );
}
