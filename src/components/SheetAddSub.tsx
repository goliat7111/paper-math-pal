import { addSubLayout, maxDec, type AddSubTask } from "@/lib/addsub";
import { formatDecimal } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

const SIGN = { add: "+", sub: "−" } as const;
const SETUP_GRID = { cols: 9, rows: 8 };

export function AddSubSetup({
  t,
  answers,
  cellMm,
  fill,
}: {
  t: AddSubTask;
  answers: boolean;
  cellMm?: number;
  fill?: { cols: number; rows: number };
}) {
  const L = addSubLayout(t);
  // Fyllt läge: uppställningens eget rutnät utökas till hela rutan (ett enda lager rutor).
  const totalCols = fill ? Math.max(fill.cols, L.nCols + 3) : L.nCols + 3;
  const totalRows = fill ? Math.max(fill.rows, L.rows.length + 4) : L.rows.length + 4;
  const o = Math.floor((totalCols - (L.nCols + 3)) / 2);
  const cellSize = cellMm ?? 6.5;
  const cellStyle = { "--addsub-cell": fill ? "100%" : `${cellSize}mm` } as React.CSSProperties;
  const cell = (
    text: string,
    col: number,
    row: number,
    extra = "",
    key?: string,
    comma = false,
  ) => (
    <div
      key={key ?? `${row}-${col}`}
      className={`addsub-cell ${extra}`}
      style={{ gridColumn: col + 3 + o, gridRow: row + 1 }}
    >
      {text}
      {comma && text !== "" && extra.indexOf("addsub-small") < 0 && (
        <span className="worksheet-comma">,</span>
      )}
    </div>
  );
  const top = L.rows.length;
  const bg = [];
  for (let r = 1; r <= totalRows; r++)
    for (let c = 1; c <= totalCols; c++)
      bg.push(
        <div key={`bg${r}-${c}`} className="addsub-cell" style={{ gridColumn: c, gridRow: r }} />,
      );
  return (
    <div
      className="addsub-setup"
      style={
        fill
          ? {
              gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
              width: "100%",
              height: "100%",
              ...cellStyle,
            }
          : {
              gridTemplateColumns: `repeat(${totalCols}, ${cellSize}mm)`,
              ...cellStyle,
              ...(cellMm && cellMm > 6.5 ? { fontSize: "20px" } : {}),
            }
      }
    >
      {bg}
      {L.rows[0]!.map((_, c) =>
        cell(
          answers ? (t.op === "add" ? L.carries[c]! : L.marks[c]!) : "",
          c,
          1,
          `addsub-small${answers && t.op === "sub" && L.marksStruck[c] ? " is-borrow-used" : ""}`,
          `m${c}`,
        ),
      )}
      {L.rows.map((row, r) =>
        row.map((d, c) =>
          cell(
            d,
            c,
            r + 2,
            answers && t.op === "sub" && r === 0 && L.struck[c] ? "is-struck" : "",
            undefined,
            L.commas[r] === c,
          ),
        ),
      )}
      <div className="addsub-cell" style={{ gridColumn: 2 + o, gridRow: top + 2 }}>
        {SIGN[t.op]}
      </div>
      <div
        className="addsub-line"
        style={{
          gridColumn: `${2 + o} / ${L.nCols + 3 + o}`,
          gridRow: top + 3,
          alignSelf: "start",
        }}
      />
      {L.result.map((d, c) =>
        cell(answers ? d : "", c, top + 2, "is-answer", `r${c}`, L.resultComma === c),
      )}
    </div>
  );
}

export function SheetAddSub({
  tasks,
  answers,
  ownSetup,
  ownGrid = true,
}: {
  tasks: AddSubTask[];
  answers: boolean;
  ownSetup: boolean;
  ownGrid?: boolean;
}) {
  const op = tasks[0]?.op ?? "add";
  const title = op === "add" ? "Addition" : "Subtraktion";
  const anyDec = tasks.some((t) => maxDec(t) > 0);
  const regroup = op === "add" ? "minnessiffror" : "växling";
  const subtitle = `${anyDec ? "Decimaltal" : "Heltal"} · ${ownSetup ? `Egen uppställning${ownGrid ? " med rutnät" : ""}` : "Uppställning"}`;
  // Större rutor när bladet har uppgifter med 3 termer (mer plats för uppställningen).
  const big = tasks.some((t) => t.terms.length >= 3);
  const layouts = big ? tasks.map(addSubLayout) : [];
  const cellMm = big
    ? Math.round(Math.min(7.5, Math.min(...layouts.map((L) => 56 / (L.nCols + 3)))) * 10) / 10
    : undefined;
  const maxRows = big ? Math.max(...layouts.map((L) => L.rows.length)) : 0;
  const boxHeight = big
    ? `${Math.round((4.5 + (maxRows + 1) * (cellMm ?? 6.5) + 12) * 10) / 10}mm`
    : undefined;
  return (
    <div className="a4-page addsub-page">
      <SheetHeader
        title={answers ? `${title} – Facit` : title}
        subtitle={subtitle}
        score={`av ${tasks.length}`}
      />
      <p className="own-setup-instruction">
        {answers
          ? `Facit med uppställning. Små röda siffror visar ${regroup}.`
          : ownSetup
            ? "Ställ upp talen i rutan och räkna ut svaret."
            : "Räkna ut svaret."}
      </p>
      <div className="own-setup-grid addsub-grid">
        {tasks.map((t, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
            <div className="own-setup-expression addsub-expression">
              <span className="own-setup-number">{i + 1})</span>
              {ownSetup
                ? t.terms.map((v, j) => formatDecimal(v, t.decs[j]!)).join(` ${SIGN[t.op]} `)
                : ""}
            </div>
            <div
              className={`own-setup-box addsub-box${ownSetup && !answers ? (ownGrid ? " addsub-box--own addsub-box--grid" : " addsub-box--own") : ""}`}
              style={boxHeight ? { height: boxHeight } : undefined}
            >
              {(answers || !ownSetup) && (
                <AddSubSetup
                  t={t}
                  answers={answers}
                  {...(cellMm !== undefined ? { cellMm } : {})}
                  {...(!ownSetup ? { fill: SETUP_GRID } : {})}
                />
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
