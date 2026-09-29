import { divisionSteps, type DivisionTask } from "./division";
import { rand } from "./worksheets";
import type { MixedLevel } from "./mixed";

/** En division i blandade övningar. dividend/divisor/quotient beskriver uträkningen (kort division).
 *  `shown` används när uttrycket skrivs annorlunda än uträkningen (decimal divisor). */
export type MixedDivision = DivisionTask & {
  challenge: number;
  note: string;
  shown?: { dividend: number; dividendDecimals: number; divisor: number; divisorDecimals: number };
  repeating?: boolean;
  rounded?: number; // kvoten avrundad till 2 decimaler, skalad med 100
};

export const DIVISION_CHALLENGES: Record<number, string> = {
  1: "Ensiffrig divisor", 2: "Fler siffror i dividenden", 3: "Första siffran är mindre än divisorn",
  4: "Växling krävs", 5: "Växling i flera steg", 6: "Nolla i dividenden", 7: "Nolla i kvoten",
  8: "Rest", 9: "Rest efter flera steg",
  12: "Kvoten innehåller flera nollor", 13: "Decimal i dividenden", 14: "Kvoten blir ett decimaltal",
  15: "Flera decimaler i kvoten", 16: "Decimal divisor", 17: "Decimaler i båda talen",
  18: "Oändlig decimalutveckling", 19: "Avrundning av kvoten",
};

/** Progression: varje nivå har sina utmaningar; nivå 5 samlar de svåraste, som i sig
 *  innehåller växlingar, nollor, rest och decimaler från tidigare nivåer. */
export const LEVEL_CHALLENGES: Record<MixedLevel, number[]> = {
  1: [1],
  2: [2, 3, 4],
  3: [5, 6, 7, 8],
  4: [9, 12, 13, 14],
  5: [9, 12, 15, 16, 17, 18, 19],
};

const digitsOf = (n: number) => String(n).split("").map(Number);
const carries = (t: DivisionTask) => divisionSteps(t).filter(s => s.incoming > 0).length;

function exact(dMin: number, dMax: number, vMin: number, vMax: number, ok: (t: DivisionTask) => boolean): DivisionTask {
  for (let i = 0; i < 50000; i++) {
    const divisor = rand(vMin, vMax);
    const qMin = Math.ceil(dMin / divisor), qMax = Math.floor(dMax / divisor);
    if (qMin > qMax) continue;
    const quotient = rand(qMin, qMax);
    const t = { dividend: divisor * quotient, divisor, quotient, remainder: 0 };
    if (ok(t)) return t;
  }
  throw new Error("Kunde inte skapa divisionsuppgift.");
}

function withRest(dMin: number, dMax: number, ok: (t: DivisionTask) => boolean): DivisionTask {
  for (let i = 0; i < 50000; i++) {
    const divisor = rand(3, 9), dividend = rand(dMin, dMax);
    const remainder = dividend % divisor;
    const t = { dividend, divisor, quotient: (dividend - remainder) / divisor, remainder };
    if (remainder > 0 && ok(t)) return t;
  }
  throw new Error("Kunde inte skapa divisionsuppgift.");
}

function decimalQuotient(divisors: number[], extra: number): DivisionTask {
  for (let i = 0; i < 50000; i++) {
    const divisor = divisors[rand(0, divisors.length - 1)]!, dividend = rand(10, 99);
    const scaled = dividend * 10 ** extra;
    if (scaled % divisor || dividend % divisor === 0) continue;
    const quotient = scaled / divisor;
    if (quotient % 10 === 0) continue;
    return { dividend, divisor, quotient, remainder: 0, dividendDecimals: 0, quotientDecimals: extra };
  }
  throw new Error("Kunde inte skapa divisionsuppgift.");
}

function build(c: number): Omit<MixedDivision, "challenge" | "note"> {
  switch (c) {
    case 1: {
      const divisor = rand(2, 4);
      const tens = divisor * rand(1, Math.floor(9 / divisor)), ones = divisor * rand(1, Math.floor(9 / divisor));
      return { dividend: tens * 10 + ones, divisor, quotient: (tens * 10 + ones) / divisor, remainder: 0 };
    }
    case 2: return exact(200, 999, 2, 3, t => carries(t) === 0 && digitsOf(t.dividend)[0]! >= t.divisor);
    case 3: return exact(100, 999, 3, 9, t => digitsOf(t.dividend)[0]! < t.divisor && carries(t) <= 1);
    case 4: return exact(20, 99, 2, 6, t => digitsOf(t.dividend)[0]! >= t.divisor && carries(t) === 1);
    case 5: return exact(200, 999, 3, 9, t => digitsOf(t.dividend)[0]! >= t.divisor && carries(t) >= 2);
    case 6: return exact(200, 999, 2, 9, t => digitsOf(t.dividend)[1] === 0 && !digitsOf(t.quotient).includes(0));
    case 7: return exact(200, 999, 2, 9, t => String(t.quotient).length === 3 && digitsOf(t.quotient)[1] === 0);
    case 8: return withRest(20, 99, t => t.quotient >= 10);
    case 9: return withRest(200, 999, t => carries(t) >= 1 && t.quotient >= 100);
    case 12: return exact(1000, 9999, 2, 9, t => digitsOf(t.quotient).filter(d => d === 0).length >= 2 && t.quotient % 10 !== 0);
    case 13: {
      for (;;) {
        const divisor = rand(2, 9), q = rand(11, 99);
        if (q % 10 === 0) continue;
        const dividend = divisor * q;
        if (dividend % 10 === 0 || dividend < 100) continue;
        return { dividend, divisor, quotient: q, remainder: 0, dividendDecimals: 1, quotientDecimals: 1 };
      }
    }
    case 14: return decimalQuotient([2, 4, 5], 2);
    case 15: return decimalQuotient([8], 3);
    case 16: {
      // Ensiffrig decimalnämnare (t.ex. 0,7 eller 0,06): eleven förlänger så nämnaren blir heltal.
      for (;;) {
        const d = rand(2, 9), dec = rand(1, 2), dividend = rand(10, 99);
        const factor = 10 ** dec;
        if ((dividend * factor) % d) continue;
        const converted = dividend * factor;
        return { dividend: converted, divisor: d, quotient: converted / d, remainder: 0,
          shown: { dividend, dividendDecimals: 0, divisor: d, divisorDecimals: dec } };
      }
    }
    case 17: {
      // Decimaler i båda talen, ensiffrig nämnare (t.ex. 7,26 / 0,6 -> 72,6 / 6).
      for (;;) {
        const D = rand(2, 9), q = rand(11, 99);
        if (q % 10 === 0) continue;
        const scaled = D * q; // omskriven täljare med 1 decimal
        if (scaled % 10 === 0) continue;
        return { dividend: scaled, divisor: D, quotient: q, remainder: 0, dividendDecimals: 1, quotientDecimals: 1,
          shown: { dividend: scaled, dividendDecimals: 2, divisor: D, divisorDecimals: 1 } };
      }
    }
    case 18:
    case 19: {
      for (;;) {
        const divisor = [3, 6, 7, 9][rand(0, 3)]!, dividend = rand(10, 99);
        if ((dividend * 1000) % divisor === 0) continue;
        const quotient = Math.floor((dividend * 1000) / divisor);
        const rounded = Math.round((dividend * 100) / divisor);
        return { dividend, divisor, quotient, remainder: 0, dividendDecimals: 0, quotientDecimals: 3,
          ...(c === 18 ? { repeating: true } : { rounded }) };
      }
    }
  }
  throw new Error("Okänd utmaning.");
}

export function genMixedDivision(level: MixedLevel): MixedDivision {
  const pool = LEVEL_CHALLENGES[level];
  const challenge = pool[rand(0, pool.length - 1)]!;
  return { ...build(challenge), challenge, note: DIVISION_CHALLENGES[challenge]! };
}
