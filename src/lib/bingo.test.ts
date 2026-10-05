import { expect, it } from "vitest";
import {
  makeBingo,
  makeNumberBingo,
  normalizeBingoWord,
  randomBingoWord,
  type BingoMode,
} from "./bingo";
it("generates unique boards with complete, correct, nonduplicated calls", () => {
  for (const mode of [
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "mixed",
  ] as BingoMode[]) {
    for (const free of [false, true]) {
      const game = makeBingo(mode, 40, free);
      expect(game.boards).toHaveLength(40);
      expect(new Set(game.boards.map((b) => b.join(","))).size).toBe(40);
      const answers = new Set(game.calls.map((c) => c.answer));
      expect(answers.size).toBe(game.calls.length);
      for (const board of game.boards) {
        expect(board).toHaveLength(25);
        const values = board.filter((v) => v !== null);
        expect(new Set(values).size).toBe(free ? 24 : 25);
        expect(values.every((v) => answers.has(v!))).toBe(true);
        if (free) expect(board[12]).toBeNull();
      }
      for (const call of game.calls) {
        const [a, op, b] = call.question.split(" ") as [string, string, string];
        const actual = op === "+" ? +a + +b : op === "−" ? +a - +b : op === "×" ? +a * +b : +a / +b;
        expect(actual).toBe(call.answer);
        expect(Number.isInteger(actual) && actual >= 0).toBe(true);
      }
      if (mode === "mixed")
        expect(new Set(game.calls.map((c) => c.question.split(" ")[1]!)).size).toBe(4);
    }
  }
});

it("generates number bingo boards with BINGO column ranges and free centers", () => {
  const game = makeNumberBingo(25, 20, true);
  expect(game.boards).toHaveLength(20);
  expect(new Set(game.boards.map((board) => board.join(","))).size).toBe(20);
  expect(game.calls.map((call) => call.answer).sort((a, b) => a - b)).toEqual(
    Array.from({ length: 25 }, (_, i) => i + 1),
  );

  for (const board of game.boards) {
    expect(board).toHaveLength(25);
    expect(board[12]).toBeNull();
    expect(new Set(board.filter((value) => value !== null)).size).toBe(24);
    for (let column = 0; column < 5; column++) {
      const first = column * 5 + 1;
      const last = (column + 1) * 5;
      const values = [0, 1, 2, 3, 4]
        .map((row) => board[row * 5 + column])
        .filter((value): value is number => value !== null);
      expect(values.every((value) => value >= first && value <= last)).toBe(true);
    }
  }
});

it("generates three connected 5x5 panels covering 1–75 exactly once", () => {
  const game = makeNumberBingo(75, 20, false);
  const expectedNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

  expect(game.boards).toHaveLength(20);
  expect(new Set(game.boards.map((board) => board.join(","))).size).toBe(20);
  for (const board of game.boards) {
    expect(board).toHaveLength(75);
    expect([...board].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(expectedNumbers);
    for (let panel = 0; panel < 3; panel++) {
      expect(board.slice(panel * 25, (panel + 1) * 25)).toHaveLength(25);
      for (let column = 0; column < 5; column++) {
        const first = column * 15 + 1;
        const last = (column + 1) * 15;
        const values = [0, 1, 2, 3, 4].map((row) => board[panel * 25 + row * 5 + column]!);
        expect(values.every((value) => value >= first && value <= last)).toBe(true);
      }
    }
  }
  expect(game.calls.map((call) => call.answer).sort((a, b) => a - b)).toEqual(expectedNumbers);
});

it("places a free center in each 1–75 panel when requested", () => {
  const game = makeNumberBingo(75, 10, true);
  for (const board of game.boards) {
    expect(board).toHaveLength(75);
    expect([12, 37, 62].map((index) => board[index])).toEqual([null, null, null]);
    expect(board.filter((value) => value !== null)).toHaveLength(72);
    expect(new Set(board.filter((value) => value !== null)).size).toBe(72);
  }
});

it("generates number bingo boards without a free center when requested", () => {
  const game = makeNumberBingo(25, 10, false);

  for (const board of game.boards) {
    expect(board).toHaveLength(25);
    expect(board.every((value) => value !== null)).toBe(true);
    expect(new Set(board).size).toBe(25);
    expect(board[12]).not.toBeNull();
  }
});

it("accepts five unique Swedish letters and normalizes the word", () => {
  expect(normalizeBingoWord(" skola ")).toBe("SKOLA");
  expect(normalizeBingoWord("Älgar")).toBe("ÄLGAR");
  expect(normalizeBingoWord("Klock")).toBeNull();
  expect(normalizeBingoWord("SKOLAA")).toBeNull();
  expect(normalizeBingoWord("S K O L A")).toBeNull();
});

it("generates a Swedish five-letter word with unique letters", () => {
  const word = randomBingoWord();

  expect(normalizeBingoWord(word)).toBe(word);
  expect(randomBingoWord(word)).not.toBe(word);
});
