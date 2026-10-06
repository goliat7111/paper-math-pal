import { digitValue, formatDecimal, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";
import { Problem } from "./SheetSetup";

/** Samma tolv uppgifter och samma placering på elevblad och facit. */
export function SheetOwnSetup({
  tasks,
  answers,
  ownGrid = true,
  clean = false,
  showHeader = true,
  startIndex = 0,
  scoreTotal = Math.min(tasks.length, 12),
}: {
  tasks: SetupTask[];
  answers: boolean;
  ownGrid?: boolean;
  clean?: boolean;
  showHeader?: boolean;
  startIndex?: number;
  scoreTotal?: number;
}) {
  const shown = tasks.slice(0, 12);

  return (
    <div
      className={`a4-page exercise-twelve-page${clean && !answers ? " clean-worksheet" : ""}${!showHeader ? " clean-page-without-header" : ""}`}
    >
      {showHeader && (
        <SheetHeader
          title={answers ? "Multiplikation – Facit" : "Multiplikation"}
          subtitle={`Egen uppställning${ownGrid ? " med rutnät" : ""}`}
          score={`av ${scoreTotal}`}
        />
      )}
      <p className="own-setup-instruction">
        {answers
          ? "Facit med uppställning till elevbladets uppgifter."
          : clean
            ? "Räkna ut uppgifterna i ditt räknehäfte."
            : "Skriv din egen uppställning i rutan och räkna ut svaret."}
      </p>
      <div className="exercise-twelve-grid">
        {shown.map((task, i) => (
          <section key={i} className="own-setup-task" aria-label={`Uppgift ${startIndex + i + 1}`}>
            <div className="own-setup-expression addsub-expression">
              <span className="own-setup-number">{startIndex + i + 1})</span>
              {formatDecimal(digitValue(task.digits), task.dt)} ·{" "}
              {formatDecimal(digitValue(task.m), task.db)}
            </div>
            {!(clean && !answers) && (
              <div
                className={`exercise-twelve-box${!answers && ownGrid ? " multiplication-own-grid" : ""}`}
              >
                {answers && (
                  <Problem
                    n={startIndex + i + 1}
                    t={task}
                    answers
                    digitMm={5.5}
                    showNumber={false}
                  />
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
