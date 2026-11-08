import { rand } from "./worksheets";
import type { DivisionTask } from "./division";

export type ReverseDivisionTask = DivisionTask & {
  missing: "divisor" | "quotient";
};

export const REVERSE_DIVISION_COUNT = 60;

function shuffle<T>(values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return values;
}

export function genReverseDivision(): ReverseDivisionTask[] {
  const factors = shuffle(Array.from({ length: 8 }, (_, index) => index + 2));
  const singlePairs = new Set<string>();
  const key = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
  // En cykel och dess motstående par ger tre enkla faktapar per tabell.
  for (let i = 0; i < factors.length; i++) {
    singlePairs.add(key(factors[i]!, factors[(i + 1) % factors.length]!));
    if (i < 4) singlePairs.add(key(factors[i]!, factors[i + 4]!));
  }
  const balancedPositions = (count: number) =>
    shuffle(
      Array.from({ length: count }, (_, index): "divisor" | "quotient" =>
        index < count / 2 ? "divisor" : "quotient",
      ),
    );
  const singlePositions = balancedPositions(12);
  const doublePositions = balancedPositions(24);
  let singleIndex = 0;
  let doubleIndex = 0;
  const tasks: ReverseDivisionTask[] = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      const single = singlePairs.has(key(a, b));
      const missing = single ? singlePositions[singleIndex++]! : doublePositions[doubleIndex++]!;
      const flip = rand(0, 1) === 1;
      const divisor = flip ? b : a;
      const quotient = flip ? a : b;
      tasks.push({ dividend: a * b, divisor, quotient, remainder: 0, missing });
      if (!single) {
        tasks.push({
          dividend: a * b,
          divisor: quotient,
          quotient: divisor,
          remainder: 0,
          missing: missing === "divisor" ? "quotient" : "divisor",
        });
      }
    }
  }
  return shuffle(tasks);
}
