import { divisionSteps, type DivisionTask } from "@/lib/division";
import { SheetHeader } from "./Sheet102";

export function SheetDivision({ tasks, answers, ownSetup }: {
  tasks: DivisionTask[];
  answers: boolean;
  ownSetup: boolean;
}) {
  const withRemainder = tasks.some(task => task.remainder > 0);
  return <div className="a4-page">
    <SheetHeader title={answers ? "Division – Facit" : "Division"}
      subtitle={withRemainder ? "Med rest" : "Utan rest"} score={`av ${tasks.length}`} />
    <p className="own-setup-instruction">{answers ? "Facit med kort division. Små siffror visar överförda rester." : ownSetup ? `Skriv din egen uppställning i rutan.${withRemainder ? " Ange svaret och resten." : " Räkna ut svaret."}` : `Räkna med kort division.${withRemainder ? " Ange svaret och resten." : " Visa dina uträkningar."}`}</p>
    <div className="own-setup-grid">
      {tasks.map((task, i) => <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
        <div className="own-setup-expression"><span className="own-setup-number">{i + 1})</span>{task.dividend} / {task.divisor}</div>
        <div className="own-setup-box division-box">
          {(answers || !ownSetup) && <div className="short-division" aria-label={`${task.dividend} delat med ${task.divisor}${answers ? ` är ${task.quotient}${withRemainder ? ` rest ${task.remainder}` : ""}` : ""}`}>
            <div className="division-fraction">
              <div className="division-numerator">{divisionSteps(task).map((step, n) => <span className="division-digit" key={n}>
                {answers && step.incoming > 0 && <sup>{step.incoming}</sup>}{step.digit}
              </span>)}</div>
              <div className="division-denominator">{task.divisor}</div>
            </div>
            <span>=</span><div className="division-result"><span className={`division-answer${answers ? " is-answer" : ""}`}>{answers ? task.quotient : ""}</span>
              {withRemainder && <span className="division-remainder">rest {answers ? task.remainder : "____"}</span>}
            </div>
          </div>}
        </div>
      </section>)}
    </div>
  </div>;
}
