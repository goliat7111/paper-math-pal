import { addSubResult, maxDec, type AddSubOp, type AddSubTask } from "@/lib/addsub";
import { formatDecimal } from "@/lib/worksheets";
import type { HundredTask } from "./SheetHundred";

type AddSubWithBlank = AddSubTask & {
  blankTerm?: 0 | 1 | 2;
  blankPart?: "subtrahend" | "difference";
};

const formatTaskTerm = (value: number, decimals: number, isSubtrahend = false) => {
  const formatted = formatDecimal(value, decimals);
  return isSubtrahend && value < 0 ? `(${formatted})` : formatted;
};

export function addSubHundredTask(task: AddSubWithBlank, op: AddSubOp): HundredTask {
  const blankTerm = task.blankTerm;
  const blankSubtrahend = task.blankPart === "subtrahend";
  return {
    left: formatTaskTerm(task.terms[0]!, task.decs[0]!),
    operator: op === "add" ? "+" : "−",
    right: formatTaskTerm(task.terms[1]!, task.decs[1]!, op === "sub"),
    ...(task.terms.length === 3 ? { third: formatTaskTerm(task.terms[2]!, task.decs[2]!) } : {}),
    answer:
      blankTerm !== undefined
        ? formatDecimal(task.terms[blankTerm]!, 0)
        : blankSubtrahend
          ? formatDecimal(task.terms[1]!, 0)
          : formatDecimal(addSubResult(task), maxDec(task)),
    ...(blankTerm !== undefined
      ? {
          blank: (["left", "right", "third"] as const)[blankTerm],
          result: formatDecimal(addSubResult(task), 0),
        }
      : blankSubtrahend
        ? { blank: "right" as const, result: formatDecimal(addSubResult(task), 0) }
        : {}),
  };
}
