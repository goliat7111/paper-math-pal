import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { genMixed } from "@/lib/mixed";
import { SheetMixed } from "./SheetMixed";

describe("SheetMixed grid", () => {
  it("keeps the answer grid identical when the student grid is toggled", () => {
    const tasks = genMixed(3);
    const withGrid = renderToStaticMarkup(<SheetMixed tasks={tasks} level={3} answers showGrid />);
    const withoutGrid = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={3} answers showGrid={false} />,
    );

    expect(withGrid).toBe(withoutGrid);
    expect(
      withGrid.match(/grid-template-columns:repeat\(10\s*,\s*minmax\(0\s*,\s*1fr\)\)/g),
    ).toHaveLength(2);
    expect(
      withGrid.match(/grid-template-rows:repeat\(9\s*,\s*minmax\(0\s*,\s*1fr\)\)/g),
    ).toHaveLength(2);
    expect(withGrid).toContain('class="mixed-work mixed-work--grid mixed-work--division-answer"');
    expect(withoutGrid).toContain(
      'class="mixed-work mixed-work--grid mixed-work--division-answer"',
    );
  });

  it("still lets the student choose a blank work area", () => {
    const tasks = genMixed(1);
    const withGrid = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={1} answers={false} showGrid />,
    );
    const withoutGrid = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={1} answers={false} showGrid={false} />,
    );
    expect(
      withGrid.match(/class="mixed-work mixed-work--grid mixed-work--arithmetic"/g),
    ).toHaveLength(3);
    expect(withGrid).toContain('class="mixed-work mixed-work--grid mixed-work--arithmetic"');
    expect(withoutGrid).not.toContain("mixed-work--grid");
  });

  it("uses the same arithmetic work area for the student grid and answer grid", () => {
    const tasks = genMixed(1);
    tasks.add = { op: "add", terms: [12, 34], decs: [0, 0] };
    tasks.div = {
      ...tasks.div,
      dividend: 88,
      divisor: 4,
      quotient: 22,
      remainder: 0,
      dividendDecimals: 0,
      quotientDecimals: 0,
    };
    const student = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={1} answers={false} showGrid />,
    );
    const answers = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers />);
    expect(student.match(/mixed-work--arithmetic/g)).toHaveLength(4);
    expect(answers.match(/mixed-work--arithmetic/g)).toHaveLength(3);
    expect(student.match(/mixed-quadrant--arithmetic/g)).toHaveLength(3);
    expect(answers.match(/mixed-quadrant--arithmetic/g)).toHaveLength(3);
    expect(student).toContain("multiplication-answer-grid--empty");
    expect(student).toContain("mixed-work--multiplication");
    expect(answers).not.toContain("mixed-work--multiplication");
    expect(student).toContain("grid-template-rows:repeat(9, minmax(5mm, 1fr))");
    expect(student.match(/class="border border-sheet-grid"/g)).toHaveLength(90);
    expect(answers).toContain("grid-template-rows:minmax(5mm, 1fr)");
    expect(answers).toContain("3mm");
    expect(answers).toContain('grid-column:5;grid-row:3">1');
    expect(answers).toContain('grid-column:6;grid-row:3">2');
    expect(answers).toContain('class="mixed-division-setup"');
    expect(answers).toContain('grid-column:3;grid-row:3">8');
    expect(answers).toContain('grid-column:4;grid-row:3">8');
    expect(answers).toContain('grid-column:3 / 5;grid-row:4">4');
    expect(answers).toContain('grid-column:5;grid-row:3">=');
    expect(answers).toContain('grid-column:6;grid-row:3">2');
    expect(answers).toContain('grid-column:7;grid-row:3">2');
    expect(answers).not.toContain("mixed-division-answer is-compact");
    expect(answers).toContain('class="mixed-expression-answer">46</span>');
    expect(answers).toContain('class="mixed-expression-answer">22</span>');
    expect(student).not.toContain("mixed-expression-answer");

    tasks.div = {
      ...tasks.div,
      dividend: 884,
      divisor: 4,
      quotient: 221,
      remainder: 0,
      dividendDecimals: 1,
      quotientDecimals: 1,
      rounded: 2210,
    };
    const decimalAnswers = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers />);
    expect(decimalAnswers.match(/worksheet-comma mixed-division-comma/g)).toHaveLength(2);
    expect(decimalAnswers).toContain("mixed-division-heading");
    expect(decimalAnswers).toContain("mixed-division-rounding-hint");
    expect(decimalAnswers).not.toContain(
      '<div class="mixed-hint">Avrunda till två decimaler.</div>',
    );
    expect(decimalAnswers).toContain("mixed-division-answer");

    tasks.div = {
      ...tasks.div,
      dividend: 496,
      divisor: 8,
      quotient: 62,
      remainder: 0,
      dividendDecimals: 1,
      quotientDecimals: 1,
    };
    delete tasks.div.rounded;
    const decimalQuotientAnswers = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={1} answers />,
    );
    expect(decimalQuotientAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:7;grid-row:3">6<span class="worksheet-comma mixed-division-comma">,</span></span>',
    );
    expect(decimalQuotientAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:8;grid-row:3">2</span>',
    );

    tasks.div = {
      ...tasks.div,
      dividend: 886,
      divisor: 5,
      quotient: 177,
      remainder: 1,
      dividendDecimals: 0,
      quotientDecimals: 0,
    };
    const remainderAnswers = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers />);
    expect(remainderAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:5;grid-row:3">1</span>',
    );
    expect(remainderAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:6;grid-row:3">7</span>',
    );
    expect(remainderAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:7;grid-row:3">7</span>',
    );
    expect(remainderAnswers).toContain(
      '<span class="mixed-division-answer is-rest" style="grid-column:8 / 10;grid-row:3">rest</span>',
    );
    expect(remainderAnswers).toContain(
      '<span class="mixed-division-answer" style="grid-column:10;grid-row:3">1</span>',
    );
  });
});
