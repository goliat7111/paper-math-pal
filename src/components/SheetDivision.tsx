import { divisionSteps, type DivisionTask } from "@/lib/division";
import { formatDecimal } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

export function SheetDivision({ tasks, answers, ownSetup, progression = false, startIndex = 0 }: {
  tasks: DivisionTask[];
  answers: boolean;
  ownSetup: boolean;
  progression?: boolean;
  startIndex?: number;
}) {
  const withRemainder = tasks.some(task => task.remainder > 0);
  const challenges = tasks.some(t => t.note);
  const extend = tasks.every(t => t.shownDecimals);
  const extras = tasks.map(t => Math.max(0, (t.quotientDecimals ?? 0) - (t.dividendDecimals ?? 0)));
  const extra = Math.max(0, ...extras);
  const extraText = extra === 0 ? "går jämnt ut"
    : extras.every(e => e === extras[0]) ? `${extra} extra decimal${extra > 1 ? "er" : ""} i svaret`
    : `${Math.min(...extras)}–${extra} extra decimaler i svaret`;
  const decimal = tasks.some(t => (t.dividendDecimals ?? 0) > 0) || extra > 0;
  const subtitle = progression ? "Progressionsserie · heltalsdivision"
    : challenges ? "Utmaningar"
    : extend ? "Förlänga eller förkorta"
    : withRemainder ? "Med rest"
    : !decimal ? "Utan rest"
    : `Decimaltal · ${extraText}`;
  const task = challenges ? "" : extend ? "" : withRemainder ? " Ange svaret och resten." : extra ? " Lägg till nollor och räkna tills det går jämnt ut." : "";
  return <div className={`a4-page exercise-twelve-page division-twelve-page${progression ? " division-progression-page" : ""}`}>
    <SheetHeader title={answers ? "Division – Facit" : "Division"} subtitle={subtitle} score={`av ${tasks.length}`} />
    {progression && <p className="own-setup-instruction">Division - komplexitetsmatris · Uppgift {startIndex + 1}–{startIndex + tasks.length}. Uppgifterna följer en progression. Ange rest där divisionen inte går jämnt ut.</p>}
    <p className="own-setup-instruction">{answers ? challenges ? "Facit med kort division. Texten vid varje uppgift visar vilken utmaning den tränar." : extend ? "Facit. Uppställningen visar talet efter att du förlängt eller förkortat." : `Facit med kort division. Små siffror visar överförda rester.${extra ? " Tillagda nollor i rött." : ""}` : extend ? "Förläng eller förkorta så att nämnaren blir ett heltal, och räkna sedan i huvudet. Visa gärna hur du tänker." : ownSetup ? `Skriv din egen uppställning i rutan.${task || " Räkna ut svaret."}` : `Räkna med kort division.${task || " Visa dina uträkningar."}`}</p>
    <div className="exercise-twelve-grid">
      {tasks.map((t, i) => {
        const dividendText = formatDecimal(t.shownDecimals?.raw ?? t.dividend, t.shownDecimals?.dividend ?? t.dividendDecimals);
        const divisorText = formatDecimal(t.divisor, t.shownDecimals?.divisor ?? 0);
        const quotientText = formatDecimal(t.quotient, t.quotientDecimals);
        return <section key={i} className="own-setup-task" aria-label={`Uppgift ${startIndex + i + 1}`}>
           <div className="own-setup-expression addsub-expression"><span className="own-setup-number">{startIndex + i + 1})</span>{progression ? <span className="division-expression">{dividendText} / {divisorText}</span> : <>{dividendText} / {divisorText}</>}{answers && t.note && <span className="division-note">{progression ? "" : " · "}{t.note}</span>}</div>
            <div className={`exercise-twelve-box division-box${ownSetup && !answers ? " division-box--grid" : ""}`}>
            {(answers || !ownSetup) && <div className="short-division" aria-label={`${dividendText} delat med ${divisorText}${answers ? ` är ${quotientText}${t.remainder > 0 ? ` rest ${t.remainder}` : ""}` : ""}`}>
              <div className="division-fraction">
                <div className="division-numerator">{extend && !answers ? <span className="division-digit">{dividendText}</span> : divisionSteps(t).map((step, n) => (!step.added || answers) && <span className={`division-digit${step.added ? " is-added" : ""}`} key={n}>
                  {answers && step.incoming > 0 && <sup>{step.incoming}</sup>}{step.digit}{step.comma && (answers || (t.dividendDecimals ?? 0) > 0) && <span className="worksheet-comma">,</span>}
                </span>)}</div>
                <div className="division-denominator">{extend && !answers ? divisorText : t.divisor}</div>
              </div>
              <span>=</span><div className="division-result"><span className={`division-answer${answers ? " is-answer" : ""}`}>{answers ? quotientText : ""}</span>
                {t.remainder > 0 && <span className="division-remainder">rest {answers ? t.remainder : "____"}</span>}
              </div>
            </div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
