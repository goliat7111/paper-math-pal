export type TalkamratRange = "10" | "20" | "both" | "custom";
export type Strategy = "dubbel" | "tio" | "ett" | "nastan" | "tva" | "tre";

export const TALKAMRAT_RANGE_OPTIONS: { id: TalkamratRange; label: string }[] = [
  { id: "10", label: "Upp till 10" },
  { id: "20", label: "Upp till 20" },
  { id: "both", label: "Båda" },
  { id: "custom", label: "Välj tal" },
];

export function talkamratRangeLabel(range: TalkamratRange): string {
  if (range === "custom") return "Välj tal";
  if (range === "both") return "Upp till 10 och 20";
  return `Upp till ${range}`;
}

export const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: "ett", label: "Öka med ett" },
  { id: "tva", label: "Öka med två" },
  { id: "tre", label: "Öka med tre" },
  { id: "dubbel", label: "Dubblor" },
  { id: "nastan", label: "Nästan dubblor" },
  { id: "tio", label: "Tiokamrater" },
];

/** Strategi för en talkamrat — en färg per ruta, i prioritetsordning. */
export function strategyFor(a: number, b: number): Strategy | null {
  if (a === b) return "dubbel";
  if (a + b === 10) return "tio";
  const m = Math.min(a, b);
  if (m === 1) return "ett";
  if (Math.abs(a - b) === 1) return "nastan";
  if (m === 2) return "tva";
  if (m === 3) return "tre";
  return null;
}

type Pair = [number, number];

/** Kolumner (summa → talkamrater), som i Excel-mallen. */
export function talkamratColumns(range: "10" | "20"): { sum: number; pairs: Pair[] }[] {
  if (range === "10") {
    return Array.from({ length: 9 }, (_, i) => {
      const s = i + 2;
      return { sum: s, pairs: Array.from({ length: s - 1 }, (_, k) => [s - k - 1, k + 1] as Pair) };
    });
  }
  // Summor 11–20 med alla kombinationer a+b=s (a från s−1 ner till hälften, utan x+0).
  return Array.from({ length: 10 }, (_, i) => {
    const s = i + 11;
    const pairs: Pair[] = [];
    for (let a = s - 1; a >= Math.ceil(s / 2); a--) pairs.push([a, s - a] as Pair);
    return { sum: s, pairs };
  });
}

/** Talkamrater för valda summor (2–20) — alla heltalskombinationer; över 8 par delas upp i två kolumner. */
export function customColumns(sums: number[]): { sum: number; pairs: Pair[] }[] {
  return [...sums]
    .sort((a, b) => a - b)
    .flatMap((s) => {
      const pairs: Pair[] = [];
      for (let a = s; a >= Math.ceil(s / 2); a--) pairs.push([a, s - a]);
      const half = Math.ceil(pairs.length / 2);
      return pairs.length > 8
        ? [
            { sum: s, pairs: pairs.slice(0, half) },
            { sum: s, pairs: pairs.slice(half) },
          ]
        : [{ sum: s, pairs }];
    });
}
