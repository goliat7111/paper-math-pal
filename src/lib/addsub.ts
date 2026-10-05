import { rand } from "./worksheets";

export type AddSubOp = "add" | "sub";

/**
 * Termer som skalade heltal. Varje term har sitt eget antal decimaler (`decs[i]`);
 * termernas heltalsvärden tolkas med `decs[i]` decimaler.
 */
export type AddSubTask = { op: AddSubOp; terms: number[]; decs: number[] };

export type AddSubOptions = {
  op: AddSubOp;
  /** Antal siffror per term (inklusive decimaler), 1–5. */
  digits: [number, number];
  /** Antal decimaler, 0–3, "slumpa" (0–3 per term utifrån sifferantalet) eller "slumpa-decimaler" (1–3 per term). */
  dec: number | "slumpa" | "slumpa-decimaler";
  /** Antal termer (addition 2–3, subtraktion alltid 2). */
  terms: number;
  regroup: boolean;
  count: number;
};

/** Största antalet decimaler bland termerna. */
export const maxDec = (t: AddSubTask) => Math.max(...t.decs);

/** Termerna skalade till heltal med gemensamt decimalantal (maxDec). */
export const scaledTerms = (t: AddSubTask) => {
  const m = maxDec(t);
  return t.terms.map((v, i) => v * 10 ** (m - t.decs[i]!));
};

/** Minnessiffror (addition) per kolumn räknat från ental: index i = kolumn i får minnessiffran. */
export function addCarries(terms: number[]): number[] {
  const n = String(Math.max(...terms)).length + 1;
  const out: number[] = [];
  let c = 0;
  for (let i = 0; i < n; i++) {
    out.push(c);
    const s = terms.reduce((t, v) => t + (Math.floor(v / 10 ** i) % 10), c);
    c = Math.floor(s / 10);
  }
  return out;
}

/** Växling i subtraktion per kolumn från ental: fick kolumnen en tia, lånade den ut? */
export function subBorrows(
  a: number,
  b: number,
): { received: boolean; lent: boolean; digit: number }[] {
  const n = String(a).length;
  const out: { received: boolean; lent: boolean; digit: number }[] = [];
  let lent: boolean = false; // lånade föregående (lägre) kolumn av denna?
  for (let i = 0; i < n; i++) {
    const top: number = (Math.floor(a / 10 ** i) % 10) - (lent ? 1 : 0);
    const bot = Math.floor(b / 10 ** i) % 10;
    const received: boolean = top < bot;
    out.push({ received, lent, digit: top + (received ? 10 : 0) });
    lent = received;
  }
  return out;
}

export function hasRegroup(t: AddSubTask): boolean {
  const s = scaledTerms(t);
  if (t.op === "add") return addCarries(s).some((c) => c > 0);
  return subBorrows(s[0]!, s[1]!).some((c) => c.received);
}

export const addSubResult = (t: AddSubTask) => {
  const s = scaledTerms(t);
  return t.op === "add" ? s.reduce((a, b) => a + b, 0) : s[0]! - s[1]!;
};

function genNumber(k: number, dec: number): number {
  const len = Math.max(k, dec + 1);
  const ds = Array.from({ length: len }, (_, i) =>
    i === 0 && len > dec + 1 ? rand(1, 9) : dec > 0 && i === len - 1 ? rand(1, 9) : rand(0, 9),
  );
  if (len === dec + 1 && ds[0] === 0 && dec === 0) ds[0] = rand(1, 9);
  return Number(ds.join(""));
}

/** Konstruerar skalade tal kolumnvis så att ingen växling uppstår. `lens` = sifferantal per term, `decs` = decimaler per term. */
function genNoRegroup(op: AddSubOp, lens: number[], decs: number[]): number[] {
  const m = Math.max(...decs);
  const scaled = lens.map((len, k) => len + (m - decs[k]!));
  const w = Math.max(...scaled);
  const ds = lens.map(() => [] as number[]);
  for (let col = 0; col < w; col++) {
    const minOf = (k: number) => {
      const len = scaled[k]!;
      if (col >= len) return -1; // saknar siffra här
      if (col === m - decs[k]! && decs[k]! > 0) return 1; // sista decimalen aldrig 0
      if (col === len - 1 && lens[k]! > decs[k]! + 1) return 1; // första siffran aldrig 0
      return 0;
    };
    if (op === "add") {
      let left = 9;
      const mins = lens.map((_, k) => Math.max(0, minOf(k)));
      lens.forEach((_, k) => {
        if (minOf(k) < 0) return;
        const rest = mins.slice(k + 1).reduce((a, b) => a + b, 0);
        const d = rand(mins[k]!, Math.max(mins[k]!, left - rest));
        ds[k]!.push(d);
        left -= d;
      });
    } else {
      const bMin = minOf(1);
      const b = bMin < 0 ? 0 : rand(bMin, Math.max(bMin, 8));
      const a = rand(Math.max(b, minOf(0)), 9);
      ds[0]!.push(a);
      if (bMin >= 0) ds[1]!.push(b);
    }
  }
  return ds.map((d) => Number(d.reverse().join("")));
}

export function genAddSub(o: AddSubOptions): AddSubTask[] {
  const lo = Math.min(...o.digits);
  // Sifferantalet räknas inklusive decimaler, så hela intervallet gäller även vid "slumpa".
  const hi = Math.max(...o.digits);
  const nTerms = o.op === "sub" ? 2 : Math.min(3, Math.max(2, o.terms));
  const out: AddSubTask[] = [];
  for (let n = 0; n < o.count; n++) {
    let best: AddSubTask | null = null;
    for (let tries = 0; tries < 5000; tries++) {
      const lens = Array.from({ length: nTerms }, () => rand(lo, hi));
      // Varje term får sitt eget decimalantal, aldrig fler än sifferantalet tillåter.
      const decs = lens.map((k) =>
        o.dec === "slumpa"
          ? rand(0, Math.min(3, k - 1))
          : o.dec === "slumpa-decimaler"
            ? rand(1, Math.min(3, k - 1))
            : Math.min(o.dec, k - 1),
      );
      const m = Math.max(...decs);
      // Termerna lagras alltid med sitt eget sifferantal (aldrig uppskalade).
      let terms = o.regroup
        ? lens.map((k, i) => genNumber(k, decs[i]!))
        : genNoRegroup(o.op, lens, decs).map((v, i) => v / 10 ** (m - decs[i]!));
      if (o.op === "sub") {
        // Sortera fallande på verkligt värde (skalat), så största talet kommer överst.
        const order = terms
          .map((v, i) => [v * 10 ** (m - decs[i]!), i] as const)
          .sort((a, b) => b[0] - a[0]);
        terms = order.map(([, i]) => terms[i]!);
        const sortedDecs = order.map(([, i]) => decs[i]!);
        decs.length = 0;
        decs.push(...sortedDecs);
        // Lika verkliga värden ger differensen 0 — försök igen (differensen ska vara positiv).
        if (terms[0]! * 10 ** (m - decs[0]!) === terms[1]! * 10 ** (m - decs[1]!)) continue;
      }
      const t: AddSubTask = { op: o.op, terms, decs };
      best = t;
      if (hasRegroup(t) === o.regroup) break;
      terms = [];
    }
    out.push(best!);
  }
  return out;
}

export type AddSubLayout = {
  nCols: number;
  rows: string[][];
  result: string[];
  /** Addition: minnessiffra per kolumn ("" = ingen). */
  carries: string[];
  /** Subtraktion: liten markering ovanför övre talet, samt om siffran stryks. */
  marks: string[];
  struck: boolean[];
  /** Växlade 10:or som lånats vidare till nästa kolumn. */
  marksStruck: boolean[];
  /** Komma-kolumn per termrad (-1 = ingen). */
  commas: number[];
  /** Komma-kolumn i resultatraden (-1 = ingen). */
  resultComma: number;
};

/** Kolumnplacering: alla tal högerställda mot sista kolumnen (ental/sista decimal). */
export function addSubLayout(t: AddSubTask): AddSubLayout {
  const m = maxDec(t);
  const s = scaledTerms(t);
  const res = addSubResult(t);
  const w = Math.max(...s.map((v) => String(v).length), String(res).length, m + 1);
  const nCols = w;
  const align = (v: number) => {
    const str = String(v).padStart(m + 1, "0");
    return Array(nCols - str.length)
      .fill("")
      .concat(str.split(""));
  };
  // Alla termer fylls på med decimalnollor upp till maxDec, så att heltal och
  // decimaltal får lika många siffror och kommatecknen ligger under varandra.
  const carries = Array(nCols).fill("");
  const marks = Array(nCols).fill("");
  const struck = Array(nCols).fill(false);
  const marksStruck = Array(nCols).fill(false);
  if (t.op === "add") {
    addCarries(s).forEach((c, i) => {
      if (c > 0 && i < nCols) carries[nCols - 1 - i] = String(c);
    });
  } else {
    subBorrows(s[0]!, s[1]!).forEach((c, i) => {
      const col = nCols - 1 - i;
      // Endast snedstreck på kolumner som växlar bort, och en liten 10:a i
      // varje mottagande kolumn — ingen siffra för vad som blir kvar.
      if (c.lent) struck[col] = true;
      if (c.received) {
        marks[col] = "10";
        marksStruck[col] = c.lent;
      }
    });
  }
  return {
    nCols,
    rows: s.map(align),
    result: align(res),
    carries,
    marks,
    struck,
    marksStruck,
    commas: t.decs.map(() => (m > 0 ? nCols - 1 - m : -1)),
    resultComma: m > 0 ? nCols - 1 - m : -1,
  };
}
