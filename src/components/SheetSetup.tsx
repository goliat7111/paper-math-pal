import { setupCarries, setupValue, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

// Kolumner: tusental · hundratal · tiotal · ental + bred minnessifferruta till höger
const GRID = "repeat(4, 9mm) 14mm";

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
  // Minnessiffror i beräkningsordning (ental först), endast de som uppstår
  const carries = setupCarries(t).slice(1).filter((c) => c > 0);
  const product = String(setupValue(t) * t.m).padStart(4, " ").split("");
  const top = [" ", ...t.digits.map(String)];
  // ×-tecknet under första siffran i den övre faktorn, faktorn i entalskolumnen
  const bottom = [" ", "×", " ", String(t.m)];
  const ans = product.map((d) => (answers ? d.trim() : " "));

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-sheet-muted">{n})</div>
      <div className="grid-sheet" style={{ gridTemplateColumns: GRID }}>
        {top.map((c, i) => (
          <Cell key={`t${i}`} v={c} />
        ))}
        {/* Minnessifferruta till höger: spänner över talraden och teckenraden */}
        <div
          className="flex flex-col items-center justify-center gap-[1px] border border-sheet-grid"
          style={{ gridRow: "1 / span 2" }}
        >
          {answers &&
            carries.map((c, i) => (
              <div key={i} className="text-[12px] font-bold leading-none text-sheet-answer">
                {c}
              </div>
            ))}
        </div>
        {bottom.map((c, i) => (
          <Cell key={`b${i}`} v={c} underline />
        ))}
        {ans.map((c, i) => (
          <Cell key={`a${i}`} v={c} answer={answers} />
        ))}
      </div>
    </div>
  );
}

function Cell({ v, underline, answer }: { v: string; underline?: boolean; answer?: boolean }) {
  return (
    <div
      className={[
        "flex h-[9mm] items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
