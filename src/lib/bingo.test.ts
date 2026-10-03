import { expect, it } from "vitest";
import { makeBingo, type BingoMode } from "./bingo";
it("generates unique boards with complete, correct, nonduplicated calls", () => {
  for (const mode of ["addition", "subtraction", "multiplication", "division", "mixed"] as BingoMode[]) {
    for (const free of [false, true]) {
      const game = makeBingo(mode, 40, free);
      expect(game.boards).toHaveLength(40);
      expect(new Set(game.boards.map(b => b.join(","))).size).toBe(40);
      const answers = new Set(game.calls.map(c => c.answer));
      expect(answers.size).toBe(game.calls.length);
      for (const board of game.boards) {
        expect(board).toHaveLength(25);
        const values = board.filter(v => v !== null);
        expect(new Set(values).size).toBe(free ? 24 : 25);
        expect(values.every(v => answers.has(v!))).toBe(true);
        if (free) expect(board[12]).toBeNull();
      }
      for (const call of game.calls) {
        const [a, op, b] = call.question.split(" ") as [string, string, string];
        const actual = op === "+" ? +a + +b : op === "−" ? +a - +b : op === "×" ? +a * +b : +a / +b;
        expect(actual).toBe(call.answer);
        expect(Number.isInteger(actual) && actual >= 0).toBe(true);
      }
      if (mode === "mixed") expect(new Set(game.calls.map(c => c.question.split(" ")[1]!)).size).toBe(4);
    }
  }
});