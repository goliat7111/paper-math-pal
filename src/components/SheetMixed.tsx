import { AddSubSetup } from "./SheetAddSub";
import { Problem } from "./SheetSetup";
import { SheetHeader } from "./SheetHeader";
import { divisionSteps } from "@/lib/division";
import { formatDecimal, digitValue, setupValue } from "@/lib/worksheets";
import { addSubResult, maxDec } from "@/lib/addsub";
import type { MixedLevel, MixedTasks } from "@/lib/mixed";

// Facit: samma rutstorlek som multiplikationens uppställning (10 kolumner × 9 rader) fyller rutan.
const FILL = { cols: 10, rows: 9 };
export function SheetMixed({
  tasks,
  level,
  answers,
  showGrid = true,
}: {
  tasks: MixedTasks;
  level: MixedLevel;
  answers: boolean;
  showGrid?: boolean;
}) {
  const { add, sub, mul, div } = tasks;
  const workClass = `mixed-work${showGrid && !answers ? " mixed-work--grid" : ""}`;
  const arithmeticWorkClass = `${workClass} mixed-work--arithmetic`;
  const divisionWorkClass = answers
    ? "mixed-work mixed-work--grid mixed-work--division-answer"
    : `${workClass} mixed-work--arithmetic`;
  const multiplicationWorkClass = `mixed-work mixed-work--arithmetic${
    answers ? "" : " mixed-work--multiplication"
  }`;
  const addText = add.terms.map((v, i) => formatDecimal(v, add.decs[i])).join(" + ");
  const subText = sub.terms.map((v, i) => formatDecimal(v, sub.decs[i])).join(" − ");
  const mulText = `${formatDecimal(digitValue(mul.digits), mul.dt)} × ${formatDecimal(digitValue(mul.m), mul.db)}`;
  const dividendText = formatDecimal(div.dividend, div.dividendDecimals);
  const shownDividend = div.shown
    ? formatDecimal(div.shown.dividend, div.shown.dividendDecimals)
    : dividendText;
  const shownDivisor = div.shown
    ? formatDecimal(div.shown.divisor, div.shown.divisorDecimals)
    : String(div.divisor);
  const quotientText =
    div.remainder > 0
      ? `${div.quotient} rest ${div.remainder}`
      : div.repeating
        ? `${formatDecimal(div.quotient, div.quotientDecimals)}…`
        : div.rounded !== undefined
          ? formatDecimal(div.rounded, 2)
          : formatDecimal(div.quotient, div.quotientDecimals);
  const rel = div.rounded !== undefined ? "≈" : "=";
  const divisionAnswer =
    div.rounded !== undefined ? `${formatDecimal(div.quotient, 3)}…` : quotientText;
  const divisionDigits = divisionSteps(div);
  const answerTokens: { text: string; columns: number; commaAfter?: boolean }[] = [];
  for (let index = 0; index < divisionAnswer.length; index++) {
    if (divisionAnswer.startsWith("rest", index)) {
      answerTokens.push({ text: "rest", columns: 2 });
      index += 3;
    } else if (divisionAnswer[index] === ",") {
      const previous = answerTokens[answerTokens.length - 1];
      if (previous) previous.commaAfter = true;
    } else if (divisionAnswer[index] !== " ") {
      answerTokens.push({ text: divisionAnswer[index]!, columns: 1 });
    }
  }
  const answerColumns = answerTokens.reduce((sum, token) => sum + token.columns, 0);
  const divisionGridColumns = divisionDigits.length + 1 + answerColumns;
  const divisionStartColumn = Math.max(1, Math.floor((10 - divisionGridColumns) / 2) + 1);
  const answerStartColumn = divisionStartColumn + divisionDigits.length + 1;
  return (
    <div className="a4-page mixed-page">
      <SheetHeader
        title={answers ? "Dagens tal – Facit" : "Dagens tal"}
        subtitle={`Nivå ${level}`}
        score="av 4"
      />
      <div className="mixed-grid">
        <section
          className="mixed-quadrant mixed-quadrant--arithmetic"
          aria-label="Uppgift 1 Addition"
        >
          <div className="mixed-expression">
            <strong>1. Addition</strong>
            <span>
              {addText} ={" "}
              {answers && (
                <span className="mixed-expression-answer">
                  {formatDecimal(addSubResult(add), maxDec(add))}
                </span>
              )}
            </span>
          </div>
          <div className={arithmeticWorkClass}>
            {answers && <AddSubSetup t={add} answers fill={FILL} />}
          </div>
        </section>
        <section
          className="mixed-quadrant mixed-quadrant--arithmetic"
          aria-label="Uppgift 2 Subtraktion"
        >
          <div className="mixed-expression">
            <strong>2. Subtraktion</strong>
            <span>
              {subText} ={" "}
              {answers && (
                <span className="mixed-expression-answer">
                  {formatDecimal(addSubResult(sub), maxDec(sub))}
                </span>
              )}
            </span>
          </div>
          <div className={arithmeticWorkClass}>
            {answers && <AddSubSetup t={sub} answers fill={FILL} />}
          </div>
        </section>
        <section
          className="mixed-quadrant mixed-quadrant--arithmetic"
          aria-label="Uppgift 3 Multiplikation"
        >
          <div className="mixed-expression">
            <strong>3. Multiplikation</strong>
            <span>
              {mulText} ={" "}
              {answers && (
                <span className="mixed-expression-answer">
                  {formatDecimal(setupValue(mul), (mul.dt ?? 0) + (mul.db ?? 0))}
                </span>
              )}
            </span>
          </div>
          <div className={multiplicationWorkClass}>
            {answers ? (
              <Problem n={3} t={mul} answers digitMm={6.5} showNumber={false} />
            ) : (
              showGrid && (
                <Problem n={3} t={mul} answers={false} digitMm={6.5} showNumber={false} emptyGrid />
              )
            )}
          </div>
        </section>
        <section className="mixed-quadrant" aria-label="Uppgift 4 Division">
          <div className="mixed-expression">
            <div className="mixed-division-heading">
              <strong>4. Division</strong>
              {div.rounded !== undefined && (
                <span className="mixed-hint mixed-division-rounding-hint">
                  Avrunda till två decimaler.
                </span>
              )}
            </div>
            <span>
              {shownDividend} / {shownDivisor} {rel}{" "}
              {answers && <span className="mixed-expression-answer">{quotientText}</span>}
            </span>
          </div>
          {answers && (
            <div className="mixed-hint">
              Utmaning: {div.note}
              {div.shown ? ` · skriv om: ${dividendText} / ${div.divisor}` : ""}
              {div.rounded !== undefined
                ? ` · ${formatDecimal(div.quotient, 3)}… ≈ ${quotientText}`
                : ""}
            </div>
          )}
          <div className={divisionWorkClass}>
            {answers && (
              <div className="mixed-division-setup" aria-label="Kort division">
                {divisionDigits.map((step, index) => (
                  <span
                    className={`division-digit mixed-division-digit${step.added ? " is-added" : ""}`}
                    key={index}
                    style={{
                      gridColumn: divisionStartColumn + index,
                      gridRow: 3,
                    }}
                  >
                    {step.incoming > 0 && <sup>{step.incoming}</sup>}
                    {step.digit}
                    {step.comma && <span className="worksheet-comma mixed-division-comma">,</span>}
                  </span>
                ))}
                <span
                  className="mixed-division-denominator"
                  style={{
                    gridColumn: `${divisionStartColumn} / ${divisionStartColumn + divisionDigits.length}`,
                    gridRow: 4,
                  }}
                >
                  {div.divisor}
                </span>
                <span
                  style={{
                    gridColumn: divisionStartColumn + divisionDigits.length,
                    gridRow: 3,
                  }}
                >
                  =
                </span>
                {answerTokens.map((token, index) => {
                  const gridColumn =
                    answerStartColumn +
                    answerTokens
                      .slice(0, index)
                      .reduce((sum, previous) => sum + previous.columns, 0);
                  return (
                    <span
                      className={`mixed-division-answer${token.text === "rest" ? " is-rest" : ""}`}
                      key={index}
                      style={{
                        gridColumn:
                          token.columns === 1
                            ? gridColumn
                            : `${gridColumn} / ${gridColumn + token.columns}`,
                        gridRow: 3,
                      }}
                    >
                      {token.text}
                      {token.commaAfter && (
                        <span className="worksheet-comma mixed-division-comma">,</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
