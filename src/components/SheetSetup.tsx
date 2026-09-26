import { setupLayout, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

// Kolumner: sifferkolumner à 9 mm + bred minnessifferruta (14 mm) till höger
const DIGIT_MM = 9;
const CARRY_MM = 14;

export function SheetSetup({ tasks, answers, range }: { tasks: SetupTask[]; answers: boolean; range: [number, number] }) {
  return (
    <div className="a4-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle={`Uppställning · 1-talsfaktor (${range[0]}–${range[1]})`}
        score={`av ${tasks.length}`}
      />
      <div className="mt-8 grid grid-cols-3 gap-x-[14mm] gap-y-[12mm] justify-items-center">
        {tasks.map((t, i) => (
          <Problem key={i} n={i + 1} t={t} answers={answers} />
        ))}
      </div>
    </div>
  );
}

function Problem({ n, t, answers }: { n: number; t: SetupTask; answers: boolean }) {
  const L = setupLayout(t);
  const gridCols = `repeat(${L.nCols}, ${DIGIT_MM}mm) ${CARRY_MM}mm`;

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
          <Cell key={`t${i}`} v={c} col={i + 1} row={1} />
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
          <Cell key={`s${i}`} v={c} col={i + 1} row={2} underline />
        ))}
        {/* Rad 3: produkten */}
        {L.productRow.map((c, i) => (
          <Cell key={`p${i}`} v={answers ? c : ""} col={i + 1} row={3} answer={answers} />
        ))}
      </div>
    </div>
  );
}

function Cell({ v, col, row, underline, answer }: { v: string; col: number; row: number; underline?: boolean; answer?: boolean }) {
  return (
    <div
      className={[
        "flex h-[9mm] items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{ gridColumn: col, gridRow: row }}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
