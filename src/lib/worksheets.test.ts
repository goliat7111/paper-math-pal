import { describe, expect, it } from "vitest";
import { digitValue, gen102, genSetup, setupLayout, setupValue } from "./worksheets";

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

describe("setupLayout", () => {
  it("tre­siffrigt tal med ensiffrig faktor: allt högerställt mot ental", () => {
    const L = setupLayout({ digits: [4, 8, 3], m: [2] }); // 483 × 2 = 966
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "4", "8", "3"]);
    expect(L.bottomRow).toEqual(["", "", "", "2"]);
    expect(L.productRow).toEqual(["", "9", "6", "6"]);
    expect(L.signCol).toBe(1); // × under "4"
    expect(L.partialRows).toEqual([]);
    expect(L.carries).toEqual([1]); // 483 × 2 = 966, minnessiffra 1 vid hundratalet
  });

  it("tre­siffrigt tal med fyrsiffrig produkt: produkten fyller vänstra kolumnen", () => {
    const L = setupLayout({ digits: [2, 0, 5], m: [8] }); // 205 × 8 = 1640
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "2", "0", "5"]);
    expect(L.productRow).toEqual(["1", "6", "4", "0"]);
  });

  it("två­siffrigt tal: tal och produkt högerställda, × under första siffran", () => {
    const L = setupLayout({ digits: [4, 7], m: [6] }); // 47 × 6 = 282
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "", "4", "7"]);
    expect(L.bottomRow).toEqual(["", "", "", "6"]);
    expect(L.productRow).toEqual(["", "2", "8", "2"]);
    expect(L.signCol).toBe(2);
  });

  it("fyrsiffrigt tal (max 9999) med ensiffrig faktor", () => {
    const L = setupLayout({ digits: [9, 9, 9, 9], m: [9] }); // 9999 × 9 = 89991
    expect(L.nCols).toBe(5);
    expect(L.topRow).toEqual(["", "9", "9", "9", "9"]);
    expect(L.productRow).toEqual(["8", "9", "9", "9", "1"]);
    expect(L.signCol).toBe(1); // × under första "9"
  });

  it("två­siffrig undre faktor: delprodukter med förskjutning", () => {
    const L = setupLayout({ digits: [3, 4, 5, 6], m: [2, 3] }); // 3456 × 23 = 79488
    expect(L.nCols).toBe(5);
    expect(L.topRow).toEqual(["", "3", "4", "5", "6"]);
    expect(L.bottomRow).toEqual(["", "", "", "2", "3"]);
    expect(L.signCol).toBe(1); // × under "3" (3456 × 23 → × under 3, 23 till höger)
    expect(L.partialRows).toEqual([
      { cells: ["6", "9", "1", "2", ""], carries: [1, 1] }, // 3456 × 2
      { cells: ["1", "0", "3", "6", "8"], carries: [1, 1, 1, 1] }, // 3456 × 3
    ]);
    expect(L.productRow).toEqual(["7", "9", "4", "8", "8"]);
    expect(L.carries).toEqual([]);
  });

  it("lik långa tal: ×-tecknet flyttas ett steg vänster om den undre faktorn", () => {
    const L = setupLayout({ digits: [4, 7], m: [2, 3] }); // 47 × 23 = 1081
    expect(L.nCols).toBe(4);
    expect(L.signCol).toBe(1);
    expect(L.topRow).toEqual(["", "", "4", "7"]);
    expect(L.bottomRow).toEqual(["", "", "2", "3"]);
    expect(L.partialRows.map((p) => p.cells)).toEqual([
      ["", "9", "4", ""], // 47 × 2
      ["", "1", "4", "1"], // 47 × 3
    ]);
    expect(L.productRow).toEqual(["1", "0", "8", "1"]);
  });

  it("längre undre faktor: ×-tecknet hamnar vänster om den undre faktorn", () => {
    const L = setupLayout({ digits: [2, 5], m: [1, 2, 3] }); // 25 × 123 = 3075
    expect(L.nCols).toBe(5);
    expect(L.signCol).toBe(1);
    expect(L.topRow).toEqual(["", "", "", "2", "5"]);
    expect(L.bottomRow).toEqual(["", "", "1", "2", "3"]);
    expect(L.partialRows.map((p) => p.cells)).toEqual([
      ["", "2", "5", "", ""], // 25 × 1
      ["", "", "5", "0", ""], // 25 × 2
      ["", "", "", "7", "5"], // 25 × 3
    ]);
    expect(L.productRow).toEqual(["", "3", "0", "7", "5"]);
  });

  it("minnessiffrorna i beräkningsordning (ental först), endast de som uppstår", () => {
    expect(setupLayout({ digits: [5, 7, 3], m: [4] }).carries).toEqual([1, 2, 2]); // 573 × 4
    expect(setupLayout({ digits: [9, 9, 9], m: [9] }).carries).toEqual([8, 8, 8]);
    expect(setupLayout({ digits: [1, 1, 1], m: [2] }).carries).toEqual([]); // inga minnessiffror
    expect(setupLayout({ digits: [5, 7, 3], m: [2, 4] }).partialRows[1]!.carries).toEqual([1, 2, 2]);
  });

  it("invariant: produkten rättlinjad mot faktorerna för slumpade uppgifter", () => {
    for (const t of [...genSetup(), ...genSetup([2, 4], [2, 3], 25)]) {
      const L = setupLayout(t);
      const topStart = L.topRow.findIndex((d) => d !== "");
      const top = digitValue(t.digits);
      const bottom = digitValue(t.m);
      const key = `${t.digits.join("")}×${t.m.join("")}`;
      // ×-tecknet ligger i samma kolumn som första siffran i den övre faktorn
      // (eller ett steg vänster om den undre faktorn när den är minst lika lång)
      if (t.digits.length > t.m.length) {
        expect(L.signCol, `× för ${key}`).toBe(topStart);
        expect(L.signCol, `× vänster om undre faktorn för ${key}`).toBeLessThan(
          L.bottomRow.findIndex((d) => d !== ""),
        );
      } else {
        expect(L.signCol, `× för ${key}`).toBe(
          L.bottomRow.findIndex((d) => d !== "") - 1,
        );
      }
      // Den undre faktorn och den övre faktorns sista siffra delar entalskolumn
      expect(L.topRow[L.nCols - 1], `ental för ${key}`).toBe(
        String(t.digits[t.digits.length - 1]),
      );
      expect(L.bottomRow[L.nCols - 1], `faktorens ental för ${key}`).toBe(
        String(t.m[t.m.length - 1]),
      );
      // Produkten är högerställd: sista produktsiffran i entalskolumnen
      const product = String(setupValue(t));
      const filled = L.productRow.map((d, i) => (d !== "" ? i : -1)).filter((i) => i >= 0);
      expect(filled, `produktkolumner för ${key}`).toEqual(
        Array.from({ length: product.length }, (_, i) => L.nCols - product.length + i),
      );
      // Delprodukterna är förskjutna ett steg per position och stämmer värdemässigt
      L.partialRows.forEach((p, r) => {
        const digit = t.m[r]!; // mest signifikanta siffran först
        const expected = String(top * digit);
        const shift = t.m.length - 1 - r;
        const pFilled = p.cells.map((d, i) => (d !== "" ? i : -1)).filter((i) => i >= 0);
        expect(pFilled, `delprodukt ${r} för ${key}`).toEqual(
          Array.from(
            { length: expected.length },
            (_, i) => L.nCols - 1 - shift - expected.length + 1 + i,
          ),
        );
        expect(p.cells.filter((d) => d !== "").join("")).toBe(expected);
      });
      // Minst fyra sifferkolumner
      expect(L.nCols).toBeGreaterThanOrEqual(4);
      expect(L.bottomRow.findIndex((d) => d !== "")).toBeGreaterThan(L.signCol - 2);
    }
  });
});

describe("genSetup", () => {
  it("ger önskat antal uppgifter med standardinställningen (3 siffror, 1-siffrig faktor)", () => {
    const tasks = genSetup();
    expect(tasks).toHaveLength(12);
    for (const t of tasks) {
      expect(t.digits).toHaveLength(3);
      expect(t.m).toHaveLength(1);
      expect(setupValue(t)).toBeGreaterThan(0);
    }
  });

  it("respekterar valt antal siffror i det övre talet (1–3 siffror)", () => {
    for (const digitCount of [1, 2, 3] as const) {
      const tasks = genSetup([digitCount, digitCount], [1, 1], 20);
      for (const t of tasks) {
        expect(t.digits, `${digitCount} siffror`).toHaveLength(digitCount);
        expect(digitValue(t.digits)).toBeLessThanOrEqual(999);
      }
    }
  });

  it("respekterar valt antal siffror i den undre faktorn (1–3 siffror)", () => {
    for (const digitCount of [1, 2, 3] as const) {
      const tasks = genSetup([3, 3], [digitCount, digitCount], 20);
      for (const t of tasks) {
        expect(t.m, `${digitCount} siffror`).toHaveLength(digitCount);
        expect(digitValue(t.m)).toBeLessThanOrEqual(999);
      }
    }
  });

  it("blandar talsort när sifferintervallet spänner över flera värden", () => {
    const tasks = genSetup([2, 3], [1, 3], 40);
    expect(new Set(tasks.map((t) => t.digits.length)).size).toBeGreaterThan(1);
    expect(new Set(tasks.map((t) => t.m.length)).size).toBeGreaterThan(1);
    for (const t of tasks) {
      expect(t.digits.length).toBeGreaterThanOrEqual(2);
      expect(t.digits.length).toBeLessThanOrEqual(3);
      expect(t.m.length).toBeGreaterThanOrEqual(1);
      expect(t.m.length).toBeLessThanOrEqual(3);
    }
  });

  it("första siffran är aldrig 0, i något av talen", () => {
    for (const t of genSetup([1, 3], [1, 3], 60)) {
      expect(t.digits[0], `första siffran i ${t.digits.join("")}`).toBeGreaterThan(0);
      expect(t.m[0], `första siffran i ${t.m.join("")}`).toBeGreaterThan(0);
    }
  });

  it("tål omvända sifferintervall (max före min)", () => {
    const tasks = genSetup([4, 2], [3, 1], 12);
    for (const t of tasks) {
      expect(t.digits.length).toBeGreaterThanOrEqual(2);
      expect(t.digits.length).toBeLessThanOrEqual(4);
      expect(t.m.length).toBeGreaterThanOrEqual(1);
      expect(t.m.length).toBeLessThanOrEqual(3);
    }
  });
});
