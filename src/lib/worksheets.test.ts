import { describe, expect, it } from "vitest";
import { gen102 } from "./worksheets";

const count = <T,>(items: T[]) => {
  const m = new Map<T, number>();
  for (const n of items) m.set(n, (m.get(n) ?? 0) + 1);
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

  describe("små intervall (färre unika än 102)", () => {
    it("hanterar ett enda möjligt tal (faktorintervall med ett värde)", () => {
      const tasks = gen102([2, 2], [3, 3]);
      expect(tasks).toHaveLength(102);
      for (const t of tasks) {
        expect(t.a).toBe(2);
        expect(t.b).toBe(3);
      }
    });

    it("tar med varje unik multiplikation även när de är mycket få", () => {
      const ranges: [[number, number], [number, number]][] = [
        [[2, 3], [2, 2]], // 2 unika
        [[5, 5], [7, 8]], // 2 unika
        [[3, 3], [4, 6]], // 3 unika
      ];
      for (const [f1, f2] of ranges) {
        const tasks = gen102(f1, f2);
        const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
        const expected = (f1[1] - f1[0] + 1) * (f2[1] - f2[0] + 1);
        expect(seen.size, `intervall ${f1}/${f2}`).toBe(expected);
      }
    });

    it("fyller upp med dubbletter först när alla unika tagits med", () => {
      const tasks = gen102([2, 3], [2, 2]); // 2 unika → 100 dubbletter
      const counts = count(tasks.map((t) => `${t.a}x${t.b}`));
      expect([...counts.values()].every((c) => c >= 1)).toBe(true);
      expect([...counts.values()].reduce((s, c) => s + c, 0)).toBe(102);
      // Varje unik kombinaton bör användas ungefär lika ofta (max 1 skillnad)
      const cVals = [...counts.values()];
      expect(Math.max(...cVals) - Math.min(...cVals)).toBeLessThanOrEqual(1);
    });

    it("faktorfördelningen är jämn även för minsta möjliga intervall", () => {
      const tasks = gen102([2, 2], [3, 3]);
      expect(count(tasks.map((t) => t.a)).get(2)).toBe(102);
      expect(count(tasks.map((t) => t.b)).get(3)).toBe(102);
    });

    it("tål omvända intervall (max före min)", () => {
      const tasks = gen102([9, 2], [9, 3]);
      expect(tasks).toHaveLength(102);
      for (const t of tasks) {
        expect(t.a).toBeGreaterThanOrEqual(2);
        expect(t.a).toBeLessThanOrEqual(9);
        expect(t.b).toBeGreaterThanOrEqual(3);
        expect(t.b).toBeLessThanOrEqual(9);
      }
      const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
      expect(seen.size).toBe(56); // samma som 2–9 / 3–9
    });
  });

  describe("stora intervall (fler unika än 102)", () => {
    it("ger bara unika uppgifter för flera stora intervall", () => {
      const ranges: [[number, number], [number, number]][] = [
        [[1, 12], [1, 12]], // 144 unika
        [[1, 15], [1, 15]], // 225 unika
        [[1, 20], [1, 20]], // 400 unika
        [[2, 30], [2, 30]], // 841 unika
      ];
      for (const [f1, f2] of ranges) {
        const tasks = gen102(f1, f2);
        const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
        expect(seen.size, `intervall ${f1}/${f2}`).toBe(102);
      }
    });

    it("blir alla unika redan när de unika precis överstiger 102", () => {
      const tasks = gen102([1, 8], [1, 13]); // 8 × 13 = 104 unika
      const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
      expect(seen.size).toBe(102);
    });

    it("blir alla unika när de unika är exakt 102", () => {
      const tasks = gen102([1, 6], [1, 17]); // 6 × 17 = 102 unika
      const seen = new Set(tasks.map((t) => `${t.a}x${t.b}`));
      expect(seen.size).toBe(102);
      const cA = [...count(tasks.map((t) => t.a)).values()];
      const cB = [...count(tasks.map((t) => t.b)).values()];
      // Varje kombination förekommer exakt en gång
      expect(Math.max(...cA)).toBeLessThanOrEqual(17);
      expect(Math.max(...cB)).toBeLessThanOrEqual(6);
    });

    it("håller sig inom stora intervall", () => {
      for (const t of gen102([10, 25], [3, 40])) {
        expect(t.a).toBeGreaterThanOrEqual(10);
        expect(t.a).toBeLessThanOrEqual(25);
        expect(t.b).toBeGreaterThanOrEqual(3);
        expect(t.b).toBeLessThanOrEqual(40);
      }
    });
  });
});
