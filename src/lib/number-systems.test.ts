import { describe, expect, it } from "vitest";
import { formatBaseValue, genNumberSystemTasks, solveNumberSystemTask, type NumberBase } from "./number-systems";

describe("number-system conversions", () => {
  it.each([2, 4, 16] as const)("creates conversion tasks and correct answers in base %i", (base: NumberBase) => {
    const tasks = genNumberSystemTasks(20, "both", 255);
    expect(tasks).toHaveLength(20);
    expect(tasks.filter(task => task.direction === "to-base")).toHaveLength(10);
    expect(tasks.filter(task => task.direction === "to-decimal")).toHaveLength(10);
    for (const task of tasks) {
      const answer = solveNumberSystemTask(task, base);
      const representation = task.direction === "to-base" ? answer : formatBaseValue(task.value, base);
      expect(parseInt(representation, base)).toBe(task.value);
    }
  });

  it("supports upper-case hexadecimal digits", () => {
    expect(formatBaseValue(254, 16)).toBe("FE");
  });

  it("rejects invalid exercise settings", () => {
    expect(() => genNumberSystemTasks(0)).toThrow();
    expect(() => genNumberSystemTasks(20, "both", 0)).toThrow();
  });
});
