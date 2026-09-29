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
  /** Visningsdecimaler när uttrycket skrivs annorlunda än uträkningen (förlänga/förkorta). */
  shownDecimals?: { dividend: number; divisor: number };
};

/** Hur många extra decimaler nämnaren kan ge (största exponenten av 2 och 5). */
export const extraCapacity = (d: number) => {
  let two = 0, five = 0;
  while (d % 2 === 0) { d /= 2; two++; }
  while (d % 5 === 0) { d /= 5; five++; }
  return Math.max(two, five);
};

/** dividendDecimals = -1 betyder "Slumpa": varje uppgift får 0–3 decimaler i täljaren.
 *  extraDecimals = -1 betyder "Slumpa": varje uppgift får 1–3 extra decimaler i svaret. */
export function genDivision(
  dividendMin: number,
  dividendMax: number,
  divisorMin: number,
  divisorMax: number,
  count = 8,
  withRemainder = false,
  dividendDecimals = 0,
  extraDecimals = 0,
): DivisionTask[] {
  if (![dividendMin, dividendMax, divisorMin, divisorMax, count, dividendDecimals, extraDecimals].every(Number.isInteger)
    || dividendMin < 2 || dividendMax > 9999 || dividendMin > dividendMax
    || divisorMin < 2 || divisorMax > 9 || divisorMin > divisorMax
    || count < 1 || count > 40
    || dividendDecimals < -1 || dividendDecimals > 3 || extraDecimals < -1 || extraDecimals > 3) {
    throw new Error("Välj täljare mellan 2 och 9999 och nämnare mellan 2 och 9.");
  }
  if (withRemainder && (dividendDecimals !== 0 || extraDecimals !== 0)) {
    throw new Error("Rest kan bara väljas för heltal utan extra decimaler.");
  }
  if (dividendDecimals === 0 && extraDecimals === 0) {
    return Array.from({ length: count }, () => {
      for (let tries = 0; tries < 20000; tries++) {
        const divisor = rand(divisorMin, divisorMax);
        const qMin = Math.max(1, Math.ceil(dividendMin / divisor));
        const qMax = Math.floor(dividendMax / divisor);
        if (qMin > qMax) continue;
        const quotient = rand(qMin, qMax);
        const remainder = withRemainder ? rand(1, divisor - 1) : 0;
        const dividend = divisor * quotient + remainder;
        if (dividend > dividendMax) continue;
        return { dividend, divisor, quotient, remainder };
      }
      throw new Error("Hittade inga passande divisioner. Prova ett större talområde för täljaren.");
    });
  }
  const pools = new Map<number, number[]>();
  for (const k of extraDecimals === -1 ? [1, 2, 3] : [extraDecimals]) {
    pools.set(k, [2, 3, 4, 5, 6, 7, 8, 9].filter(d => d >= divisorMin && d <= divisorMax && extraCapacity(d) >= k));
  }
  const avail = [...pools.entries()].filter(([, p]) => p.length);
  if (!avail.length) {
    if (extraDecimals === -1) throw new Error("Extra decimaler kräver någon av nämnarna 2, 4, 5, 6 eller 8.");
    const ok = [2, 3, 4, 5, 6, 7, 8, 9].filter(d => extraCapacity(d) >= extraDecimals).join(", ");
    throw new Error(`${extraDecimals} extra decimal${extraDecimals > 1 ? "er" : ""} kräver någon av nämnarna ${ok}.`);
  }
  return Array.from({ length: count }, () => {
    for (let tries = 0; tries < 20000; tries++) {
      const dd = dividendDecimals === -1 ? rand(0, 3) : dividendDecimals;
      const extraN = extraDecimals === -1 ? avail[rand(0, avail.length - 1)]![0] : extraDecimals;
      const pool = pools.get(extraN)!;
      const divisor = pool[rand(0, pool.length - 1)]!;
      const scaledDividend = rand(dividendMin * 10 ** dd, dividendMax * 10 ** dd);
      if (dd > 0 && scaledDividend % 10 === 0) continue; // täljaren har exakt valda decimaler
      const qDec = dd + extraN;
      const scaled = scaledDividend * 10 ** extraN;
      if (scaled % divisor !== 0) continue;
      const quotient = scaled / divisor;
      if (qDec > 0 && quotient % 10 === 0) continue; // kvoten slutar aldrig på 0
      return { dividend: scaledDividend, divisor, quotient, remainder: 0, dividendDecimals: dd, quotientDecimals: qDec };
    }
    throw new Error("Hittade inga passande divisioner. Prova andra inställningar.");
  });
}

/** Uppgifter där eleven förlänger eller förkortar för att kunna räkna i huvudet,
 *  t.ex. 3,6 / 0,6 = 36 / 6 = 6 eller 4,8 / 0,06 = 480 / 6 = 80.
 *  Nämnaren är alltid ensiffrig (2–9) med 1–2 decimaler; uträkningen lagras förlängd. */
export function genExtendDivision(count = 8): DivisionTask[] {
  const tasks: DivisionTask[] = [];
  const seen = new Set<string>();
  for (let tries = 0; tasks.length < count && tries < 200000; tries++) {
    const divisor = rand(2, 9);
    const divisorDec = rand(1, 2);
    const quotient = rand(2, 12);
    const dividend = divisor * quotient;
    // Täljaren visar 0–divisorDec decimaler; visar den färre får eleven förlänga extra mycket.
    const dividendDec = rand(0, divisorDec);
    if (dividendDec > 0 && dividend % 10 === 0) continue; // aldrig nolla som sista decimalsiffra
    const key = `${dividend}.${dividendDec}/${divisor}.${divisorDec}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push({ dividend, divisor, quotient, remainder: 0,
      shownDecimals: { dividend: dividendDec, divisor: divisorDec } });
  }
  if (tasks.length < count) throw new Error("Hittade inga passande divisioner.");
  return tasks;
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
