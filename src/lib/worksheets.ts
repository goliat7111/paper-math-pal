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
  // Fyll upp till 102 med dubbletter så att varje faktor förekommer så jämnt som möjligt
  const countA = new Map<number, number>();
  const countB = new Map<number, number>();
  for (const t of tasks) {
    countA.set(t.a, (countA.get(t.a) ?? 0) + 1);
    countB.set(t.b, (countB.get(t.b) ?? 0) + 1);
  }
  while (tasks.length < 102) {
    // Välj bland de kombinationer vars faktorer hittills förekommit minst
    let best: MulTask[] = [];
    let bestScore = Infinity;
    for (const t of all) {
      const score = (countA.get(t.a) ?? 0) + (countB.get(t.b) ?? 0);
      if (score < bestScore) {
        bestScore = score;
        best = [t];
      } else if (score === bestScore) {
        best.push(t);
      }
    }
    const pick = best[Math.floor(Math.random() * best.length)]!;
    tasks.push(pick);
    countA.set(pick.a, (countA.get(pick.a) ?? 0) + 1);
    countB.set(pick.b, (countB.get(pick.b) ?? 0) + 1);
  }
  return tasks;
}

export type SetupTask = { digits: number[]; m: number };

/** Uppställning: tal med valbart antal siffror · ensiffrig faktor.
 *  Första siffran i det övre talet är aldrig 0. */
export function genSetup(
  factorRange: [number, number],
  count = 12,
  digitCount: [number, number] = [3, 3],
): SetupTask[] {
  const lo = Math.min(...factorRange);
  const hi = Math.max(...factorRange);
  const firstLo = Math.max(lo, 1);
  const firstHi = Math.max(hi, firstLo);
  return Array.from({ length: count }, () => {
    const k = rand(...digitCount);
    const digits = Array.from({ length: k }, (_, i) =>
      i === 0 ? rand(firstLo, firstHi) : rand(lo, hi),
    );
    return { digits, m: rand(lo, hi) };
  });
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

export type SetupLayout = {
  /** Antal sifferkolumner (vänster till höger; sista kolumnen är ental). */
  nCols: number;
  /** Övre faktorn per kolumn; "" = tom cell. */
  topRow: string[];
  /** Kolumnindex för ×-tecknet (under första siffran i den övre faktorn). */
  signCol: number;
  /** Kolumnindex för den ensiffriga faktorn (ental). */
  factorCol: number;
  /** Produkten per kolumn, högerställd mot ental; "" = tom cell. */
  productRow: string[];
  /** Minnessiffror i beräkningsordning (ental först), endast de som uppstår. */
  carries: number[];
};

/** Räknar ut exakt kolumnplacering för en uppställning: talen högerställda
 *  mot ental, × under första siffran i den övre faktorn, produkten under
 *  faktorerna, minnessiffror i beräkningsordning. */
export function setupLayout(t: SetupTask): SetupLayout {
  const product = String(setupValue(t) * t.m);
  const k = t.digits.length;
  const nCols = Math.max(k, product.length, 4);
  const topRow: string[] = Array.from({ length: nCols }, () => "");
  t.digits.forEach((d, i) => {
    topRow[nCols - k + i] = String(d);
  });
  const productRow: string[] = Array.from({ length: nCols }, () => "");
  product.split("").forEach((d, i) => {
    productRow[nCols - product.length + i] = d;
  });
  return {
    nCols,
    topRow,
    signCol: nCols - k,
    factorCol: nCols - 1,
    productRow,
    carries: setupCarries(t).slice(1).filter((c) => c > 0),
  };
}

export const chunk = <T,>(arr: T[], sizes: number[]) => {
  const out: T[][] = [];
  let i = 0;
  for (const s of sizes) {
    out.push(arr.slice(i, i + s));
    i += s;
  }
  return out;
};
