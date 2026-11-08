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

  it("shows a fixed sum with a blank addend, then fills that addend in the key", () => {
    const tasks = [
      {
        left: "3",
        operator: "+",
        right: "7",
        answer: "3",
        blank: "left" as const,
        result: "10",
      },
      {
        left: "3",
        operator: "+",
        right: "7",
        answer: "7",
        blank: "right" as const,
        result: "10",
      },
    ];
    const student = renderToStaticMarkup(
      <SheetHundred tasks={tasks} operation="Addition" answers={false} />,
    );
    const key = renderToStaticMarkup(<SheetHundred tasks={tasks} operation="Addition" answers />);

    expect(student.match(/hundred-task-blank/g)).toHaveLength(2);
    expect(student.match(/hundred-task-fill-in/g)).toHaveLength(2);
    expect(student).toContain("hundred-tasks-page--fill-in");
    expect(
      student.match(/<span class="hundred-task-answer[^"]*hundred-task-result[^"]*">10<\/span>/g),
    ).toHaveLength(2);
    expect(key).toContain('>3</span><span class="hundred-task-operator">+</span>');
    expect(key).toContain('>7</span><span class="hundred-task-equals">=</span>');
  });

  it("lays out 80 ten-friends additions in four columns with four groups of five", () => {
    const tenFriendsTasks = tasks.slice(0, 80).map((task) => ({
      ...task,
      blank: "left" as const,
      result: "10",
    }));
    const markup = renderToStaticMarkup(
      <SheetHundred
        tasks={tenFriendsTasks}
        operation="Addition"
        answers={false}
        sheetTitle="10-kamrater (addition)"
      />,
    );
    expect(markup).toContain("10-kamrater (addition)");
    expect(markup).toContain("av 80");
    expect(markup.match(/class="hundred-tasks-column"/g)).toHaveLength(4);
    expect(
      markup.match(
        /class="hundred-tasks-group hundred-tasks-group--fill-in(?: hundred-tasks-group--fill-in-divider)?"/g,
      ),
    ).toHaveLength(16);
    expect(markup.match(/hundred-tasks-group--fill-in-divider/g)).toHaveLength(12);
    expect(markup.match(/data-task-count="5"/g)).toHaveLength(16);
    expect(markup.match(/class="hundred-task(?: hundred-task-fill-in)?"/g)).toHaveLength(80);
    expect(markup.match(/hundred-task-fill-in/g)).toHaveLength(80);
  });
});
