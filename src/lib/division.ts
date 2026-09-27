import { rand } from "./worksheets";

export type DivisionTask = { dividend: number; divisor: number; quotient: number; remainder: number };

export function genDivision(divisorMin: number, divisorMax: number, quotientDigits: number, count = 8, withRemainder = false): DivisionTask[] {
  if (![divisorMin, divisorMax, quotientDigits, count].every(Number.isInteger)
    || divisorMin < 2 || divisorMax > 9 || divisorMin > divisorMax
    || quotientDigits < 1 || quotientDigits > 3 || count < 1 || count > 40) {
    throw new Error("Välj nämnare mellan 2 och 9 och 1–3 siffror i svaret.");
  }
  return Array.from({ length: count }, () => {
    const divisor = rand(divisorMin, divisorMax);
    const quotient = rand(10 ** (quotientDigits - 1), 10 ** quotientDigits - 1);
    const remainder = withRemainder ? rand(1, divisor - 1) : 0;
    return { dividend: divisor * quotient + remainder, divisor, quotient, remainder };
  });
}

/** Resten från föregående siffra skrivs framför nästa siffra i kort division. */
export function divisionSteps(task: DivisionTask) {
  let carry = 0;
  return String(task.dividend).split("").map((digit) => {
    const incoming = carry;
    const value = carry * 10 + Number(digit);
    const quotientDigit = Math.floor(value / task.divisor);
    carry = value % task.divisor;
    return { digit, incoming, quotientDigit, remainder: carry };
  });
}
