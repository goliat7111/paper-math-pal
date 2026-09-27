import { rand } from "./worksheets";

export type AddSubOp = "add" | "sub";

/** Termer som skalade heltal med gemensamt antal decimaler (`dec`). */
export type AddSubTask = { op: AddSubOp; terms: number[]; dec: number };

export type AddSubOptions = {
  op: AddSubOp;
  /** Antal siffror per term (inklusive decimaler), 1–5. */
  digits: [number, number];
  /** Antal decimaler, 0–3. */
  dec: number;
  /** Antal termer (addition 2–3, subtraktion alltid 2). */
  terms: number;
  regroup: boolean;
  count: number;
};

const digitsOf = (v: number, n: number) => String(v).padStart(n, "0").split("").map(Number);

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
export function subBorrows(a: number, b: number): { received: boolean; lent: boolean; digit: number }[] {
  const n = String(a).length;
  const out: { received: boolean; lent: boolean; digit: number }[] = [];
  let lent = false; // lånade föregående (lägre) kolumn av denna?
  for (let i = 0; i < n; i++) {
    const top = Math.floor(a / 10 ** i) % 10 - (lent ? 1 : 0);
    const bot = Math.floor(b / 10 ** i) % 10;
    const received = top < bot;
    out.push({ received, lent, digit: top + (received ? 10 : 0) });
    lent = received;
  }
  return out;
}

export function hasRegroup(t: AddSubTask): boolean {
  if (t.op === "add") return addCarries(t.terms).some((c) => c > 0);
  return subBorrows(t.terms[0]!, t.terms[1]!).some((c) => c.received);
}

export const addSubResult = (t: AddSubTask) =>
  t.op === "add" ? t.terms.reduce((a, b) => a + b, 0) : t.terms[0]! - t.terms[1]!;

function genNumber(k: number, dec: number): number {
  const len = Math.max(k, dec + 1);
  const ds = Array.from({ length: len }, (_, i) =>
    i === 0 && len > dec + 1 ? rand(1, 9) : dec > 0 && i === len - 1 ? rand(1, 9) : rand(0, 9),
  );
  if (len === dec + 1 && ds[0] === 0 && dec === 0) ds[0] = rand(1, 9);
  return Number(ds.join(""));
}

export function genAddSub(o: AddSubOptions): AddSubTask[] {
  const lo = Math.min(...o.digits), hi = Math.max(...o.digits);
  const nTerms = o.op === "sub" ? 2 : Math.min(3, Math.max(2, o.terms));
  const out: AddSubTask[] = [];
  for (let n = 0; n < o.count; n++) {
    let best: AddSubTask | null = null;
    for (let tries = 0; tries < 5000; tries++) {
      let terms = Array.from({ length: nTerms }, () => genNumber(rand(lo, hi), o.dec));
      if (o.op === "sub") {
        terms.sort((x, y) => y - x);
        if (terms[0] === terms[1]) continue;
      }
      const t: AddSubTask = { op: o.op, terms, dec: o.dec };
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
  comma: number;
};

/** Kolumnplacering: alla tal högerställda mot sista kolumnen (ental/sista decimal). */
export function addSubLayout(t: AddSubTask): AddSubLayout {
  const res = addSubResult(t);
  const w = Math.max(...t.terms.map((v) => String(v).length), String(res).length, t.dec + 1);
  const nCols = w + (t.op === "add" ? 1 : 0);
  const align = (v: number) => {
    const s = String(v).padStart(t.dec + 1, "0");
    return Array(nCols - s.length).fill("").concat(s.split(""));
  };
  const carries = Array(nCols).fill("");
  const marks = Array(nCols).fill("");
  const struck = Array(nCols).fill(false);
  if (t.op === "add") {
    addCarries(t.terms).forEach((c, i) => { if (c > 0 && i < nCols) carries[nCols - 1 - i] = String(c); });
  } else {
    subBorrows(t.terms[0]!, t.terms[1]!).forEach((c, i) => {
      const col = nCols - 1 - i;
      if (c.lent) { marks[col] = String(c.digit); struck[col] = true; }
      else if (c.received) marks[col] = "10";
    });
  }
  void digitsOf;
  return {
    nCols,
    rows: t.terms.map(align),
    result: align(res),
    carries,
    marks,
    struck,
    comma: t.dec > 0 ? nCols - 1 - t.dec : -1,
  };
}
