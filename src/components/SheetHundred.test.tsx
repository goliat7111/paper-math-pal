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

  it("supports aligning operand units for the four quick-range sheets", () => {
    const markup = renderToStaticMarkup(
      <SheetHundred tasks={tasks} operation="Addition" answers={false} alignUnits />,
    );

    expect(markup).toContain("hundred-tasks-page--align-units");
    expect(
      markup.match(/hundred-tasks-group--spaced(?: hundred-tasks-group--spaced-divider)?"/g),
    ).toHaveLength(20);
    expect(markup.match(/hundred-tasks-group--spaced-divider/g)).toHaveLength(16);
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
        tenFriendsLayout
      />,
    );
    expect(markup).toContain("10-kamrater (addition)");
    expect(markup).toContain("av 80");
    expect(markup.match(/class="hundred-tasks-column"/g)).toHaveLength(4);
    expect(
      markup.match(
        /class="hundred-tasks-group hundred-tasks-group--fill-in(?: hundred-tasks-group--fill-in-divider)? hundred-tasks-group--ten-friends(?: hundred-tasks-group--ten-friends-divider)?"/g,
      ),
    ).toHaveLength(16);
    expect(markup.match(/hundred-tasks-group--ten-friends-divider/g)).toHaveLength(12);
    expect(markup.match(/data-task-count="5"/g)).toHaveLength(16);
    expect(markup.match(/class="hundred-task(?: hundred-task-fill-in)?"/g)).toHaveLength(80);
    expect(markup.match(/hundred-task-fill-in/g)).toHaveLength(80);
  });

  it("uses the ten-friends layout for 80 subtraction tasks", () => {
    const subTasks = Array.from({ length: 80 }, (_, index) => ({
      left: "10",
      operator: "−",
      right: String(index % 11),
      answer: String(10 - (index % 11)),
    }));
    const markup = renderToStaticMarkup(
      <SheetHundred
        tasks={subTasks}
        operation="Subtraktion"
        answers={false}
        sheetTitle="10-kamrater (subtraktion)"
        alignOperands
        tenFriendsLayout
      />,
    );

    expect(markup).toContain("10-kamrater (subtraktion)");
    expect(markup).toContain("av 80");
    expect(markup).toContain("hundred-tasks-page--ten-friends-layout");
    expect(markup).toContain("hundred-tasks-page--align-operands");
    expect(markup.match(/hundred-tasks-full-divider hundred-tasks-full-divider--/g)).toHaveLength(
      3,
    );
    expect(markup.match(/class="hundred-tasks-column"/g)).toHaveLength(4);
    expect(markup.match(/hundred-tasks-group--ten-friends-divider/g)).toHaveLength(12);
    expect(markup.match(/data-task-count="5"/g)).toHaveLength(16);
  });

  it("shows a missing subtrahend with the difference fixed, or a missing difference", () => {
    const tasks = [
      {
        left: "10",
        operator: "−",
        right: "4",
        answer: "4",
        blank: "right" as const,
        result: "6",
      },
      {
        left: "10",
        operator: "−",
        right: "4",
        answer: "6",
      },
    ];
    const student = renderToStaticMarkup(
      <SheetHundred tasks={tasks} operation="Subtraktion" answers={false} tenFriendsLayout />,
    );
    const key = renderToStaticMarkup(
      <SheetHundred tasks={tasks} operation="Subtraktion" answers tenFriendsLayout />,
    );

    expect(student.match(/hundred-task-blank/g)).toHaveLength(1);
    expect(student).toContain(
      'class="hundred-task-answer hundred-task-result hundred-task-fixed-result">6</span>',
    );
    expect(key).toContain('>4</span><span class="hundred-task-equals">=</span>');
    expect(key).toContain("<strong>6</strong>");
  });
});
