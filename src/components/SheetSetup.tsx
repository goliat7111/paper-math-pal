import { setupLayout, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

// Sifferkolumnernas bredd och rutnätets mellanrum anpassas efter längsta talet
const colsFor = (tasks: SetupTask[]) => Math.max(...tasks.map((t) => setupLayout(t).nCols));
const digitMM = (cols: number) => (cols >= 6 ? 7 : cols >= 5 ? 7.5 : cols >= 4 ? 8 : 9);
const gapMM = (cols: number) => (cols >= 6 ? 4 : cols >= 5 ? 6 : cols >= 4 ? 10 : 14);

export function SheetSetup({
  tasks,
  answers,
  factorRange,
  digitRange,
}: {
  tasks: SetupTask[];
  answers: boolean;
  factorRange: [number, number];
  digitRange: [number, number];
}) {
  const maxCols = colsFor(tasks);
  const [dLo, dHi] = [...digitRange].sort((a, b) => a - b);
  const digitsLabel = dLo === dHi ? `${dLo}-siffrigt tal` : `${dLo}–${dHi} siffror`;
  return (
    <div className="a4-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle={`Uppställning · ${digitsLabel} · 1-talsfaktor ${factorRange[0]}–${factorRange[1]}`}
        score={`av ${tasks.length}`}
      />
      <div
        className="mt-8 grid grid-cols-3 justify-items-center"
        style={{ columnGap: `${gapMM(maxCols)}mm`, rowGap: "12mm" }}
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

  // Teckenrad: × under första siffran i den övre faktorn, faktorn i entalskolumnen
  const signRow = Array.from({ length: L.nCols }, (_, i) =>
    i === L.signCol ? "×" : i === L.factorCol ? String(t.m) : "",
  );

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-sheet-muted">{n})</div>
      <div className="grid-sheet" style={{ gridTemplateColumns: gridCols }}>
        {/* Rad 1: övre faktorn */}
        {L.topRow.map((c, i) => (
          <Cell key={`t${i}`} v={c} col={i + 1} row={1} height={cellH} />
        ))}
        {/* Minnessifferrutan: explicit i sista kolumnen, spänner över rad 1–2 */}
        <div
          className="flex flex-col items-center justify-center gap-[1px] border border-sheet-grid"
          style={{ gridColumn: L.nCols + 1, gridRow: "1 / span 2" }}
        >
          {answers &&
            L.carries.map((c, i) => (
              <div key={i} className="text-[12px] font-bold leading-none text-sheet-answer">
                {c}
              </div>
            ))}
        </div>
        {/* Rad 2: teckenrad med understrykning */}
        {signRow.map((c, i) => (
          <Cell key={`s${i}`} v={c} col={i + 1} row={2} height={cellH} underline />
        ))}
        {/* Rad 3: produkten */}
        {L.productRow.map((c, i) => (
          <Cell key={`p${i}`} v={answers ? c : ""} col={i + 1} row={3} height={cellH} answer={answers} />
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
}: {
  v: string;
  col: number;
  row: number;
  height: string;
  underline?: boolean;
  answer?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{ gridColumn: col, gridRow: row, height }}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
