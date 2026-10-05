import { describe, expect, it } from "vitest";
import { genMixed, type MixedLevel } from "./mixed";
import { addSubResult, hasRegroup, maxDec } from "./addsub";
import { digitValue, rowCarries, setupValue } from "./worksheets";
import { divisionSteps } from "./division";

describe("blandade övningar", () => {
  it("ger fyra korrekta uppgifter per nivå utan växling på nivå 1", () => {
    for (const level of [1, 2, 3, 4, 5] as MixedLevel[])
      for (let i = 0; i < 30; i++) {
        const t = genMixed(level);
        expect(addSubResult(t.sub)).toBeGreaterThan(0);
        if (!t.div.repeating && t.div.rounded === undefined)
          expect(
            t.div.dividend * 10 ** ((t.div.quotientDecimals ?? 0) - (t.div.dividendDecimals ?? 0)),
          ).toBe(
            t.div.divisor * t.div.quotient +
              t.div.remainder *
                10 ** ((t.div.quotientDecimals ?? 0) - (t.div.dividendDecimals ?? 0)),
          );
        expect(setupValue(t.mul)).toBe(digitValue(t.mul.digits) * digitValue(t.mul.m));
        if (level === 1) {
          expect(hasRegroup(t.add)).toBe(false);
          expect(hasRegroup(t.sub)).toBe(false);
          expect(rowCarries(t.mul.digits, t.mul.m[0]!).every((c) => c === 0)).toBe(true);
          expect(divisionSteps(t.div).every((s) => s.incoming === 0)).toBe(true);
          expect(t.mul.dt ?? 0).toBe(0);
          expect(t.div.dividendDecimals ?? 0).toBe(0);
        }
        if (level === 5) {
          expect(t.add.terms).toHaveLength(3);
          expect(maxDec(t.add)).toBeGreaterThan(0);
          expect(maxDec(t.sub)).toBeGreaterThan(0);
          expect(t.mul.dt).toBeGreaterThan(0);
          expect(t.mul.db).toBe(1);
          expect(t.div.challenge).toBeGreaterThanOrEqual(9);
        }
      }
  });
});
