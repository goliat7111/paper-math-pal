import { Fragment } from "react";
import { setupLayout, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

// Sifferkolumnernas bredd och rutnätets mellanrum anpassas efter längsta talet
const colsFor = (tasks: SetupTask[]) => Math.max(...tasks.map((t) => setupLayout(t).nCols));
const digitMM = (cols: number) => (cols >= 7 ? 6 : cols >= 6 ? 7 : cols >= 5 ? 7.5 : cols >= 4 ? 8 : 9);
const gapMM = (cols: number) => (cols >= 6 ? 4 : cols >= 5 ? 6 : cols >= 4 ? 10 : 14);

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
  const maxCols = colsFor(tasks);
  const multi = tasks.some((t) => t.m.length > 1);
  return (
    <div className="a4-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle={`Uppställning · ${digitLabel(topDigits, "siffrigt tal", "siffror")} · ${digitLabel(bottomDigits, "siffrig faktor", "siffror")}`}
        score={`av ${tasks.length}`}
      />
      <div
        className="mt-8 grid grid-cols-3 justify-items-center"
        style={{ columnGap: `${gapMM(maxCols)}mm`, rowGap: multi ? "8mm" : "12mm" }}
      >
        {tasks.map((t, i) => (
          <Problem key={i} n={i + 1} t={t} answers={answers} digitMm={digitMM(maxCols)} />
        ))}
      </div>
    </div>
  );
}

function Problem({
  n,
  t,
  answers,
  digitMm,
}: {
  n: number;
  t: SetupTask;
  answers: boolean;
  digitMm: number;
}) {
  const L = setupLayout(t);
  const gridCols = `repeat(${L.nCols}, ${digitMm}mm) 14mm`;
  const cellH = `${digitMm}mm`;
  const multi = L.partialRows.length > 0;
  const productRowIdx = 3 + L.partialRows.length;

  // Teckenrad: × plus den undre faktorn högerställd mot ental
  const signRow = L.bottomRow.map((c, i) => (i === L.signCol ? "×" : c));

  const carryBox = (carries: number[], row: string | number) => (
    <div
      className="flex flex-col items-center justify-center gap-[1px] border border-sheet-grid"
      style={{ gridColumn: L.nCols + 1, gridRow: row, minHeight: cellH }}
    >
      {answers &&
        carries.map((c, i) => (
          <div key={i} className="text-[11px] font-bold leading-none text-sheet-answer">
            {c}
          </div>
        ))}
    </div>
  );

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-sheet-muted">{n})</div>
      <div className="grid-sheet" style={{ gridTemplateColumns: gridCols }}>
        {/* Rad 1: övre faktorn */}
        {L.topRow.map((c, i) => (
          <Cell key={`t${i}`} v={c} col={i + 1} row={1} height={cellH} />
        ))}
        {/* Ensiffrig faktor: minnesrutan spänner över rad 1–2 */}
        {!multi && carryBox(L.carries, "1 / span 2")}
        {/* Rad 2: teckenrad med understrykning */}
        {signRow.map((c, i) => (
          <Cell key={`s${i}`} v={c} col={i + 1} row={2} height={cellH} underline />
        ))}
        {/* Delprodukter, var och en med egen minnesruta */}
        {L.partialRows.map((p, r) => (
          <Fragment key={`par${r}`}>
            {p.cells.map((c, i) => (
              <Cell
                key={`p${r}-${i}`}
                v={answers ? c : ""}
                col={i + 1}
                row={3 + r}
                height={cellH}
                answer={answers}
              />
            ))}
            {carryBox(p.carries, 3 + r)}
          </Fragment>
        ))}
        {/* Produkten, med streck ovanför när det finns delprodukter */}
        {L.productRow.map((c, i) => (
          <Cell
            key={`pr${i}`}
            v={answers ? c : ""}
            col={i + 1}
            row={productRowIdx}
            height={cellH}
            answer={answers}
            rule={multi}
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
  underline,
  answer,
  rule,
}: {
  v: string;
  col: number;
  row: number;
  height: string;
  underline?: boolean;
  answer?: boolean;
  rule?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{
        gridColumn: col,
        gridRow: row,
        height,
        ...(rule ? { borderTop: "2px solid var(--sheet-ink)" } : {}),
      }}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
