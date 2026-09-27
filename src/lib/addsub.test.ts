import { describe, expect, it } from "vitest";
import { addSubLayout, genAddSub, hasRegroup, subBorrows } from "./addsub";

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
});

describe("växling i subtraktion", () => {
  it("400 − 7 markerar 3, 9 och 10", () => {
    const L = addSubLayout({ op: "sub", terms: [400, 7], decs: [0, 0] });
    expect(L.marks).toEqual(["3", "9", "10"]);
    expect(L.struck).toEqual([true, true, false]);
    expect(L.result).toEqual(["3", "9", "3"]);
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
  const tasks = genAddSub({ op: "add", digits: [2, 4], dec: "slumpa", terms: 2, regroup: true, count: 60 });
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

it("slumpa: heltal fylls på med decimalnollor och kommatecknen ligger under varandra", () => {
  const tasks = genAddSub({ op: "add", digits: [2, 4], dec: "slumpa", terms: 3, regroup: true, count: 50 });
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
