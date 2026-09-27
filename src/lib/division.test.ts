import { describe, expect, it } from "vitest";
import { genDivision, divisionSteps } from "./division";

describe("Divisionsblad", () => {
  it("ger åtta exakta divisioner inom valda intervall", () => {
    for (const digits of [1, 2, 3]) {
      for (const divisor of [2, 9]) {
        const tasks = genDivision(divisor, divisor, digits);
        expect(tasks).toHaveLength(8);
        for (const task of tasks) {
          expect(task.divisor).toBe(divisor);
          expect(String(task.quotient)).toHaveLength(digits);
          expect(task.dividend / task.divisor).toBe(task.quotient);
          expect(task.remainder).toBe(0);
          const steps = divisionSteps(task);
          expect(Number(steps.map(s => s.quotientDigit).join(""))).toBe(task.quotient);
          expect(steps.at(-1)?.remainder).toBe(0);
        }
      }
    }
  });
  it("visar överförd rest framför rätt siffra, även när kvoten innehåller noll", () => {
    const steps = divisionSteps({ dividend: 816, divisor: 4, quotient: 204, remainder: 0 });
    expect(steps.map(s => s.incoming)).toEqual([0, 0, 1]);
    expect(steps.map(s => s.quotientDigit)).toEqual([2, 0, 4]);
  });
  it("ger alltid en positiv rest mindre än nämnaren när rest är vald", () => {
    for (let divisor = 2; divisor <= 9; divisor++) {
      for (const digits of [1, 2, 3]) {
        for (const task of genDivision(divisor, divisor, digits, 8, true)) {
          expect(task.dividend).toBe(task.divisor * task.quotient + task.remainder);
          expect(task.remainder).toBeGreaterThan(0);
          expect(task.remainder).toBeLessThan(task.divisor);
          expect(String(task.quotient)).toHaveLength(digits);
          const steps = divisionSteps(task);
          expect(steps.at(-1)?.remainder).toBe(task.remainder);
          expect(Number(steps.map(s => s.quotientDigit).join(""))).toBe(task.quotient);
        }
      }
    }
  });
  it("avvisar ogiltiga inställningar utan att generera felaktiga uppgifter", () => {
    for (const [lo, hi, digits] of [[0, 9, 2], [9, 2, 2], [2.5, 9, 2], [2, 10, 2], [2, 9, 4]]) {
      expect(() => genDivision(lo!, hi!, digits!)).toThrow();
    }
  });
});
