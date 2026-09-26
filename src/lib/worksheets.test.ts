import { describe, expect, it } from "vitest";
import { gen102, genSetup, setupLayout, setupValue } from "./worksheets";

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
  it("tre­siffrigt tal med tresiffrig produkt: allt högerställt mot ental", () => {
    const L = setupLayout({ digits: [4, 8, 3], m: 2 }); // 483 × 2 = 966
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "4", "8", "3"]);
    expect(L.productRow).toEqual(["", "9", "6", "6"]);
    expect(L.signCol).toBe(1); // × under "4"
    expect(L.factorCol).toBe(3); // faktorn under "3" (ental)
  });

  it("tre­siffrigt tal med fyrsiffrig produkt: produkten fyller vänstra kolumnen", () => {
    const L = setupLayout({ digits: [2, 0, 5], m: 8 }); // 205 × 8 = 1640
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "2", "0", "5"]);
    expect(L.productRow).toEqual(["1", "6", "4", "0"]);
    expect(L.productRow[L.factorCol]).toBe("0");
  });

  it("två­siffrigt tal: tal och produkt högerställda, × under första siffran", () => {
    const L = setupLayout({ digits: [4, 7], m: 6 }); // 47 × 6 = 282
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["", "", "4", "7"]);
    expect(L.productRow).toEqual(["", "2", "8", "2"]);
    expect(L.signCol).toBe(2);
    expect(L.productRow[L.factorCol]).toBe("2");
  });

  it("fyrsiffrigt tal med fyrsiffrig produkt: ryms i fyra kolumner", () => {
    const L = setupLayout({ digits: [1, 2, 3, 4], m: 5 }); // 1234 × 5 = 6170
    expect(L.nCols).toBe(4);
    expect(L.topRow).toEqual(["1", "2", "3", "4"]);
    expect(L.productRow).toEqual(["6", "1", "7", "0"]);
    expect(L.signCol).toBe(0);
  });

  it("fem­siffrigt tal med fem­siffrig produkt: kolumnerna växer", () => {
    const L = setupLayout({ digits: [1, 2, 3, 4, 5], m: 9 }); // 12345 × 9 = 111105
    expect(L.nCols).toBe(6);
    expect(L.topRow).toEqual(["", "1", "2", "3", "4", "5"]);
    expect(L.productRow).toEqual(["1", "1", "1", "1", "0", "5"]);
    expect(L.signCol).toBe(1);
  });

  it("minnessiffrorna i beräkningsordning (ental först), endast de som uppstår", () => {
    expect(setupLayout({ digits: [5, 7, 3], m: 4 }).carries).toEqual([1, 2, 2]); // 573 × 4
    expect(setupLayout({ digits: [9, 9, 9], m: 9 }).carries).toEqual([8, 8, 8]);
    expect(setupLayout({ digits: [1, 1, 1], m: 2 }).carries).toEqual([]); // inga minnessiffror
  });

  it("invariant: produkten rättlinjad mot faktorerna för slumpade uppgifter", () => {
    for (const t of genSetup([2, 9], 25)) {
      const L = setupLayout(t);
      const topStart = L.topRow.findIndex((d) => d !== "");
      // ×-tecknet ligger i samma kolumn som första siffran i den övre faktorn
      expect(L.signCol, `× för ${t.digits.join("")}×${t.m}`).toBe(topStart);
      // Faktorn och den övre faktorns sista siffra delar entalskolumn
      expect(L.topRow[L.factorCol], `ental för ${t.digits.join("")}×${t.m}`).toBe(
        String(t.digits[t.digits.length - 1]),
      );
      // Produkten är högerställd: sista produktsiffran i entalskolumnen,
      // övriga produktsiffror sammanhängande ett steg till vänster
      const filled = L.productRow.map((d, i) => (d !== "" ? i : -1)).filter((i) => i >= 0);
      const product = String(setupValue(t) * t.m);
      expect(filled, `produktkolumner för ${t.digits.join("")}×${t.m}`).toEqual(
        Array.from({ length: product.length }, (_, i) => L.nCols - product.length + i),
      );
      expect(L.productRow[L.factorCol]).toBe(product.slice(-1));
      // Minst fyra sifferkolumner
      expect(L.nCols).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("genSetup", () => {
  it("ger önskat antal uppgifter med standardinställningen (3 siffror)", () => {
    const tasks = genSetup([2, 9]);
    expect(tasks).toHaveLength(12);
    for (const t of tasks) {
      expect(t.digits).toHaveLength(3);
      expect(t.m).toBeGreaterThanOrEqual(2);
      expect(t.m).toBeLessThanOrEqual(9);
    }
  });

  it("respekterar valt antal siffror i det övre talet (1–5 siffror)", () => {
    for (const digitCount of [1, 2, 3, 4, 5] as const) {
      const tasks = genSetup([2, 9], 20, [digitCount, digitCount]);
      for (const t of tasks) {
        expect(t.digits, `${digitCount} siffror`).toHaveLength(digitCount);
      }
    }
  });

  it("blandar talsort när sifferintervallet spänner över flera värden", () => {
    const tasks = genSetup([2, 9], 40, [2, 4]);
    const lengths = new Set(tasks.map((t) => t.digits.length));
    expect(lengths.size).toBeGreaterThan(1);
    for (const t of tasks) {
      expect(t.digits.length).toBeGreaterThanOrEqual(2);
      expect(t.digits.length).toBeLessThanOrEqual(4);
    }
  });

  it("alla siffror och faktorn håller sig inom faktorintervallet", () => {
    for (const t of genSetup([3, 7], 30, [2, 4])) {
      for (const d of t.digits) {
        expect(d).toBeGreaterThanOrEqual(3);
        expect(d).toBeLessThanOrEqual(7);
      }
      expect(t.m).toBeGreaterThanOrEqual(3);
      expect(t.m).toBeLessThanOrEqual(7);
    }
  });

  it("första siffran i det övre talet är aldrig 0", () => {
    for (const t of genSetup([0, 9], 60, [2, 5])) {
      expect(t.digits[0], `första siffran i ${t.digits.join("")}`).toBeGreaterThan(0);
    }
  });

  it("tål omvända sifferintervall (max före min)", () => {
    const tasks = genSetup([2, 9], 12, [4, 2]);
    for (const t of tasks) {
      expect(t.digits.length).toBeGreaterThanOrEqual(2);
      expect(t.digits.length).toBeLessThanOrEqual(4);
    }
  });
});
