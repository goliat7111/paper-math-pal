import { genAddSub, maxDec, type AddSubTask } from "./addsub";
import { genMixedDivision, randomizeDecimals, type MixedDivision } from "./mixed-division";
import { digitValue, rand, rowCarries, type SetupTask } from "./worksheets";

export type MixedTasks = { add: AddSubTask; sub: AddSubTask; mul: SetupTask; div: MixedDivision };
export type MixedLevel = 1 | 2 | 3 | 4 | 5;

function multiply(level: MixedLevel): SetupTask {
  for (let attempt = 0; attempt < 10000; attempt++) {
    const topLength = level <= 2 ? 2 : level === 3 ? rand(2, 3) : rand(3, 4);
    const bottomLength = level <= 2 ? 1 : level === 3 ? 2 : rand(1, 2);
    const digits = Array.from({ length: topLength }, (_, i) => rand(i === 0 ? 1 : 0, 9));
    const m = Array.from({ length: bottomLength }, (_, i) => rand(i === 0 ? 2 : 0, 9));
    if (
      level === 1 &&
      (rowCarries(digits, m[0]!).some((c) => c > 0) || digitValue(digits) * m[0]! >= 100)
    )
      continue;
    return {
      digits,
      m,
      ...(level >= 4 ? { dt: level === 5 ? rand(1, 2) : 1 } : {}),
      ...(level === 5 ? { db: 1 } : {}),
    };
  }
  throw new Error("Kunde inte skapa en multiplikationsuppgift.");
}

export function genMixed(level: MixedLevel, randomDecimals = false): MixedTasks {
  if (randomDecimals) return genMixedRandomDecimals(level);
  const digits: [number, number] =
    level === 1 ? [2, 2] : level === 2 ? [2, 3] : level === 3 ? [3, 4] : [3, 5];
  const dec = level <= 3 ? 0 : level === 4 ? 1 : "slumpa";
  const make = (op: "add" | "sub") => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const task = genAddSub({
        op,
        digits,
        dec,
        terms: level === 5 && op === "add" ? 3 : 2,
        regroup: level > 1,
        count: 1,
      })[0]!;
      if (level !== 5 || maxDec(task) > 0) return task;
    }
    throw new Error("Kunde inte skapa en uppgift med decimaler.");
  };
  const add = make("add");
  const sub = make("sub");
  const mul = multiply(level);
  const div = genMixedDivision(level);
  return { add, sub, mul, div };
}
/** Blandat antal decimaler: varje räknesätt får sitt eget slumpade antal (0–3 för
 *  addition/subtraktion, 0–2 per faktor, 0–2 i divisionens täljare), och minst två
 *  av de fyra uppgifterna får olika antal decimaler. */
function genMixedRandomDecimals(level: MixedLevel): MixedTasks {
  const digits: [number, number] =
    level === 1 ? [2, 3] : level === 2 ? [2, 3] : level === 3 ? [3, 4] : [3, 5];
  for (let attempt = 0; attempt < 200; attempt++) {
    const make = (op: "add" | "sub") =>
      genAddSub({
        op,
        digits,
        dec: "slumpa",
        terms: level === 5 && op === "add" ? 3 : 2,
        regroup: level > 1,
        count: 1,
      })[0]!;
    const add = make("add"),
      sub = make("sub");
    const base = multiply(level);
    const dt = rand(0, Math.min(2, base.digits.length - 1)),
      db = base.m.length > 1 ? rand(0, 1) : 0;
    const mul: SetupTask = {
      digits: base.digits,
      m: base.m,
      ...(dt ? { dt } : {}),
      ...(db ? { db } : {}),
    };
    const div = randomizeDecimals(genMixedDivision(level));
    const counts = [
      maxDec(add),
      maxDec(sub),
      dt + db,
      div.shown ? div.shown.dividendDecimals : (div.dividendDecimals ?? 0),
    ];
    if (new Set(counts).size > 1 && counts.some((c) => c > 0)) return { add, sub, mul, div };
  }
  throw new Error("Kunde inte skapa uppgifter med blandade decimaler.");
}
