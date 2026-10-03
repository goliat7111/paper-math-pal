import { describe, expect, it } from "vitest";
import { divisionSteps } from "./division";
import {
  analyzeDivisionComplexity,
  divisionProgression,
  findDivisionCandidates,
  genDivisionProgression,
} from "./division-complexity";

describe("Division - komplexitetsmatris", () => {
  it("skiljer inledande gruppering, växlingar, kvotnollor och slutrest", () => {
    const analyze = (dividend: number, divisor: number) =>
      analyzeDivisionComplexity({
        dividend,
        divisor,
        quotient: Math.floor(dividend / divisor),
        remainder: dividend % divisor,
      });
    expect(analyze(156, 3)).toMatchObject({
      groupFirstDigits: true,
      transfers: 0,
      zeroInQuotient: false,
    });
    expect(analyze(72, 4).transfers).toBe(1);
    expect(analyze(936, 4).transfers).toBe(2);
    expect(analyze(816, 4)).toMatchObject({
      zeroInDividend: false,
      zeroInQuotient: true,
      transfers: 1,
    });
    expect(analyze(85, 4)).toMatchObject({ transfers: 0, withRemainder: true });
    expect(analyze(6013, 4)).toMatchObject({
      transfers: 2,
      zeroInDividend: true,
      zeroInQuotient: true,
      withRemainder: true,
    });
  });

  it("varje kandidat tränar avsett moment och ger korrekt heltalsfacit", () => {
    const pools = divisionProgression.map((step) => findDivisionCandidates(step.rules));
    for (const [i, pool] of pools.entries()) {
      expect(pool.length).toBeGreaterThan(1);
      for (const task of pool) {
        expect(task.dividend).toBe(task.divisor * task.quotient + task.remainder);
        expect(task.remainder).toBeGreaterThanOrEqual(0);
        expect(task.remainder).toBeLessThan(task.divisor);
        const digits = String(task.dividend);
        const steps = divisionSteps(task);
        const start = steps.findIndex((s) => s.quotientDigit > 0);
        const transfers = steps.slice(start, -1).filter((s) => s.remainder > 0).length;
        expect(Number(steps.map((s) => s.quotientDigit).join(""))).toBe(task.quotient);
        expect(steps.at(-1)?.remainder).toBe(task.remainder);
        expect(digits.length).toBe([2, 3, 3, 2, 3, 3, 3, 2, 3, 4, 3, 3][i]);
        expect(Number(digits[0]) < task.divisor).toBe(i === 2 || i === 10);
        expect(digits.includes("0")).toBe(i === 5 || i === 9);
        expect(String(task.quotient).includes("0")).toBe(i === 6 || i === 9 || i === 11);
        expect(task.remainder > 0).toBe(i === 7 || i === 8);
        if (i < 8) expect(transfers).toBe([0, 0, 0, 1, 2, 1, 1, 0][i]);
        else if (i === 8 || i === 9) expect(transfers).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("behåller tio fasta steg och maximerar variationen i de två sista uppgifterna", () => {
    const first = genDivisionProgression(() => 0);
    const last = genDivisionProgression(() => 0.999999);
    expect(first).toHaveLength(12);
    expect(first.slice(0, 10).map((t) => t.note)).toEqual(
      divisionProgression.slice(0, 10).map((step) => step.label),
    );
    expect(first[10]!.note).not.toBe(first[11]!.note);
    for (const task of [first[10]!, first[11]!, last[10]!, last[11]!]) {
      expect(String(task.dividend)).toHaveLength(3);
      expect(task.remainder).toBe(0);
      const complexity = analyzeDivisionComplexity(task);
      const labels = [
        complexity.groupFirstDigits,
        complexity.transfers === 1,
        complexity.transfers >= 2,
        complexity.zeroInDividend,
        complexity.zeroInQuotient,
      ];
      expect(task.note).toBe(
        [
          "Gruppering",
          "En växling",
          "Flera växlingar",
          "Nolla i dividenden",
          "Nolla i kvoten",
        ]
          .filter((_, i) => labels[i])
          .join(" · "),
      );
    }
    const mask = (task: Parameters<typeof analyzeDivisionComplexity>[0]) => {
      const complexity = analyzeDivisionComplexity(task);
      return [
        complexity.groupFirstDigits,
        complexity.transfers === 1,
        complexity.transfers >= 2,
        complexity.zeroInDividend,
        complexity.zeroInQuotient,
        complexity.withRemainder,
      ].reduce((value, present, i) => value | (present ? 1 << i : 0), 0);
    };
    const profiles = [
      ...new Set(findDivisionCandidates({ dividendDigits: 3, withRemainder: false }).map(mask)),
    ];
    const maxChallenges = Math.max(
      ...profiles.flatMap((a) =>
        profiles.map((b) => {
          const covered = a | b;
          let count = 0;
          for (let bits = covered; bits; bits &= bits - 1) count++;
          return count;
        }),
      ),
    );
    for (const tasks of [first, last]) {
      const covered = mask(tasks[10]!) | mask(tasks[11]!);
      let count = 0;
      for (let bits = covered; bits; bits &= bits - 1) count++;
      expect(count).toBe(maxChallenges);
    }
    for (let i = 0; i < 10; i++) expect(first[i]).not.toEqual(last[i]);
    first[0]!.dividend = 0;
    expect(genDivisionProgression(() => 0)[0]!.dividend).toBeGreaterThan(0);
    expect(() => genDivisionProgression(() => 1)).toThrow();
  });

  it("manuella regler kan hitta kombinationer och rapportera omöjliga val", () => {
    expect(
      findDivisionCandidates({ dividendDigits: 3, zeroInDividend: true, withRemainder: true })
        .length,
    ).toBeGreaterThan(0);
    expect(findDivisionCandidates({ dividendDigits: 2, minTransfers: 2 })).toEqual([]);
    expect(() => findDivisionCandidates({ dividendDigits: 3, minTransfers: -1 })).toThrow();
  });
});
