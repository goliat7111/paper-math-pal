import { describe, expect, it } from "vitest";
import { gen102 } from "./worksheets";

const count = (nums: number[]) => {
  const m = new Map<number, number>();
  for (const n of nums) m.set(n, (m.get(n) ?? 0) + 1);
  return m;
};

describe("gen102", () => {
  it("ger alltid exakt 102 uppgifter", () => {
    expect(gen102([2, 9], [3, 9])).toHaveLength(102);
    expect(gen102([2, 3], [3, 4])).toHaveLength(102);
    expect(gen102([1, 12], [1, 12])).toHaveLength(102);
  });

  it("tar med alla unika multiplikationer när de ryms inom 102", () => {
    const ranges: [[number, number], [number, number]][] = [
      [[2, 9], [3, 9]], // 56 unika
      [[2, 5], [2, 5]], // 16 unika
      [[2, 9], [2, 9]], // 64 unika
      [[1, 10], [1, 10]], // 100 unika
      [[7, 7], [3, 9]], // 7 unika
    ];
    for (const [f1, f2] of ranges) {
      const tasks = gen102(f1, f2);
      const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
      const expected = (f1[1] - f1[0] + 1) * (f2[1] - f2[0] + 1);
      expect(seen.size).toBe(expected);
    }
  });

  it("håller sig inom intervallen", () => {
    for (const t of gen102([4, 6], [2, 8])) {
      expect(t.a).toBeGreaterThanOrEqual(4);
      expect(t.a).toBeLessThanOrEqual(6);
      expect(t.b).toBeGreaterThanOrEqual(2);
      expect(t.b).toBeLessThanOrEqual(8);
    }
  });

  it("ger bara unika multiplikationer när de unika inte ryms (fler än 102)", () => {
    const tasks = gen102([1, 12], [1, 12]); // 144 unika > 102 platser
    const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
    expect(seen.size).toBe(102);
  });

  it("fördelar varje faktor så jämnt som möjligt (skillnad högst 1)", () => {
    const ranges: [[number, number], [number, number]][] = [
      [[2, 9], [3, 9]],
      [[2, 5], [2, 5]],
      [[2, 9], [2, 9]],
      [[2, 3], [3, 4]], // få unika, många dubbletter
    ];
    for (const [f1, f2] of ranges) {
      const tasks = gen102(f1, f2);
      for (const [key, values] of [
        ["faktor 1", tasks.map((t) => t.a)],
        ["faktor 2", tasks.map((t) => t.b)],
      ] as const) {
        const counts = [...count(values).values()];
        const spread = Math.max(...counts) - Math.min(...counts);
        expect(spread, `${key} i intervall ${f1}/${f2}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
