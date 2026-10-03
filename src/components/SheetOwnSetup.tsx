import { digitValue, formatDecimal, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";
import { Problem } from "./SheetSetup";

/** Samma tolv uppgifter och samma placering på elevblad och facit. */
export function SheetOwnSetup({ tasks, answers }: {
  tasks: SetupTask[];
  answers: boolean;
}) {
  const shown = tasks.slice(0, 12);

  return (
    <div className="a4-page exercise-twelve-page">
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle="Egen uppställning"
        score={`av ${shown.length}`}
      />
      <p className="own-setup-instruction">
        {answers ? "Facit med uppställning till elevbladets uppgifter." : "Skriv din egen uppställning i rutan och räkna ut svaret."}
      </p>
      <div className="exercise-twelve-grid">
        {shown.map((task, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
            <div className="own-setup-expression addsub-expression">
              <span className="own-setup-number">{i + 1})</span>
              {formatDecimal(digitValue(task.digits), task.dt)} · {formatDecimal(digitValue(task.m), task.db)}
            </div>
            <div className={`exercise-twelve-box${answers ? " own-setup-key" : ""}`}>
              {answers && <Problem n={i + 1} t={task} answers digitMm={5.5} showNumber={false} />}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
