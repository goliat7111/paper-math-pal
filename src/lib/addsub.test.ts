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
    const L = addSubLayout({ op: "sub", terms: [400, 7], dec: 0 });
    expect(L.marks).toEqual(["3", "9", "10"]);
    expect(L.struck).toEqual([true, true, false]);
    expect(L.result).toEqual(["3", "9", "3"]);
  });
  it("utan lån ingen markering", () => {
    expect(subBorrows(58, 23).some((c) => c.received)).toBe(false);
  });
});

it("addition: minnessiffror och komma", () => {
  const L = addSubLayout({ op: "add", terms: [48, 57], dec: 1 });
  expect(L.result).toEqual(["1", "0", "5"]);
  expect(L.carries).toEqual(["1", "1", ""]);
  expect(L.comma).toBe(1);
});
