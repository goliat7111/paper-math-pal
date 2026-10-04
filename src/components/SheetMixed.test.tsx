import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { genMixed } from "@/lib/mixed";
import { SheetMixed } from "./SheetMixed";

describe("SheetMixed grid", () => {
  it("keeps the answer grid identical when the student grid is toggled", () => {
    const tasks = genMixed(3);
    const withGrid = renderToStaticMarkup(<SheetMixed tasks={tasks} level={3} answers showGrid />);
    const withoutGrid = renderToStaticMarkup(<SheetMixed tasks={tasks} level={3} answers showGrid={false} />);

    expect(withGrid).toBe(withoutGrid);
    expect(withGrid.match(/grid-template-columns:repeat\(10\s*,\s*minmax\(0\s*,\s*1fr\)\)/g)).toHaveLength(2);
    expect(withGrid.match(/class="mixed-work mixed-work--grid"/g)).toBeNull();
  });

  it("still lets the student choose a blank work area", () => {
    const tasks = genMixed(1);
    const withGrid = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers={false} showGrid />);
    const withoutGrid = renderToStaticMarkup(<SheetMixed tasks={tasks} level={1} answers={false} showGrid={false} />);
    expect(withGrid.match(/class="mixed-work mixed-work--grid"/g)).toHaveLength(4);
    expect(withoutGrid).not.toContain("mixed-work--grid");
  });
});