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

describe("Division med decimaltal", () => {
  const value = (n: number, d = 0) => n / 10 ** d;
  it("går jämnt ut med valt antal decimaler i täljaren", () => {
    for (const dd of [1, 2, 3]) for (const t of genDivision(2, 9, 1, 40, false, dd, 0)) {
      expect(t.dividend % 10).not.toBe(0);
      expect(t.quotientDecimals).toBe(dd);
      expect(t.quotient * t.divisor).toBe(t.dividend);
      expect(divisionSteps(t).at(-1)?.remainder).toBe(0);
    }
  });
  it("ger exakt 1–3 extra decimaler i svaret", () => {
    for (const dd of [0, 1, 2]) for (const extra of [1, 2, 3]) for (const t of genDivision(2, 9, 1, 40, false, dd, extra)) {
      expect(t.quotientDecimals).toBe(dd + extra);
      expect(t.quotient % 10).not.toBe(0);
      expect(t.quotient * t.divisor).toBe(t.dividend * 10 ** extra);
      expect(value(t.dividend, dd) / t.divisor).toBeCloseTo(value(t.quotient, dd + extra), 9);
      const steps = divisionSteps(t);
      expect(steps.filter(s => s.added)).toHaveLength(extra);
      expect(steps.at(-1)?.remainder).toBe(0);
      if (extra === 3) expect(t.divisor).toBe(8);
    }
  });
  it("4/8 = 0,5 och 0,8/5 = 0,16 räknas rätt steg för steg", () => {
    const a = divisionSteps({ dividend: 4, divisor: 8, quotient: 5, remainder: 0, quotientDecimals: 1 });
    expect(a.map(s => s.quotientDigit)).toEqual([0, 5]);
    expect(a[0]!.comma).toBe(true);
    const b = divisionSteps({ dividend: 8, divisor: 5, quotient: 16, remainder: 0, dividendDecimals: 1, quotientDecimals: 2 });
    expect(b.map(s => s.digit).join("")).toBe("080");
    expect(b.map(s => s.quotientDigit)).toEqual([0, 1, 6]);
  });
  it("avvisar omöjliga val", () => {
    expect(() => genDivision(3, 3, 1, 8, false, 0, 1)).toThrow();
    expect(() => genDivision(2, 9, 1, 8, true, 1, 0)).toThrow();
    expect(() => genDivision(2, 9, 1, 8, true, -1, 0)).toThrow();
  });
  it("Slumpa ger 0–3 decimaler per uppgift och alla går jämnt ut", () => {
    for (const extra of [0, 1, 2]) {
      const tasks = genDivision(2, 9, 1, 60, false, -1, extra);
      const decs = new Set(tasks.map(t => t.dividendDecimals ?? 0));
      expect(decs.size).toBeGreaterThan(1);
      for (const t of tasks) {
        expect(t.dividendDecimals ?? 0).toBeGreaterThanOrEqual(0);
        expect(t.dividendDecimals ?? 0).toBeLessThanOrEqual(3);
        expect(t.quotientDecimals).toBe((t.dividendDecimals ?? 0) + extra);
        expect(t.quotient * t.divisor).toBe(t.dividend * 10 ** extra);
        const steps = divisionSteps(t);
        expect(steps.at(-1)?.remainder).toBe(0);
      }
    }
  });
});
