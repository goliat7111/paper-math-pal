import { describe, expect, it } from "vitest";
import { DEFAULT_TOP_TOTAL, genNumberPyramids, TOP_TOTAL_OPTIONS } from "./number-pyramids";

describe("number pyramids", () => {
  it.each([3, 4, 5] as const)("creates a valid %i-row bottom-number pyramid", (rowCount) => {
    const [pyramid] = genNumberPyramids(rowCount, "bottom", 1);
    expect(pyramid!.rows).toHaveLength(rowCount);
    expect(pyramid!.rows.at(-1)).toHaveLength(rowCount);
    expect(pyramid!.given.at(-1)).toEqual(Array(rowCount).fill(true));
    for (let row = 0; row < rowCount - 1; row++) {
      expect(
        pyramid!.rows[row]!.every(
          (value, index) =>
            value === pyramid!.rows[row + 1]![index]! + pyramid!.rows[row + 1]![index + 1]!,
        ),
      ).toBe(true);
    }
  });

  it.each([3, 4, 5] as const)("creates a solvable %i-row top-number pyramid", (rowCount) => {
    const [pyramid] = genNumberPyramids(rowCount, "top", 1);
    expect(pyramid!.given[0]).toEqual([true]);
    expect(pyramid!.given.at(-1)).toEqual([...Array(rowCount - 1).fill(true), false]);
    expect(pyramid!.rows.at(-1)!.every((value) => value >= 0 && value <= 9)).toBe(true);
    for (let row = 0; row < rowCount - 1; row++) {
      expect(
        pyramid!.rows[row]!.every(
          (value, index) =>
            value === pyramid!.rows[row + 1]![index]! + pyramid!.rows[row + 1]![index + 1]!,
        ),
      ).toBe(true);
    }
  });

  it.each([3, 4, 5] as const)("matches workbook top totals for %i rows", (rowCount) => {
    for (const total of TOP_TOTAL_OPTIONS[rowCount]) {
      const [pyramid] = genNumberPyramids(rowCount, "top", 1, total);
      expect(pyramid!.rows[0]![0]).toBe(total);
    }
    expect(TOP_TOTAL_OPTIONS[rowCount]).toContain(DEFAULT_TOP_TOTAL[rowCount]);
  });
});
