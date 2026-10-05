import { expect, it } from "vitest";
import {
  generateWordSearch,
  getWordSearchLetterSet,
  prepareWordList,
  type WordSearchSize,
} from "./word-search";

function seededRandom() {
  let state = 123456789;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function containsWord(grid: string[][], word: string) {
  const directions: readonly (readonly [number, number])[] = [
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  return directions.some(([dr, dc]) =>
    grid.some((row, rowIndex) =>
      row.some((_, columnIndex) =>
        [...word].every(
          (letter, index) => grid[rowIndex + index * dr]?.[columnIndex + index * dc] === letter,
        ),
      ),
    ),
  );
}

it("prepares Swedish words and rejects invalid or duplicate entries", () => {
  expect(prepareWordList(" ljud våg \nLJUS\n", 10)).toEqual({
    words: ["LJUDVÅG", "LJUS"],
    error: null,
  });
  expect(prepareWordList("ÄLGAR", 10).words).toEqual(["ÄLGAR"]);
  expect(prepareWordList("café\nüber\nsmörgås", 10).words).toEqual(["CAFÉ", "ÜBER", "SMÖRGÅS"]);
  expect(prepareWordList("e\u0301clair", 10).words).toEqual(["ÉCLAIR"]);
  expect(prepareWordList("KATT\nkatt", 10).error).toContain("flera gånger");
  expect(prepareWordList("LÅNGTORDENÄR", 10).error).toContain("längre än");
  expect(prepareWordList("LJUS!", 10).error).toContain("tecken");
  expect(prepareWordList(" \n ", 10).error).toContain("minst ett ord");
});

it("prepares English words using the English alphabet", () => {
  expect(prepareWordList("apple\nschool", 10, "en")).toEqual({
    words: ["APPLE", "SCHOOL"],
    error: null,
  });
  expect(prepareWordList("ÄLG", 10, "en").error).toContain("engelska");
  expect(getWordSearchLetterSet("en")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  expect(getWordSearchLetterSet("sv")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ");
});

it.each([10, 12, 15] as WordSearchSize[])(
  "generates a square %ix%i puzzle containing every requested word",
  (size) => {
    const words = ["ÅSKA", "LJUS", "VÅG", "EKO", "LJUD"];
    const puzzle = generateWordSearch(words, size, seededRandom());

    expect(puzzle).not.toBeNull();
    expect(puzzle!.grid).toHaveLength(size);
    expect(puzzle!.grid.every((row) => row.length === size)).toBe(true);
    for (const word of words) expect(containsWord(puzzle!.grid, word)).toBe(true);
  },
);

it("fills an English word search from A to Z", () => {
  const puzzle = generateWordSearch(["CAT"], 10, () => 0.999999, "en");

  expect(puzzle).not.toBeNull();
  expect(puzzle!.language).toBe("en");
  expect(puzzle!.grid.flat().every((letter) => /^[A-Z]$/.test(letter))).toBe(true);
});

it("can place words backwards when all directions are enabled", () => {
  const containsBackwards = (grid: string[][], word: string) => {
    const reverseDirections: readonly (readonly [number, number])[] = [
      [0, -1],
      [-1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    return reverseDirections.some(([dr, dc]) =>
      grid.some((row, rowIndex) =>
        row.some((_, columnIndex) =>
          [...word].every(
            (letter, index) => grid[rowIndex + index * dr]?.[columnIndex + index * dc] === letter,
          ),
        ),
      ),
    );
  };

  const puzzle = generateWordSearch(["WORD"], 10, seededRandom(), "en", "all");

  expect(puzzle).not.toBeNull();
  expect(containsBackwards(puzzle!.grid, "WORD")).toBe(true);
});

it("only lists words that were successfully placed", () => {
  const words = Array.from({ length: 100 }, (_, index) =>
    index.toString(26).toUpperCase().padStart(10, "A"),
  );
  const puzzle = generateWordSearch(words, 10, seededRandom());

  expect(puzzle).not.toBeNull();
  expect(puzzle!.words.length).toBeLessThan(words.length);
  expect(puzzle!.words.every((word) => containsWord(puzzle!.grid, word))).toBe(true);
});

it("returns null when a requested word cannot fit", () => {
  expect(generateWordSearch(["ABCDEFGHIJK"], 10)).toBeNull();
});
