export type Operation = "addition" | "subtraction" | "multiplication" | "division";
export type Mode = "blank" | Operation | "mixed-boards" | "mixed-cells";
const operations: Operation[] = ["addition", "subtraction", "multiplication", "division"];
function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}
function expression(operation: Operation): string {
  const a = 1 + Math.floor(Math.random() * 10);
  const b = 1 + Math.floor(Math.random() * 10);
  switch (operation) {
    case "addition":
      return `${a} + ${b}`;
    case "subtraction":
      return `${Math.max(a, b)} − ${Math.min(a, b)}`;
    case "multiplication":
      return `${a} × ${b}`;
    case "division":
      return `${a * b} ÷ ${b}`;
  }
}
export function makeBoards(mode: Mode): string[][] {
  const boardOperations = shuffle(operations);
  return Array.from({ length: 15 }, (_, board) => {
    if (mode === "blank") return Array<string>(25).fill("");
    const cellOperations = shuffle(
      Array.from({ length: 25 }, (_, cell) => operations[(cell + board) % 4]),
    );
    return Array.from({ length: 25 }, (_, cell) =>
      expression(
        mode === "mixed-boards"
          ? boardOperations[board % 4]!
          : mode === "mixed-cells"
            ? cellOperations[cell]!
            : mode,
      ),
    );
  });
}
