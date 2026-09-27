import { rand } from "./worksheets";

/** dividend och quotient är skalade heltal: täljaren = dividend / 10^dividendDecimals,
 *  kvoten = quotient / 10^quotientDecimals. Utan decimaler är de vanliga heltal. */
export type DivisionTask = {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  dividendDecimals?: number;
  quotientDecimals?: number;
};

/** Hur många extra decimaler nämnaren kan ge (största exponenten av 2 och 5). */
export const extraCapacity = (d: number) => {
  let two = 0, five = 0;
  while (d % 2 === 0) { d /= 2; two++; }
  while (d % 5 === 0) { d /= 5; five++; }
  return Math.max(two, five);
};

export function genDivision(
  divisorMin: number,
  divisorMax: number,
  quotientDigits: number,
  count = 8,
  withRemainder = false,
  dividendDecimals = 0,
  extraDecimals = 0,
): DivisionTask[] {
  if (![divisorMin, divisorMax, quotientDigits, count, dividendDecimals, extraDecimals].every(Number.isInteger)
    || divisorMin < 2 || divisorMax > 9 || divisorMin > divisorMax
    || quotientDigits < 1 || quotientDigits > 3 || count < 1 || count > 40
    || dividendDecimals < 0 || dividendDecimals > 3 || extraDecimals < 0 || extraDecimals > 3) {
    throw new Error("Välj nämnare mellan 2 och 9 och 1–3 siffror i svaret.");
  }
  if (withRemainder && (dividendDecimals > 0 || extraDecimals > 0)) {
    throw new Error("Rest kan bara väljas för heltal utan extra decimaler.");
  }
  if (dividendDecimals === 0 && extraDecimals === 0) {
    return Array.from({ length: count }, () => {
      const divisor = rand(divisorMin, divisorMax);
      const quotient = rand(10 ** (quotientDigits - 1), 10 ** quotientDigits - 1);
      const remainder = withRemainder ? rand(1, divisor - 1) : 0;
      return { dividend: divisor * quotient + remainder, divisor, quotient, remainder };
    });
  }
  const pool: number[] = [];
  for (let d = divisorMin; d <= divisorMax; d++) if (extraCapacity(d) >= extraDecimals) pool.push(d);
  if (!pool.length) {
    const ok = [2, 3, 4, 5, 6, 7, 8, 9].filter(d => extraCapacity(d) >= extraDecimals).join(", ");
    throw new Error(`${extraDecimals} extra decimal${extraDecimals > 1 ? "er" : ""} kräver någon av nämnarna ${ok}.`);
  }
  const qDec = dividendDecimals + extraDecimals;
  const scale = 10 ** extraDecimals;
  return Array.from({ length: count }, () => {
    for (let tries = 0; tries < 20000; tries++) {
      const divisor = pool[rand(0, pool.length - 1)]!;
      // Heltalsdelen: en siffra tillåter 0 (t.ex. 4/8 = 0,5)
      const intPart = quotientDigits === 1 ? rand(0, 9) : rand(10 ** (quotientDigits - 1), 10 ** quotientDigits - 1);
      const frac = rand(1, 10 ** qDec - 1);
      if (frac % 10 === 0) continue; // kvoten slutar aldrig på 0
      const quotient = intPart * 10 ** qDec + frac;
      const scaled = quotient * divisor;
      if (scaled % scale !== 0) continue;
      const dividend = scaled / scale;
      if (dividendDecimals > 0 && dividend % 10 === 0) continue; // täljaren har exakt valda decimaler
      if (dividendDecimals === 0 && dividend < divisor && extraDecimals === 0) continue;
      return { dividend, divisor, quotient, remainder: 0, dividendDecimals, quotientDecimals: qDec };
    }
    throw new Error("Hittade inga passande divisioner. Prova andra nämnare.");
  });
}

/** Resten från föregående siffra skrivs framför nästa siffra i kort division.
 *  Vid decimaler läggs nollor till (added) och kommat markeras efter heltalsdelen. */
export function divisionSteps(task: DivisionTask) {
  const dd = task.dividendDecimals ?? 0;
  const extra = Math.max(0, (task.quotientDecimals ?? 0) - dd);
  const base = String(task.dividend).padStart(dd + 1, "0");
  const intLen = base.length - dd;
  const all = base + "0".repeat(extra);
  let carry = 0;
  return all.split("").map((digit, i) => {
    const incoming = carry;
    const value = carry * 10 + Number(digit);
    const quotientDigit = Math.floor(value / task.divisor);
    carry = value % task.divisor;
    return { digit, incoming, quotientDigit, remainder: carry, comma: dd + extra > 0 && i === intLen - 1, added: i >= base.length };
  });
}
