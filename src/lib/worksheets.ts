export const rand = (min: number, max: number) => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};

export type MulTask = { a: number; b: number };

/** 102 tal: 3 kolumner × 34 rader, grupperade i block om 5. */
export function gen102(f1: [number, number], f2: [number, number]): MulTask[] {
  return Array.from({ length: 102 }, () => ({ a: rand(...f1), b: rand(...f2) }));
}

export type SetupTask = { digits: number[]; m: number };

/** Uppställning: tresiffrigt tal (varje siffra i intervallet) · ensiffrig faktor. */
export function genSetup(range: [number, number], count = 12): SetupTask[] {
  return Array.from({ length: count }, () => ({
    digits: [rand(...range), rand(...range), rand(...range)],
    m: rand(...range),
  }));
}

/** Minnessiffror per position (index 0 = ental). carries[i] = minnessiffra som flyttas till position i. */
export function setupCarries(t: SetupTask): number[] {
  const rev = [...t.digits].reverse();
  const carries = [0, 0, 0, 0];
  let c = 0;
  rev.forEach((d, i) => {
    const p = d * t.m + c;
    c = Math.floor(p / 10);
    carries[i + 1] = c;
  });
  return carries;
}

export const setupValue = (t: SetupTask) => Number(t.digits.join(""));

export const chunk = <T,>(arr: T[], sizes: number[]) => {
  const out: T[][] = [];
  let i = 0;
  for (const s of sizes) {
    out.push(arr.slice(i, i + s));
    i += s;
  }
  return out;
};
