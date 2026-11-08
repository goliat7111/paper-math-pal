import { describe, expect, it } from "vitest";
import { genReverseDivision, REVERSE_DIVISION_COUNT } from "./reverse-division";

describe("Omvänd multiplikation", () => {
  it("fördelar faktapar, tabeller och luckans placering jämnt", () => {
    for (let trial = 0; trial < 10; trial++) {
      const tasks = genReverseDivision();
      expect(tasks).toHaveLength(REVERSE_DIVISION_COUNT);
      expect(tasks.filter((task) => task.missing === "divisor")).toHaveLength(30);
      expect(tasks.filter((task) => task.missing === "quotient")).toHaveLength(30);
      let singles = 0;
      let doubles = 0;
      for (let a = 2; a <= 9; a++) {
        const tableCount = tasks.filter((task) => task.divisor === a || task.quotient === a).length;
        expect(tableCount).toBe(13);
        for (let b = a; b <= 9; b++) {
          const pair = tasks.filter(
            (task) =>
              Math.min(task.divisor, task.quotient) === a &&
              Math.max(task.divisor, task.quotient) === b,
          );
          expect([1, 2]).toContain(pair.length);
          if (pair.length === 1) {
            expect(a).not.toBe(b);
            singles++;
          } else {
            doubles++;
            expect(pair.map((task) => task.missing).sort()).toEqual(["divisor", "quotient"]);
            expect(pair.map((task) => task.divisor).sort((x, y) => x - y)).toEqual([a, b]);
          }
          for (const task of pair) {
            expect(task.dividend).toBe(a * b);
            expect(task.remainder).toBe(0);
          }
        }
      }
      expect(singles).toBe(12);
      expect(doubles).toBe(24);
    }
  });
});
