import { genAddSub, hasRegroup, type AddSubTask } from "./addsub";
import { genDivision, type DivisionTask } from "./division";
import { digitValue, rand, rowCarries, type SetupTask } from "./worksheets";

export type MixedTasks = { add: AddSubTask; sub: AddSubTask; mul: SetupTask; div: DivisionTask };
export type MixedLevel = 1 | 2 | 3 | 4 | 5;

function multiply(level: MixedLevel): SetupTask {
  for (let attempt = 0; attempt < 10000; attempt++) {
    const topLength = level <= 2 ? 2 : level === 3 ? rand(2, 3) : rand(3, 4);
    const bottomLength = level <= 2 ? 1 : level === 3 ? 2 : rand(1, 2);
    const digits = Array.from({ length: topLength }, (_, i) => rand(i === 0 ? 1 : 0, 9));
    const m = Array.from({ length: bottomLength }, (_, i) => rand(i === 0 ? 2 : 0, 9));
    if (level === 1 && (rowCarries(digits, m[0]!).some(c => c > 0) || digitValue(digits) * m[0]! >= 100)) continue;
    return {
      digits, m,
      ...(level >= 4 ? { dt: level === 5 ? rand(1, 2) : 1 } : {}),
      ...(level === 5 ? { db: 1 } : {}),
    };
  }
  throw new Error("Kunde inte skapa en multiplikationsuppgift.");
}

export function genMixed(level: MixedLevel): MixedTasks {
  const digits: [number, number] = level === 1 ? [2, 2] : level === 2 ? [2, 3] : level === 3 ? [3, 4] : [3, 5];
  const dec = level <= 3 ? 0 : level === 4 ? 1 : "slumpa";
  const make = (op: "add" | "sub") => genAddSub({ op, digits, dec, terms: level === 5 && op === "add" ? 3 : 2, regroup: level > 1, count: 1 })[0]!;
  const add = make("add");
  const sub = make("sub");
  const mul = multiply(level);
  const div = level === 1 ? genDivision(12, 81, 2, 9, 1)[0]!
    : level === 2 ? genDivision(30, 199, 2, 9, 1)[0]!
    : level === 3 ? genDivision(100, 999, 2, 9, 1)[0]!
    : level === 4 ? genDivision(10, 99, 2, 9, 1, false, 1, 0)[0]!
    : genDivision(10, 99, 2, 8, 1, false, 1, 1)[0]!;
  return { add, sub, mul, div };
}