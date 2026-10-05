import { expect, it } from "vitest";
import { makeBoards, type Mode } from "./five-in-row";
const symbol = (cell: string) => cell.split(" ")[1];
it("creates complete boards with the selected operations and valid whole-number answers", () => {
  const modes: Mode[] = [
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "mixed-boards",
    "mixed-cells",
  ];
  for (const mode of modes) {
    const boards = makeBoards(mode);
    expect(boards).toHaveLength(15);
    for (const board of boards) {
      expect(board).toHaveLength(25);
      for (const cell of board) {
        const [left, op, right] = cell.split(" ") as [string, string, string];
        const a = Number(left),
          b = Number(right);
        expect(b).toBeGreaterThan(0);
        if (op === "−") expect(a - b).toBeGreaterThanOrEqual(0);
        if (op === "÷") {
          expect(a % b).toBe(0);
          expect(a / b).toBeLessThanOrEqual(10);
        }
      }
      if (mode === "mixed-cells") {
        for (const op of ["+", "−", "×", "÷"])
          expect(board.filter((cell) => symbol(cell) === op).length).toBeGreaterThanOrEqual(6);
      } else {
        expect(new Set(board.map(symbol)).size).toBe(1);
      }
    }
    if (mode === "mixed-boards")
      expect(new Set(boards.slice(0, 4).map((board) => symbol(board[0]!))).size).toBe(4);
    const expected: string | undefined = (
      { addition: "+", subtraction: "−", multiplication: "×", division: "÷" } as Record<
        string,
        string | undefined
      >
    )[mode];
    if (expected) expect(boards.flat().every((cell) => symbol(cell) === expected)).toBe(true);
  }
});
it("keeps blank boards empty", () =>
  expect(
    makeBoards("blank")
      .flat()
      .every((cell) => cell === ""),
  ).toBe(true));
