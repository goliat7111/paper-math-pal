import { AddSubSetup } from "./SheetAddSub";
import { Problem } from "./SheetSetup";
import { SheetHeader } from "./SheetHeader";
import { divisionSteps } from "@/lib/division";
import { formatDecimal, digitValue, setupValue } from "@/lib/worksheets";
import { addSubResult, maxDec } from "@/lib/addsub";
import type { MixedLevel, MixedTasks } from "@/lib/mixed";

export function SheetMixed({ tasks, level, answers }: { tasks: MixedTasks; level: MixedLevel; answers: boolean }) {
  const { add, sub, mul, div } = tasks;
  const addText = add.terms.map((v, i) => formatDecimal(v, add.decs[i])).join(" + ");
  const subText = sub.terms.map((v, i) => formatDecimal(v, sub.decs[i])).join(" − ");
  const mulText = `${formatDecimal(digitValue(mul.digits), mul.dt)} × ${formatDecimal(digitValue(mul.m), mul.db)}`;
  const dividendText = formatDecimal(div.dividend, div.dividendDecimals);
  const quotientText = formatDecimal(div.quotient, div.quotientDecimals);
  return <div className="a4-page mixed-page">
    <SheetHeader title={answers ? "Blandade övningar – Facit" : "Blandade övningar"} subtitle={`Nivå ${level}`} score="av 4" />
    <div className="mixed-grid">
      <section className="mixed-quadrant" aria-label="Uppgift 1 Addition">
        <div className="mixed-expression"><strong>1. Addition</strong><span>{addText} = {answers ? formatDecimal(addSubResult(add), maxDec(add)) : ""}</span></div>
        <div className="mixed-work"><AddSubSetup t={add} answers={answers} /></div>
      </section>
      <section className="mixed-quadrant" aria-label="Uppgift 2 Subtraktion">
        <div className="mixed-expression"><strong>2. Subtraktion</strong><span>{subText} = {answers ? formatDecimal(addSubResult(sub), maxDec(sub)) : ""}</span></div>
        <div className="mixed-work"><AddSubSetup t={sub} answers={answers} /></div>
      </section>
      <section className="mixed-quadrant" aria-label="Uppgift 3 Multiplikation">
        <div className="mixed-expression"><strong>3. Multiplikation</strong><span>{mulText} = {answers ? formatDecimal(setupValue(mul), (mul.dt ?? 0) + (mul.db ?? 0)) : ""}</span></div>
        <div className="mixed-work"><Problem n={3} t={mul} answers={answers} digitMm={6.5} showNumber={false} /></div>
      </section>
      <section className="mixed-quadrant" aria-label="Uppgift 4 Division">
        <div className="mixed-expression"><strong>4. Division</strong><span>{dividendText} / {div.divisor} = {answers ? quotientText : ""}</span></div>
        <div className="mixed-work"><div className="short-division" aria-label="Kort division">
          <div className="division-fraction"><div className="division-numerator">{divisionSteps(div).map((step, n) => (!step.added || answers) && <span className={`division-digit${step.added ? " is-added" : ""}`} key={n}>
            {answers && step.incoming > 0 && <sup>{step.incoming}</sup>}{step.digit}{step.comma && (answers || (div.dividendDecimals ?? 0) > 0) && <span className="division-comma">,</span>}
          </span>)}</div><div className="division-denominator">{div.divisor}</div></div>
          <span>=</span><div className="division-result"><span className={`division-answer${answers ? " is-answer" : ""}`}>{answers ? quotientText : ""}</span></div>
        </div></div>
      </section>
    </div>
  </div>;
}