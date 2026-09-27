import { useEffect } from "react";
import { digitValue, formatDecimal, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";
import { Problem, type SetupFit } from "./SheetSetup";

/** Samma åtta uppgifter och samma placering på elevblad och facit. */
export function SheetOwnSetup({ tasks, answers, onFit }: {
  tasks: SetupTask[];
  answers: boolean;
  onFit?: (fit: SetupFit) => void;
}) {
  const shown = tasks.slice(0, 8);
  useEffect(() => {
    onFit?.({ cols: 2, rows: 4, count: shown.length, gapMM: 6 });
  }, [onFit, shown.length]);

  return (
    <div className="a4-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle="Egen uppställning"
        score={`av ${shown.length}`}
      />
      <p className="own-setup-instruction">
        {answers ? "Facit med uppställning till elevbladets uppgifter." : "Skriv din egen uppställning i rutan och räkna ut svaret."}
      </p>
      <div className="own-setup-grid">
        {shown.map((task, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
            <div className="own-setup-expression">
              <span className="own-setup-number">{i + 1})</span>
              {formatDecimal(digitValue(task.digits), task.dt)} · {formatDecimal(digitValue(task.m), task.db)}
            </div>
            <div className={`own-setup-box${answers ? " own-setup-key" : ""}`}>
              {answers && <Problem n={i + 1} t={task} answers digitMm={5} />}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
