import { describe, expect, it } from "vitest";
import {
  addSubLayout,
  addSubResult,
  genAddSub,
  genAddSubInRange,
  genTenAddFriends,
  genTenSubFriends,
  hasRegroup,
  scaledTerms,
  subBorrows,
} from "./addsub";

describe("genAddSub", () => {
  for (const op of ["add", "sub"] as const)
    for (const regroup of [true, false])
      for (const dec of [0, 2])
        it(`${op} regroup=${regroup} dec=${dec}`, () => {
          const tasks = genAddSub({ op, digits: [dec + 2, 5], dec, terms: 3, regroup, count: 50 });

          for (const t of tasks) {
            expect(hasRegroup(t)).toBe(regroup);
            expect(t.terms.length).toBe(op === "sub" ? 2 : 3);
            if (op === "sub") expect(t.terms[0]!).toBeGreaterThan(t.terms[1]!);
            if (dec) t.terms.forEach((v) => expect(v % 10).not.toBe(0));
          }
        });

  it.each(["add", "sub"] as const)(
    "skapar 100 heltalsuppgifter för sexminutersbladet (%s)",
    (op) => {
      const tasks = genAddSub({ op, digits: [1, 2], dec: 0, terms: 2, regroup: true, count: 100 });
      expect(tasks).toHaveLength(100);
      for (const task of tasks) {
        expect(task.op).toBe(op);
        expect(hasRegroup(task)).toBe(true);
        if (op === "sub") expect(addSubResult(task)).toBeGreaterThan(0);
      }
    },
  );
});

describe("genAddSubInRange", () => {
  it.each([
    [1, 10],
    [1, 20],
    [10, 20],
    [10, 100],
  ])("skapar additionsuppgifter med summor inom intervallet %i-%i", (min, max) => {
    for (const regroup of [true, false]) {
      const tasks = genAddSubInRange(min, max, 50, regroup);
      expect(tasks).toHaveLength(50);
      for (const task of tasks) {
        expect(task.op).toBe("add");
        expect(task.terms).toHaveLength(2);
        const sum = addSubResult(task);
        expect(sum).toBeGreaterThanOrEqual(min);
        expect(sum).toBeLessThanOrEqual(max);
        if (min === 10) expect(task.terms.some((term) => term >= min)).toBe(true);
        expect(hasRegroup(task)).toBe(regroup);
      }
    }
  });

  it("varierar additionerna för samma summa", () => {
    const sumEight = genAddSubInRange(8, 8, 5, false);
    expect(new Set(sumEight.map((task) => task.terms.join("+"))).size).toBe(4);
  });

  it("sprider 1-20 jämnt över alla möjliga additionskombinationer", () => {
    const tasks = genAddSubInRange(1, 20, 250, true);
    const expected = new Set<string>();
    for (let left = 1; left <= 20; left++) {
      for (let right = left; right <= 20; right++) {
        const candidate = { op: "add" as const, terms: [left, right], decs: [0, 0] };
        const sum = addSubResult(candidate);
        if (sum >= 1 && sum <= 20 && hasRegroup(candidate)) {
          expected.add(candidate.terms.join("+"));
        }
      }
    }
    const combinations = new Map<string, number>();
    for (const task of tasks) {
      const key = [...task.terms].sort((a, b) => a - b).join("+");
      combinations.set(key, (combinations.get(key) ?? 0) + 1);
    }
    const counts = [...combinations.values()];
    expect(new Set(combinations.keys())).toEqual(expected);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("placerar tvåsiffriga termer jämnt till vänster och höger i 10-20", () => {
    const tasks = genAddSubInRange(10, 20, 200, true);
    let twoDigitLeft = 0;
    let twoDigitRight = 0;
    for (const task of tasks) {
      const [left, right] = task.terms;
      const leftIsTwoDigit = left! >= 10 && left! < 100;
      const rightIsTwoDigit = right! >= 10 && right! < 100;
      if (leftIsTwoDigit === rightIsTwoDigit) continue;
      if (leftIsTwoDigit) twoDigitLeft++;
      else twoDigitRight++;
    }
    expect(Math.abs(twoDigitLeft - twoDigitRight)).toBeLessThanOrEqual(1);
  });

  it.each([
    [1, 10],
    [1, 20],
    [10, 20],
    [10, 100],
  ])("skapar jämnt fördelade subtraktioner med differenser %i-%i", (min, max) => {
    const tasks = genAddSubInRange(min, max, 200, true, "sub");
    const expected = new Set<string>();
    for (let minuend = 1; minuend <= max; minuend++) {
      for (let subtrahend = 1; subtrahend <= minuend; subtrahend++) {
        const candidate = { op: "sub" as const, terms: [minuend, subtrahend], decs: [0, 0] };
        const difference = addSubResult(candidate);
        if (difference <= max && (difference >= min || (min === 1 && difference === 0))) {
          expected.add(candidate.terms.join("-"));
        }
      }
    }
    const counts = new Map<string, number>();
    for (const task of tasks) {
      expect(task.op).toBe("sub");
      const difference = addSubResult(task);
      if (min === 1) expect(difference).toBeGreaterThanOrEqual(0);
      else expect(difference).toBeGreaterThanOrEqual(min);
      expect(difference).toBeLessThanOrEqual(max);
      expect(Math.max(...task.terms)).toBeLessThanOrEqual(max);
      expect(task.terms[0]).toBeGreaterThanOrEqual(task.terms[1]!);
      const key = task.terms.join("-");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const frequencies = [...counts.values()];
    if (expected.size <= tasks.length) {
      expect(new Set(counts.keys())).toEqual(expected);
      expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
    } else {
      expect(counts.size).toBe(tasks.length);
      expect([...counts.keys()].every((key) => expected.has(key))).toBe(true);
    }
    expect(new Set(tasks.map((task) => task.terms[0])).size).toBeGreaterThan(1);
  });

  it("tar med alla 55 icke-negativa subtraktioner från 1-1 till 10-10", () => {
    const tasks = genAddSubInRange(1, 10, 55, true, "sub");
    const combinations = new Set(tasks.map((task) => task.terms.join("-")));
    const expected = new Set<string>();
    for (let minuend = 1; minuend <= 10; minuend++) {
      for (let subtrahend = 1; subtrahend <= minuend; subtrahend++) {
        expected.add(`${minuend}-${subtrahend}`);
      }
    }
    expect(combinations).toEqual(expected);
    expect(combinations.has("1-1")).toBe(true);
    expect(tasks.every((task) => Math.max(...task.terms) <= 10)).toBe(true);
  });

  it("fördelar 10-kamrater jämnt mellan subtrahenderna 0-10", () => {
    const tasks = genTenSubFriends(100);
    const counts = new Map<number, number>();
    for (const task of tasks) {
      expect(task.op).toBe("sub");
      expect(task.terms[0]).toBe(10);
      expect(addSubResult(task)).toBeGreaterThanOrEqual(0);
      expect(addSubResult(task)).toBeLessThanOrEqual(10);
      const subtrahend = task.terms[1]!;
      counts.set(subtrahend, (counts.get(subtrahend) ?? 0) + 1);
    }
    expect(counts.size).toBe(11);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("fördelar 10-kamrater jämnt mellan ordnade additioner som blir 10", () => {
    const tasks = genTenAddFriends(100);
    const counts = new Map<string, number>();
    let leftBlank = 0;
    let rightBlank = 0;
    for (const task of tasks) {
      expect(task.op).toBe("add");
      expect(addSubResult(task)).toBe(10);
      const key = task.terms.join("+");
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (task.blankTerm === 0) leftBlank++;
      else rightBlank++;
    }
    expect(counts.size).toBe(11);
    expect(counts.get("3+7")).toBeGreaterThan(0);
    expect(counts.get("7+3")).toBeGreaterThan(0);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
    expect(Math.abs(leftBlank - rightBlank)).toBeLessThanOrEqual(1);
  });

  it("tar med alla 610 subtraktioner med positiva subtrahender och differens mellan -20 och 20", () => {
    const tasks = genAddSubInRange(-20, 20, 610, true, "sub");
    const combinations = new Set(tasks.map((task) => task.terms.join("-")));
    const expected = new Set<string>();
    for (let minuend = -20; minuend <= 20; minuend++) {
      for (let subtrahend = 1; subtrahend <= 20; subtrahend++) {
        const difference = minuend - subtrahend;
        if (difference >= -20 && difference <= 20) {
          expected.add(`${minuend}-${subtrahend}`);
        }
      }
    }
    expect(combinations).toEqual(expected);
    for (const task of tasks) {
      const [minuend, subtrahend] = task.terms;
      const difference = addSubResult(task);
      expect(minuend).toBeGreaterThanOrEqual(-20);
      expect(minuend).toBeLessThanOrEqual(20);
      expect(subtrahend).toBeGreaterThan(0);
      expect(subtrahend).toBeLessThanOrEqual(20);
      expect(difference).toBeGreaterThanOrEqual(-20);
      expect(difference).toBeLessThanOrEqual(20);
    }
  });
});

describe("subtraktion: alltid positiv differens", () => {
  it("ingen genererad subtraktion ger negativ eller noll differens", () => {
    for (const regroup of [true, false])
      for (const dec of [0, 1, 2, "slumpa" as const])
        for (const digits of [
          [2, 2],
          [2, 5],
          [4, 4],
        ] as const) {
          const tasks = genAddSub({
            op: "sub",
            digits: [...digits],
            dec,
            terms: 2,
            regroup,
            count: 40,
          });
          for (const t of tasks) {
            // jämför på verkligt värde (skalat till gemensam decimalantal)
            const s = scaledTerms(t);
            expect(s[0]!).toBeGreaterThan(s[1]!);
            expect(addSubResult(t)).toBeGreaterThan(0);
          }
        }
  });
});

describe("växling i subtraktion", () => {
  it("400 − 7 stryker bara över siffror som faktiskt växlas", () => {
    const L = addSubLayout({ op: "sub", terms: [400, 7], decs: [0, 0] });
    expect(L.marks).toEqual(["", "10", "10"]);
    expect(L.struck).toEqual([true, false, false]);
    expect(L.result).toEqual(["3", "9", "3"]);
  });
  it("does not strike through an original zero when it receives and lends a 10", () => {
    const L = addSubLayout({ op: "sub", terms: [903, 476], decs: [0, 0] });
    expect(L.marks).toEqual(["", "10", "10"]);
    expect(L.marksStruck).toEqual([false, true, false]);
    expect(L.struck).toEqual([true, false, false]);
    expect(L.result).toEqual(["4", "2", "7"]);
  });
  it("strikes each received 10 that must be lent onward across decimal zeroes", () => {
    const L = addSubLayout({ op: "sub", terms: [922, 388], decs: [0, 2] });
    expect(L.marks).toEqual(["", "", "10", "10", "10"]);
    expect(L.marksStruck).toEqual([false, false, true, true, false]);
    expect(L.struck).toEqual([false, true, true, false, false]);
    expect(L.result).toEqual(["9", "1", "8", "1", "2"]);
  });
  it("utan lån ingen markering", () => {
    expect(subBorrows(58, 23).some((c) => c.received)).toBe(false);
  });
});

it("addition: minnessiffror och komma", () => {
  const L = addSubLayout({ op: "add", terms: [48, 57], decs: [1, 1] });
  expect(L.result).toEqual(["1", "0", "5"]);
  expect(L.carries).toEqual(["1", "1", ""]);
  expect(L.commas).toEqual([1, 1]);
  expect(L.resultComma).toBe(1);
});

it("genAddSub med slumpade decimaler håller sig inom sifferintervallet", () => {
  const tasks = genAddSub({
    op: "add",
    digits: [2, 4],
    dec: "slumpa",
    terms: 2,
    regroup: true,
    count: 60,
  });
  expect(tasks).toHaveLength(60);
  for (const t of tasks) {
    expect(t.decs).toHaveLength(t.terms.length);
    t.decs.forEach((d, i) => {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(3);
      // termens sifferantal (inkl. ev. inledande nolla som 0,54) rymmer decimalerna
      const len = Math.max(String(t.terms[i]!).length, d + 1);
      expect(len).toBeGreaterThanOrEqual(2);
      expect(len).toBeLessThanOrEqual(4);
      expect(len).toBeGreaterThan(d);
    });
  }
  // med blandade sifferantal bör både heltal och decimaltal förekomma
  expect(tasks.some((t) => t.decs.every((d) => d === 0))).toBe(true);
  expect(tasks.some((t) => t.decs.some((d) => d > 0))).toBe(true);
  // termerna ska kunna ha olika antal decimaler
  expect(tasks.some((t) => t.decs[0] !== t.decs[1])).toBe(true);
});

it("slumpade decimaler utan växling lagras som heltal med egen decimalprecision", () => {
  for (const op of ["add", "sub"] as const) {
    const tasks = genAddSub({
      op,
      digits: [2, 5],
      dec: "slumpa",
      terms: 2,
      regroup: false,
      count: 120,
    });
    for (const task of tasks) {
      expect(task.terms.every(Number.isInteger)).toBe(true);
      expect(hasRegroup(task)).toBe(false);
    }
  }
});

it("genAddSub slumpa: hela sifferintervallet (inkl. decimaler) används", () => {
  const tasks = genAddSub({
    op: "add",
    digits: [2, 5],
    dec: "slumpa",
    terms: 2,
    regroup: true,
    count: 120,
  });
  const lens = tasks.flatMap((t) =>
    t.terms.map((v, i) => Math.max(String(v).length, t.decs[i]! + 1)),
  );
  expect(Math.min(...lens)).toBeLessThanOrEqual(2);
  expect(Math.max(...lens)).toBe(5);
});

it("slumpa: heltal fylls på med decimalnollor och kommatecknen ligger under varandra", () => {
  const tasks = genAddSub({
    op: "add",
    digits: [2, 4],
    dec: "slumpa",
    terms: 3,
    regroup: true,
    count: 50,
  });
  for (const t of tasks) {
    const L = addSubLayout(t);
    const m = Math.max(...t.decs);
    t.terms.forEach((v, i) => {
      // Varje term visas uppskalad till maxDec decimaler (heltal får decimalnollor).
      const shown = L.rows[i]!.filter((ch) => ch !== "").length;
      expect(shown).toBe(Math.max(String(v * 10 ** (m - t.decs[i]!)).length, m + 1));
      // Kommatecknet ligger i samma kolumn för alla rader när uppgiften har decimaler.
      if (m > 0) expect(L.commas[i]).toBe(L.nCols - 1 - m);
      else expect(L.commas[i]).toBe(-1);
    });
  }
});

it("decimaltal: sifferintervallet 2–5 gäller även med fasta decimaler", () => {
  const tasks = genAddSub({
    op: "add",
    digits: [2, 5],
    dec: 2,
    terms: 2,
    regroup: true,
    count: 80,
  });
  const lens = tasks.flatMap((t) =>
    t.terms.map((v, i) => Math.max(String(v).length, t.decs[i]! + 1)),
  );
  expect(Math.min(...lens)).toBe(2);
  expect(Math.max(...lens)).toBe(5);
  for (const t of tasks) {
    for (const d of t.decs) {
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(2);
    }
  }
});
