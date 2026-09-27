import { divisionSteps, type DivisionTask } from "@/lib/division";
import { formatDecimal } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

export function SheetDivision({ tasks, answers, ownSetup }: {
  tasks: DivisionTask[];
  answers: boolean;
  ownSetup: boolean;
}) {
  const withRemainder = tasks.some(task => task.remainder > 0);
  const extras = tasks.map(t => Math.max(0, (t.quotientDecimals ?? 0) - (t.dividendDecimals ?? 0)));
  const extra = Math.max(0, ...extras);
  const extraText = extra === 0 ? "går jämnt ut"
    : extras.every(e => e === extras[0]) ? `${extra} extra decimal${extra > 1 ? "er" : ""} i svaret`
    : `${Math.min(...extras)}–${extra} extra decimaler i svaret`;
  const decimal = tasks.some(t => (t.dividendDecimals ?? 0) > 0) || extra > 0;
  const subtitle = withRemainder ? "Med rest"
    : !decimal ? "Utan rest"
    : `Decimaltal · ${extraText}`;
  const task = withRemainder ? " Ange svaret och resten." : extra ? " Lägg till nollor och räkna tills det går jämnt ut." : "";
  return <div className="a4-page">
    <SheetHeader title={answers ? "Division – Facit" : "Division"} subtitle={subtitle} score={`av ${tasks.length}`} />
    <p className="own-setup-instruction">{answers ? `Facit med kort division. Små siffror visar överförda rester.${extra ? " Tillagda nollor i rött." : ""}` : ownSetup ? `Skriv din egen uppställning i rutan.${task || " Räkna ut svaret."}` : `Räkna med kort division.${task || " Visa dina uträkningar."}`}</p>
    <div className="own-setup-grid">
      {tasks.map((t, i) => {
        const dividendText = formatDecimal(t.dividend, t.dividendDecimals);
        const quotientText = formatDecimal(t.quotient, t.quotientDecimals);
        return <section key={i} className="own-setup-task" aria-label={`Uppgift ${i + 1}`}>
          <div className="own-setup-expression"><span className="own-setup-number">{i + 1})</span>{dividendText} / {t.divisor}</div>
          <div className="own-setup-box division-box">
            {(answers || !ownSetup) && <div className="short-division" aria-label={`${dividendText} delat med ${t.divisor}${answers ? ` är ${quotientText}${withRemainder ? ` rest ${t.remainder}` : ""}` : ""}`}>
              <div className="division-fraction">
                <div className="division-numerator">{divisionSteps(t).map((step, n) => (!step.added || answers) && <span className={`division-digit${step.added ? " is-added" : ""}`} key={n}>
                  {answers && step.incoming > 0 && <sup>{step.incoming}</sup>}{step.digit}{step.comma && (answers || (t.dividendDecimals ?? 0) > 0) && <span className="division-comma">,</span>}
                </span>)}</div>
                <div className="division-denominator">{t.divisor}</div>
              </div>
              <span>=</span><div className="division-result"><span className={`division-answer${answers ? " is-answer" : ""}`}>{answers ? quotientText : ""}</span>
                {withRemainder && <span className="division-remainder">rest {answers ? t.remainder : "____"}</span>}
              </div>
            </div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
