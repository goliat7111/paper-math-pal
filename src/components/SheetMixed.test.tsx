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
    expect(withGrid.match(/class="mixed-work mixed-work--grid"/g)).toBeNull();
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
    ).toHaveLength(2);
    expect(withoutGrid).not.toContain("mixed-work--grid");
  });

  it("uses the same arithmetic work area for the student grid and answer grid", () => {
    const tasks = genMixed(1);
    tasks.add = { op: "add", terms: [12, 34], decs: [0, 0] };
    const student = renderToStaticMarkup(
      <SheetMixed tasks={tasks} level={1} answers={false} showGrid />,
    );
    const answers = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers />);
    expect(student.match(/mixed-work--arithmetic/g)).toHaveLength(3);
    expect(answers.match(/mixed-work--arithmetic/g)).toHaveLength(3);
    expect(student.match(/mixed-quadrant--arithmetic/g)).toHaveLength(3);
    expect(answers.match(/mixed-quadrant--arithmetic/g)).toHaveLength(3);
    expect(student).toContain("multiplication-answer-grid--empty");
    expect(student).toContain("grid-template-rows:repeat(9, minmax(5mm, 1fr))");
    expect(student.match(/class="border border-sheet-grid"/g)).toHaveLength(90);
    expect(answers).toContain("grid-template-rows:minmax(5mm, 1fr)");
    expect(answers).toContain("3mm");
    expect(answers).toContain('grid-column:5;grid-row:3">1');
    expect(answers).toContain('grid-column:6;grid-row:3">2');
  });
});
