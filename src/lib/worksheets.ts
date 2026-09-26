export const rand = (min: number, max: number) => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};

export type MulTask = { a: number; b: number };

/** 102 tal: 3 kolumner × 34 rader, grupperade i block om 5.
 *  Försöker täcka alla unika faktorkombinationer inom intervallen;
 *  återstående platser fylls med slumpade dubbletter. */
export function gen102(f1: [number, number], f2: [number, number]): MulTask[] {
  const lo1 = Math.min(...f1), hi1 = Math.max(...f1);
  const lo2 = Math.min(...f2), hi2 = Math.max(...f2);
  const all: MulTask[] = [];
  for (let a = lo1; a <= hi1; a++)
    for (let b = lo2; b <= hi2; b++) all.push({ a, b });
  // Blanda alla unika kombinationer
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  const tasks = all.slice(0, 102);
  // Fyll upp till 102 med slumpade dubbletter om kombinationerna inte räcker
  while (tasks.length < 102) tasks.push({ a: rand(...f1), b: rand(...f2) });
  return tasks;
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
