import { describe, expect, it } from "vitest";
import { generateSudokuPuzzle, isValidSudokuBoard, solveSudoku } from "./sudoku";

describe("Sudoku generator", () => {
  it("generates valid puzzles and solutions for all difficulties", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const generated = generateSudokuPuzzle(difficulty);

      expect(generated.puzzle).toHaveLength(9);
      expect(generated.solution).toHaveLength(9);
      expect(generated.puzzle.every((row) => row.length === 9)).toBe(true);
      expect(generated.solution.every((row) => row.length === 9)).toBe(true);
      expect(isValidSudokuBoard(generated.solution)).toBe(true);

      const solved = solveSudoku(generated.puzzle);
      expect(solved).not.toBeNull();
      expect(isValidSudokuBoard(solved!)).toBe(true);
      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          const value = generated.puzzle[row][col];
          if (value !== 0) {
            expect(solved![row][col]).toBe(value);
          }
        }
      }

      const visibleClues = generated.puzzle.flat().filter((value) => value !== 0).length;
      expect(visibleClues).toBeGreaterThan(0);
      expect(visibleClues).toBeLessThan(81);
    }
  });

  it("respects the selected number of visible clues", () => {
    const generated = generateSudokuPuzzle("medium", 45);
    const visibleClues = generated.puzzle.flat().filter((value) => value !== 0).length;

    expect(visibleClues).toBe(45);
    expect(isValidSudokuBoard(generated.solution)).toBe(true);
    expect(solveSudoku(generated.puzzle)).not.toBeNull();
  });
});
