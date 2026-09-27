import { addSubLayout, addSubResult, maxDec, type AddSubTask } from "@/lib/addsub";
import { formatDecimal } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

const SIGN = { add: "+", sub: "−" } as const;

export function AddSubSetup({ t, answers }: { t: AddSubTask; answers: boolean }) {
  const L = addSubLayout(t);
  const cols = L.nCols + 1;
  const cell = (text: string, col: number, row: number, extra = "", key?: string, comma = false) => (
    <div key={key ?? `${row}-${col}`} className={`addsub-cell ${extra}`} style={{ gridColumn: col + 3, gridRow: row + 1 }}>
      {text}{comma && text !== "" && extra.indexOf("addsub-small") < 0 && <span className="division-comma">,</span>}
    </div>
  );
  const top = L.rows.length;
  const totalCols = cols + 2;
  const totalRows = top + 5;
  const ring: React.ReactNode[] = [];
  for (let c = 1; c <= totalCols; c++) {
    ring.push(<div key={`rt${c}`} className="addsub-cell" style={{ gridColumn: c, gridRow: 1 }} aria-hidden />);
    ring.push(<div key={`rb${c}`} className="addsub-cell" style={{ gridColumn: c, gridRow: totalRows }} aria-hidden />);
  }
  for (let r = 2; r < totalRows; r++) {
    ring.push(<div key={`rl${r}`} className="addsub-cell" style={{ gridColumn: 1, gridRow: r }} aria-hidden />);
    ring.push(<div key={`rr${r}`} className="addsub-cell" style={{ gridColumn: totalCols, gridRow: r }} aria-hidden />);
  }
  return (
    <div className="addsub-setup" style={{ gridTemplateColumns: `repeat(${totalCols}, 6.5mm)` }}>
      {ring}
      {L.rows[0]!.map((_, c) => cell(answers ? (t.op === "add" ? L.carries[c]! : L.marks[c]!) : "", c, 1, "addsub-small", `m${c}`))}
      {L.rows.map((row, r) => row.map((d, c) => cell(d, c, r + 2, answers && t.op === "sub" && r === 0 && L.struck[c] ? "is-struck" : "", undefined, L.commas[r] === c)))}
      <div className="addsub-cell" style={{ gridColumn: 2, gridRow: top + 2 }}>{SIGN[t.op]}</div>
      <div className="addsub-line" style={{ gridColumn: "2 / -2", gridRow: top + 3 }} />
      {L.result.map((d, c) => cell(answers ? d : "", c, top + 3, "is-answer", `r${c}`, L.resultComma === c))}
    </div>
  );
}

export function SheetAddSub({ tasks, answers, ownSetup }: { tasks: AddSubTask[]; answers: boolean; ownSetup: boolean }) {
  const op = tasks[0]?.op ?? "add";
  const title = op === "add" ? "Addition" : "Subtraktion";
  const anyDec = tasks.some((t) => maxDec(t) > 0);
  const regroup = op === "add" ? "minnessiffror" : "växling";
  const subtitle = `${anyDec ? "Decimaltal" : "Heltal"} · ${ownSetup ? "Egen uppställning" : "Uppställning"}`;
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
              {ownSetup ? t.terms.map((v, j) => formatDecimal(v, t.decs[j]!)).join(` ${SIGN[t.op]} `) + (answers ? ` = ${formatDecimal(addSubResult(t), maxDec(t))}` : "") : ""}
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
