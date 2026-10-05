export type PyramidMode = "bottom" | "top";

export type NumberPyramid = {
  rows: number[][];
  given: boolean[][];
};

export const DEFAULT_TOP_TOTAL: Record<3 | 4 | 5, number> = { 3: 20, 4: 30, 5: 20 };
export const TOP_TOTAL_OPTIONS: Record<3 | 4 | 5, number[]> = {
  3: [20, 30],
  4: [20, 30, 60],
  5: [20, 30, 60],
};

export function genNumberPyramids(
  rowCount: 3 | 4 | 5,
  mode: PyramidMode,
  count: number,
  topTotal = DEFAULT_TOP_TOTAL[rowCount],
): NumberPyramid[] {
  return Array.from({ length: count }, () => {
    const bottom =
      mode === "top"
        ? createBottomForTotal(rowCount, topTotal)
        : Array.from({ length: rowCount }, () => Math.floor(Math.random() * 10));
    const rows = [bottom];
    while (rows.length < rowCount) {
      const below = rows[0]!;
      rows.unshift(below.slice(0, -1).map((value, index) => value + below[index + 1]!));
    }
    const given = rows.map((row) => row.map(() => false));
    if (mode === "bottom") {
      given[rowCount - 1] = bottom.map(() => true);
    } else {
      given[0]![0] = true;
      given[rowCount - 1] = bottom.map((_, index) => index < bottom.length - 1);
    }
    return { rows, given };
  });
}

function createBottomForTotal(rowCount: 3 | 4 | 5, total: number): number[] {
  const weights = rowCount === 3 ? [1, 2, 1] : rowCount === 4 ? [1, 3, 3, 1] : [1, 4, 6, 4, 1];
  for (let attempt = 0; attempt < 10000; attempt++) {
    const bottom = weights.slice(0, -1).map(() => Math.floor(Math.random() * 10));
    const remaining =
      total - bottom.reduce((sum, value, index) => sum + value * weights[index]!, 0);
    if (remaining >= 0 && remaining <= 9) return [...bottom, remaining];
  }
  throw new Error(`Kunde inte skapa en ${rowCount}-radig talpyramid med topptalet ${total}.`);
}
