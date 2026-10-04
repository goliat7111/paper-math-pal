import { formatBaseValue, solveNumberSystemTask, type NumberBase, type NumberSystemTask } from "@/lib/number-systems";
import { SheetHeader } from "./SheetHeader";

const baseLabel = (base: NumberBase) => base === 16 ? "16" : String(base);
const columns = (tasks: NumberSystemTask[]) => [tasks.slice(0, 10), tasks.slice(10, 20)];

export function SheetNumberSystems({ tasks, base, answers }: {
  tasks: NumberSystemTask[];
  base: NumberBase;
  answers: boolean;
}) {
  return (
    <div className="a4-page number-systems-page">
      <SheetHeader
        title={answers ? "Talsystem – Facit" : "Talsystem"}
        subtitle={`Bas ${baseLabel(base)} · Omvandling`}
        score={`av ${tasks.length}`}
      />
      <p className="number-systems-instructions">
        Omvandla mellan bas 10 och bas {baseLabel(base)}. Visa gärna talets talsorter som potenser av basen.
      </p>
      <div className="number-systems-grid">
        {columns(tasks).map((column, columnIndex) => (
          <div className="number-systems-column" key={columnIndex}>
            {column.map((task, index) => {
              const fromDecimal = task.direction === "to-base";
              const left = fromDecimal
                ? `${task.value}₁₀`
                : `${formatBaseValue(task.value, base)}${base === 16 ? "₁₆" : base === 4 ? "₄" : "₂"}`;
              const right = fromDecimal
                ? base === 16 ? "₁₆" : base === 4 ? "₄" : "₂"
                : "₁₀";
              return (
                <div className="number-systems-task" key={index}>
                  <div className="number-systems-equation">
                    <span>{left} =</span>
                    {answers
                      ? <strong>{solveNumberSystemTask(task, base)}{right}</strong>
                      : <span className="number-systems-answer">&nbsp;</span>}
                  </div>
                  {!answers && <div className="number-systems-work" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
