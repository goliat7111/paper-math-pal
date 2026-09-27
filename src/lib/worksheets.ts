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

export type SetupTask = { digits: number[]; m: number[] };

/** Läser en sifferlista till ett tal (t.ex. [4, 8, 3] → 483). */
export const digitValue = (ds: number[]) => ds.reduce((v, d) => v * 10 + d, 0);

export const setupValue = (t: SetupTask) => digitValue(t.digits) * digitValue(t.m);

/** Minnessiffror när talet multipliceras med ensiffriga d,
 *  i beräkningsordning (ental först); index i hör till siffra i. */
export function rowCarries(top: number[], d: number): number[] {
  const carries: number[] = [];
  let c = 0;
  for (let i = top.length - 1; i >= 0; i--) {
    c = Math.floor((top[i]! * d + c) / 10);
    carries.push(c);
  }
  return carries;
}

/** Uppställning: övre talet 1–4 siffror (upp till 9999), undre faktorn 1–3 siffror.
 *  Första siffran i båda talen är aldrig 0. */
export function genSetup(
  topDigits: [number, number] = [3, 3],
  bottomDigits: [number, number] = [1, 1],
  count = 12,
): SetupTask[] {
  const genNumber = (range: [number, number]) => {
    const k = Math.max(1, rand(...range));
    // Ensiffriga faktorer är aldrig 1 (trivial multiplikation) – minst 2
    return Array.from({ length: k }, (_, i) => (i === 0 ? rand(k === 1 ? 2 : 1, 9) : rand(0, 9)));
  };
  return Array.from({ length: count }, () => ({
    digits: genNumber(topDigits),
    m: genNumber(bottomDigits),
  }));
}

export type SetupPartial = { cells: string[]; carries: number[] };

export type SetupLayout = {
  /** Antal sifferkolumner (vänster till höger; sista kolumnen är ental). */
  nCols: number;
  /** Övre faktorn per kolumn; "" = tom cell. */
  topRow: string[];
  /** Kolumnindex för ×-tecknet (under första siffran i den övre faktorn,
   *  eller ett steg vänster om den undre faktorn när den är minst lika lång). */
  signCol: number;
  /** Den undre faktorn per kolumn, högerställd mot ental; "" = tom cell. */
  bottomRow: string[];
  /** Delprodukter (bara när den undre faktorn har fler än en siffra),
   *  mest signifikanta först; varje rad har egna minnessiffror. */
  partialRows: SetupPartial[];
  /** Produkten per kolumn, högerställd mot ental; "" = tom cell. */
  productRow: string[];
  /** Minnessiffror för produkten, endast när den undre faktorn har en siffra. */
  carries: number[];
  /** Vänsterkolumnen (0-indexerad) för additionsdelen (delprodukter + summa),
   *  dvs. den bredaste raden; plus-tecknet står en kolumn till vänster.
   *  -1 när den undre faktorn är ensiffrig (ingen additionsdel). */
  sumLeft: number;
  /** Additionens minnessiffror, placerade över rätt sifferkolumn. */
  additionCarries: string[];
};

/** Räknar ut exakt kolumnplacering för en uppställning: talen högerställda
 *  mot ental, × under första siffran i den övre faktorn, delprodukter med
 *  förskjutning, produkten under faktorerna, minnessiffror i beräkningsordning. */
export function setupLayout(t: SetupTask): SetupLayout {
  const top = t.digits;
  const bottom = t.m;
  const topLen = top.length;
  const bottomLen = bottom.length;
  const topValue = digitValue(top);
  const product = String(setupValue(t));

  let nCols = Math.max(topLen, bottomLen + 1, product.length, 4);
  let maxExtent = product.length; // additionsdelens bredaste rad
  for (let p = 0; p < bottomLen; p++) {
    const len = String(topValue * bottom[bottomLen - 1 - p]!).length;
    nCols = Math.max(nCols, len + p);
    maxExtent = Math.max(maxExtent, len + p);
  }
  // ×-tecknet behöver en egen kolumn när den undre faktorn är minst lika lång
  if (bottomLen >= topLen) nCols = Math.max(nCols, bottomLen + 2);
  // + -tecknet behöver en egen kolumn vänster om additionsdelen
  if (bottomLen > 1) nCols = Math.max(nCols, maxExtent + 1);

  const signCol = topLen > bottomLen ? nCols - topLen : nCols - bottomLen - 1;

  const align = (text: string, endCol: number) => {
    const row: string[] = Array(nCols).fill("");
    for (let i = 0; i < text.length; i++) row[endCol - text.length + 1 + i] = text[i]!;
    return row;
  };

  const partialRows: SetupPartial[] = [];
  if (bottomLen > 1) {
    for (let pos = bottomLen - 1; pos >= 0; pos--) {
      const d = bottom[bottomLen - 1 - pos]!; // pos = position från ental
      partialRows.push({
        cells: align(String(topValue * d), nCols - 1 - pos),
        carries: rowCarries(top, d).filter((c) => c > 0),
      });
    }
  }

  // Additionsdelen (delprodukter + summa): vänsterkolumnen för den bredaste raden
  const sumLeft = bottomLen > 1 ? nCols - maxExtent : -1;
  const additionCarries: string[] = Array(nCols).fill("");
  if (bottomLen > 1) {
    let carry = 0;
    for (let col = nCols - 1; col > 0; col--) {
      const sum = partialRows.reduce((total, row) => total + Number(row.cells[col] || 0), carry);
      carry = Math.floor(sum / 10);
      if (carry > 0) additionCarries[col - 1] = String(carry);
    }
  }

  return {
    nCols,
    topRow: align(top.join(""), nCols - 1),
    signCol,
    bottomRow: align(bottom.join(""), nCols - 1),
    partialRows,
    productRow: align(product, nCols - 1),
    carries: bottomLen > 1 ? [] : rowCarries(top, bottom[0]!).filter((c) => c > 0),
    sumLeft,
    additionCarries,
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

/** Hur många uppgifter som ryms i ett rutnät: kolumner efter tillgänglig bredd,
 *  rader efter tillgänglig höjd, med oförändrade mellanrum. */
export function fitGridCount(
  innerW: number,
  availH: number,
  w: number,
  h: number,
  colGap: number,
  rowGap: number,
  max = Infinity,
): { cols: number; rows: number; count: number } {
  const cols = Math.max(1, Math.floor((innerW + colGap) / (w + colGap)));
  const rows = Math.max(1, Math.floor((availH + rowGap) / (h + rowGap)));
  return { cols, rows, count: Math.min(max, cols * rows) };
}

/** Radmellanrum som fördelar resten av sidhöjden jämnt mellan raderna,
 *  men aldrig mindre än grundmellanrummet. */
export function evenRowGap(
  availH: number,
  rows: number,
  h: number,
  minGap: number,
): number {
  if (rows <= 1) return minGap;
  return Math.max(minGap, (availH - rows * h) / (rows - 1));
}

/** Snabba tal: `sheets` olika övningar (4 per A4), var och en med `perSheet`
 *  slumpade multiplikationer. Båda faktorerna dras ur samma talområde,
 *  precis som i Excel-mallen ("Slumptal mellan"). */
export function genSnabba(
  range: [number, number],
  perSheet = 10,
  sheets = 4,
): MulTask[][] {
  const lo = Math.min(...range);
  const hi = Math.max(...range);
  return Array.from({ length: sheets }, () =>
    Array.from({ length: perSheet }, () => ({ a: rand(lo, hi), b: rand(lo, hi) })),
  );
}
