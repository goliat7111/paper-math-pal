import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetHundred } from "./SheetHundred";

const tasks = Array.from({ length: 100 }, (_, index) => ({
  left: String(index + 1),
  operator: "+",
  right: "2",
  answer: String(index + 3),
}));

describe("SheetHundred", () => {
  it("lays out 100 tasks and reveals answers only on the answer sheet", () => {
    const student = renderToStaticMarkup(
      <SheetHundred tasks={tasks} operation="Addition" answers={false} />,
    );
    const key = renderToStaticMarkup(<SheetHundred tasks={tasks} operation="Addition" answers />);
    expect(student.match(/class="hundred-task"/g)).toHaveLength(100);
    expect(student).toContain("Addition · 6 minuter");
    expect(student).not.toContain("<strong>3</strong>");
    expect(key).toContain("<strong>3</strong>");
    expect(key.match(/class="hundred-task"/g)).toHaveLength(100);
  });
});
