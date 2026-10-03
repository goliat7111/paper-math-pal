import { expect, it } from "vitest";
import { generateWordSearch, prepareWordList, type WordSearchSize } from "./word-search";

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

it("returns null when a requested word cannot fit", () => {
  expect(generateWordSearch(["ABCDEFGHIJK"], 10)).toBeNull();
});
