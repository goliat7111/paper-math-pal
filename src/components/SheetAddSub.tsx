import { addSubLayout, addSubResult, type AddSubTask } from "@/lib/addsub";
import { formatDecimal } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

const SIGN = { add: "+", sub: "−" } as const;

export function AddSubSetup({ t, answers }: { t: AddSubTask; answers: boolean }) {
  const L = addSubLayout(t);
  const cols = L.nCols + 1;
  const cell = (text: string, col: number, row: number, extra = "", key?: string) => (
    <div key={key ?? `${row}-${col}`} className={`addsub-cell ${extra}`} style={{ gridColumn: col + 2, gridRow: row }}>
      {text}{L.comma === col && text !== "" && extra.indexOf("addsub-small") < 0 && <span className="division-comma">,</span>}
    </div>
  );
  const top = L.rows.length;
  return (
    <div className="addsub-setup" style={{ gridTemplateColumns: `repeat(${cols}, 6.5mm)` }}>
      {L.rows[0]!.map((_, c) => cell(answers ? (t.op === "add" ? L.carries[c]! : L.marks[c]!) : "", c, 1, "addsub-small", `m${c}`))}
      {L.rows.map((row, r) => row.map((d, c) => cell(d, c, r + 2, answers && t.op === "sub" && r === 0 && L.struck[c] ? "is-struck" : "")))}
      <div className="addsub-cell" style={{ gridColumn: 1, gridRow: top + 1 }}>{SIGN[t.op]}</div>
      <div className="addsub-line" style={{ gridColumn: "1 / -1", gridRow: top + 2 }} />
      {L.result.map((d, c) => cell(answers ? d : "", c, top + 3, "is-answer", `r${c}`))}
    </div>
  );
}

export function SheetAddSub({ tasks, answers, ownSetup }: { tasks: AddSubTask[]; answers: boolean; ownSetup: boolean }) {
  const op = tasks[0]?.op ?? "add";
  const title = op === "add" ? "Addition" : "Subtraktion";
  const dec = tasks[0]?.dec ?? 0;
  const regroup = op === "add" ? "minnessiffror" : "växling";
  const subtitle = `${dec ? "Decimaltal" : "Heltal"} · ${ownSetup ? "Egen uppställning" : "Uppställning"}`;
  return (
    <div className="a4-page">
      <SheetHeader title={answers ? `${title} – Facit` : title} subtitle={subtitle} score={`av ${tasks.length}`} />
      <p className="own-setup-instruction">
        {answers ? `Facit med uppställning. Små röda siffror visar ${regroup}.` : ownSetup ? "Ställ upp talen i rutan och räkna ut svaret." : "Räkna ut svaret."}
      </p>
      <div className="own-setup-grid addsub-grid">
        {tasks.map((t, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
            <div className="own-setup-expression addsub-expression">
              <span className="own-setup-number">{i + 1})</span>
              {ownSetup ? t.terms.map((v) => formatDecimal(v, t.dec)).join(` ${SIGN[t.op]} `) + (answers ? ` = ${formatDecimal(addSubResult(t), t.dec)}` : "") : ""}
            </div>
            <div className="own-setup-box addsub-box">
              {(answers || !ownSetup) && <AddSubSetup t={t} answers={answers} />}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
