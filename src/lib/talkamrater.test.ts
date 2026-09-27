import { describe, expect, it } from "vitest";
import { talkamratColumns } from "@/components/SheetTalkamrater";

describe("talkamratColumns", () => {
  it("upp till 10: oförändrat — ordnade par 1..s-1", () => {
    const cols = talkamratColumns("10");
    expect(cols.map(c => c.sum)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(cols.find(c => c.sum === 10)!.pairs).toContainEqual([9, 1]);
    expect(cols.find(c => c.sum === 10)!.pairs).toHaveLength(9);
  });

  it("upp till 20: summor 11–20 med alla kombinationer utom x+0", () => {
    const cols = talkamratColumns("20");
    expect(cols.map(c => c.sum)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const c18 = cols.find(c => c.sum === 18)!;
    expect(c18.pairs).toEqual([
      [17, 1], [16, 2], [15, 3], [14, 4], [13, 5], [12, 6], [11, 7], [10, 8], [9, 9],
    ]);
    const c20 = cols.find(c => c.sum === 20)!;
    expect(c20.pairs[0]).toEqual([19, 1]);
    expect(c20.pairs[c20.pairs.length - 1]).toEqual([10, 10]);
    expect(c20.pairs).toHaveLength(10);
  });

  it("upp till 20: inget par innehåller 0", () => {
    for (const c of talkamratColumns("20")) {
      for (const [a, b] of c.pairs) expect(a > 0 && b > 0).toBe(true);
    }
  });

  it("varje par summerar till kolumnens summa", () => {
    for (const c of talkamratColumns("20")) {
      for (const [a, b] of c.pairs) expect(a + b).toBe(c.sum);
    }
  });
});
