export type BingoMode = "addition" | "subtraction" | "multiplication" | "division" | "mixed";
export type NumberBingoRange = 25 | 75;
export type Call = { question: string; answer: number };
export type BingoGame = { boards: (number | null)[][]; calls: Call[] };
const randomWords = [
  "SKOLA", "VÄDER", "TIGER", "PILOT", "BÄLTE", "DATOR", "FRUKT", "TUNGA",
  "HÄXOR", "PAJER", "KÄRNA", "JULEN", "BILAR", "RÖSTA", "BUNKE", "FJÄRD",
  "MELON", "ÄLGAR", "LEKAR", "ORMAR", "MUSIK", "BÄVER", "KANOT", "VAKEN",
];
export const bingoModes: Record<BingoMode, string> = {
  addition: "Addition", subtraction: "Subtraktion", multiplication: "Multiplikation",
  division: "Division", mixed: "Blandade räknesätt",
};
export function normalizeBingoWord(word: string): string | null {
  const normalized = word.trim().toLocaleUpperCase("sv-SE");
  const letters = Array.from(normalized);
  if (!/^[A-ZÅÄÖ]{5}$/.test(normalized) || new Set(letters).size !== 5) return null;
  return normalized;
}
export function randomBingoWord(exclude?: string): string {
  const candidates = randomWords.filter(word => word !== exclude);
  if (candidates.length === 0) throw new Error("Det finns inga ord att slumpa fram.");
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}
export function makeBingo(mode: BingoMode, count: number, free: boolean): BingoGame {
  if (!Number.isInteger(count) || count < 1 || count > 40) throw new Error("Välj 1–40 brickor.");
  const pools: Record<Exclude<BingoMode, "mixed">, Call[]> = {
    addition: [], subtraction: [], multiplication: [], division: [],
  };
  for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
    pools.addition.push({ question: `${a} + ${b}`, answer: a + b });
  }
  for (let a = 1; a <= 30; a++) for (let b = 1; b <= a; b++) {
    pools.subtraction.push({ question: `${a} − ${b}`, answer: a - b });
  }
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
    pools.multiplication.push({ question: `${a} × ${b}`, answer: a * b });
  }
  for (let answer = 1; answer <= 30; answer++) for (let b = 2; b <= 10; b++) {
    pools.division.push({ question: `${answer * b} ÷ ${b}`, answer });
  }
  // Mixed calls rotate through all four operations before selecting another answer.
  const candidates = mode === "mixed"
    ? (() => { const groups = Object.values(pools).map(shuffle); return Array.from({ length: Math.max(...groups.map(g => g.length)) }, (_, i) => groups.flatMap(g => g[i] ? [g[i]] : [])).flat(); })()
    : shuffle(pools[mode]);
  const byAnswer = new Map<number, Call>();
  for (const call of candidates) if (!byAnswer.has(call.answer)) byAnswer.set(call.answer, call);
  const answers = [...byAnswer.keys()];
  const boards: (number | null)[][] = [];
  const seen = new Set<string>();
  while (boards.length < count) {
    const values: (number | null)[] = shuffle(answers).slice(0, free ? 24 : 25);
    if (free) values.splice(12, 0, null);
    const key = values.join(",");
    if (!seen.has(key)) { seen.add(key); boards.push(values); }
  }
  // Keep the full answer pool so the mixed mode always includes all operations.
  return { boards, calls: shuffle([...byAnswer.values()]) };
}

export function makeNumberBingo(range: NumberBingoRange, count: number, free: boolean): BingoGame {
  if (!Number.isInteger(count) || count < 1 || count > 40) throw new Error("Välj 1–40 brickor.");

  const boards: (number | null)[][] = [];
  const seen = new Set<string>();
  while (boards.length < count) {
    const board: (number | null)[] = Array(range).fill(null);
    for (let column = 0; column < 5; column++) {
      const first = column * range / 5 + 1;
      const last = (column + 1) * range / 5;
      const values = shuffle(Array.from({ length: last - first + 1 }, (_, i) => first + i));
      const panels = range === 75 ? 3 : 1;
      for (let panel = 0; panel < panels; panel++) {
        const rows = [0, 1, 2, 3, 4].filter(row => !(free && column === 2 && row === 2));
        const valuesPerPanel = free && column === 2 ? 4 : 5;
        rows.forEach((row, i) => {
          const boardIndex = panel * 25 + row * 5 + column;
          if (range === 75) {
            board[boardIndex] = values[panel * valuesPerPanel + i]!;
          } else {
            board[boardIndex] = values[i]!;
          }
        });
        if (free && column === 2) board[panel * 25 + 12] = null;
      }
    }
    const key = board.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      boards.push(board);
    }
  }

  const calls = shuffle(Array.from({ length: range }, (_, i) => i + 1))
    .map(number => ({ question: String(number), answer: number }));
  return { boards, calls };
}