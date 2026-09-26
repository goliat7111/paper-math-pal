import { setupCarries, setupValue, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

const COLS = 5; // teckenkolumn + 4 siffror (tusental–ental)

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
  const carries = setupCarries(t);
  const product = String(setupValue(t) * t.m).padStart(4, " ").split("");
  const top = [" ", " ", ...t.digits.map(String)];
  const bottom = ["∙", " ", " ", " ", String(t.m)];
  // minnesrad: kolumn index 1..4 motsvarar position 3..0
  const memory = [" ", ...[3, 2, 1, 0].map((p) => (answers && carries[p] ? String(carries[p]) : " "))];
  const ans = [" ", ...product.map((d) => (answers ? d.trim() : " "))];

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-sheet-muted">{n})</div>
      <div className="grid-sheet" style={{ gridTemplateColumns: `repeat(${COLS}, 9mm)` }}>
        {memory.map((c, i) => (
          <Cell key={`m${i}`} v={c} memory />
        ))}
        {top.map((c, i) => (
          <Cell key={`t${i}`} v={c} />
        ))}
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

function Cell({ v, memory, underline, answer }: { v: string; memory?: boolean; underline?: boolean; answer?: boolean }) {
  return (
    <div
      className={[
        "flex items-center justify-center border border-sheet-grid font-mono tabular-nums",
        memory ? "h-[6mm] items-end pb-[1px] text-[11px] text-sheet-answer" : "h-[9mm] text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
