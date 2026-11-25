import { describe, expect, it } from "vitest";
import {
  addSubLayout,
  addSubResult,
  addFriendCounts,
  addFriendCountForTerms,
  genAddSub,
  genAddSubInRange,
  genAddFriends,
  genSubFriends,
  subFriendCounts,
  SUB_FRIEND_MAX,
  genTenAddFriends,
  genTenSubFriends,
  hasRegroup,
  scaledTerms,
  subBorrows,
} from "./addsub";

describe("genSubFriends", () => {
  it("erbjuder antal som fördelas lika mellan kolumner och saknade delar", () => {
    expect(subFriendCounts()).toEqual([12, 18, 24, 30, 36, 42, 48, 54, 60]);
  });

  it.each([false, true])(
    "fördelar uppgifterna jämnt för alla minuender, noll: %s",
    (includeZero) => {
      for (let minuend = 3; minuend <= SUB_FRIEND_MAX; minuend++) {
        for (const count of subFriendCounts()) {
          const tasks = genSubFriends(minuend, count, includeZero);
          const min = includeZero ? 0 : 1;
          const frequencies = Array.from({ length: minuend - min * 2 + 1 }, () => 0);
          const missing = { subtrahend: 0, difference: 0 };
          expect(tasks).toHaveLength(count);
          for (const task of tasks) {
            expect(task.terms[0]).toBe(minuend);
            expect(task.terms[1]).toBeGreaterThanOrEqual(min);
            expect(addSubResult(task)).toBeGreaterThanOrEqual(min);
            expect(task.decs).toEqual([0, 0]);
            frequencies[task.terms[1]! - min]!++;
            missing[task.blankPart]++;
          }
          expect(missing).toEqual({ subtrahend: count / 2, difference: count / 2 });
          expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
        }
      }
    },
  );

  it("avvisar ogiltiga värden", () => {
    for (const minuend of [2, 21, 100, 3.5, NaN]) {
      expect(() => genSubFriends(minuend, 12)).toThrow(RangeError);
    }
    expect(() => genSubFriends(10, -1)).toThrow(RangeError);
    expect(() => genSubFriends(10, 1.5)).toThrow(RangeError);
  });
});

describe("genAddFriends", () => {
  it("begränsar valen till 30 vid tre termer och behåller lägre antal vid byte", () => {
    expect(addFriendCounts(2)).toEqual([
      12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60,
    ]);
    expect(addFriendCounts(3)).toEqual([12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
    expect(addFriendCountForTerms(60, 3)).toBe(30);
    expect(addFriendCountForTerms(39, 3)).toBe(30);
    expect(addFriendCountForTerms(27, 3)).toBe(26);
    expect(addFriendCountForTerms(30, 2)).toBe(30);
    expect(addFriendCountForTerms(14, 2)).toBe(15);
    expect(addFriendCountForTerms(20, 2)).toBe(21);
    for (const terms of [2, 3] as const) {
      for (const count of addFriendCounts(terms)) {
        expect(addFriendCounts(terms === 2 ? 3 : 2)).toContain(
          addFriendCountForTerms(count, terms === 2 ? 3 : 2),
        );
        expect(addFriendCountForTerms(count, terms)).toBe(count);
      }
    }
  });

  it.each([2, 3] as const)("skapar 40 uppgifter med %i termer för varje möjlig summa", (terms) => {
    for (let sum = 3; sum <= 99; sum++) {
      const tasks = genAddFriends(sum, terms, 40);
      expect(tasks).toHaveLength(40);
      const blanks = Array<number>(terms).fill(0);
      for (const task of tasks) {
        expect(task.terms).toHaveLength(terms);
        expect(task.terms.every((term) => Number.isInteger(term) && term >= 0)).toBe(true);
        expect(task.decs).toEqual(Array<number>(terms).fill(0));
        expect(addSubResult(task)).toBe(sum);
        expect(task.blankTerm).toBeLessThan(terms);
        blanks[task.blankTerm]!++;
      }
      expect(Math.max(...blanks) - Math.min(...blanks)).toBeLessThanOrEqual(1);
    }
  });

  it.each([2, 3] as const)(
    "prioriterar olika kombinationer och fördelar omkastningar jämnt med %i termer",
    (terms) => {
      for (const includeZero of [false, true]) {
        for (const sum of [3, 5, 10, 20, 99]) {
          const variants = new Map<string, Set<string>>();
          const minimum = includeZero ? 0 : 1;
          for (let first = minimum; first <= sum; first++) {
            for (let second = minimum; second <= sum - first; second++) {
              const values =
                terms === 2 ? [first, sum - first] : [first, second, sum - first - second];
              if (values.some((value) => value < minimum)) continue;
              const key = [...values].sort((a, b) => a - b).join(",");
              const group = variants.get(key) ?? new Set<string>();
              group.add(values.join(","));
              variants.set(key, group);
              if (terms === 2) break;
            }
          }
          for (const count of [1, 12, 30, 60]) {
            const tasks = genAddFriends(sum, terms, count, includeZero);
            const groups = new Map<string, number>();
            const ordered = new Map<string, number>();
            for (const task of tasks) {
              const key = [...task.terms].sort((a, b) => a - b).join(",");
              groups.set(key, (groups.get(key) ?? 0) + 1);
              const orderedKey = task.terms.join(",");
              ordered.set(orderedKey, (ordered.get(orderedKey) ?? 0) + 1);
            }
            expect(groups.size).toBe(Math.min(count, variants.size));
            const frequencies = Array.from(variants.keys(), (key) => groups.get(key) ?? 0);
            expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
            for (const expressions of variants.values()) {
              const frequencies = Array.from(expressions, (key) => ordered.get(key) ?? 0);
              expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
            }
          }
        }
      }
    },
  );

  it.each([2, 3] as const)("kan utesluta noll för varje summa med %i termer", (terms) => {
    for (let sum = 3; sum <= 99; sum++) {
      const tasks = genAddFriends(sum, terms, 60, false);
      expect(tasks).toHaveLength(60);
      for (const task of tasks) {
        expect(task.terms).toHaveLength(terms);
        expect(task.terms.every((term) => Number.isInteger(term) && term > 0)).toBe(true);
        expect(addSubResult(task)).toBe(sum);
        expect(task.terms[task.blankTerm]).toBeGreaterThan(0);
      }
    }
  });

  it("upprepar giltiga kombinationer när summan bara har en lösning utan noll", () => {
    const tasks = genAddFriends(3, 3, 12, false);
    expect(tasks.every((task) => task.terms.join("+") === "1+1+1")).toBe(true);
    expect(tasks.filter((task) => task.blankTerm === 0)).toHaveLength(4);
    expect(tasks.filter((task) => task.blankTerm === 1)).toHaveLength(4);
    expect(tasks.filter((task) => task.blankTerm === 2)).toHaveLength(4);
  });

  it.each(Array.from({ length: 49 }, (_, index) => index + 12))(
    "skapar exakt %i uppgifter med två respektive tre termer",
    (count) => {
      for (const terms of [2, 3] as const) {
        const tasks = genAddFriends(99, terms, count);
        expect(tasks).toHaveLength(count);
        expect(
          tasks.every((task) => task.terms.length === terms && addSubResult(task) === 99),
        ).toBe(true);
      }
    },
  );

  it("avvisar ogiltiga summor och antal", () => {
    for (const sum of [2, 100, 3.5, NaN]) {
      expect(() => genAddFriends(sum, 2, 40)).toThrow(RangeError);
    }
    expect(() => genAddFriends(10, 2, -1)).toThrow(RangeError);
    expect(() => genAddFriends(10, 2, 1.5)).toThrow(RangeError);
  });
});

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
    const tasks = genTenSubFriends(80);
    const counts = new Map<number, number>();
    const blankCounts = { subtrahend: 0, difference: 0 };
    const countsByPart = Array.from({ length: 11 }, () => ({
      subtrahend: 0,
      difference: 0,
    }));
    for (const task of tasks) {
      expect(task.op).toBe("sub");
      expect(task.terms[0]).toBe(10);
      expect(addSubResult(task)).toBeGreaterThanOrEqual(0);
      expect(addSubResult(task)).toBeLessThanOrEqual(10);
      blankCounts[task.blankPart]++;
      const subtrahend = task.terms[1]!;
      counts.set(subtrahend, (counts.get(subtrahend) ?? 0) + 1);
      countsByPart[subtrahend]![task.blankPart]++;
    }
    expect(counts.size).toBe(11);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
    expect(tasks).toHaveLength(80);
    expect(blankCounts).toEqual({ subtrahend: 40, difference: 40 });
    for (const counts of countsByPart) {
      expect(counts.subtrahend).toBeGreaterThanOrEqual(3);
      expect(counts.subtrahend).toBeLessThanOrEqual(4);
      expect(counts.difference).toBeGreaterThanOrEqual(3);
      expect(counts.difference).toBeLessThanOrEqual(4);
      expect(Math.abs(counts.subtrahend - counts.difference)).toBeLessThanOrEqual(1);
    }
  });

  it.each([0, 1, 10, 11, 21, 22, 23, 79, 80, 81, 100])(
    "fördelar %i subtraktioner jämnt både totalt och per saknat värde",
    (count) => {
      const tasks = genTenSubFriends(count);
      const combinations = Array.from({ length: 11 }, () => ({
        subtrahend: 0,
        difference: 0,
      }));
      for (const task of tasks) combinations[task.terms[1]!]![task.blankPart]++;

      const totals = combinations.map((entry) => entry.subtrahend + entry.difference);
      const subtrahendBlanks = combinations.reduce((sum, entry) => sum + entry.subtrahend, 0);
      expect(tasks).toHaveLength(count);
      expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(1);
      expect(Math.abs(subtrahendBlanks - (count - subtrahendBlanks))).toBeLessThanOrEqual(1);
      for (const entry of combinations) {
        expect(Math.abs(entry.subtrahend - entry.difference)).toBeLessThanOrEqual(1);
      }
    },
  );

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
