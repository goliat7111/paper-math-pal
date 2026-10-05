export type WordSearchSize = 10 | 12 | 15;
export type WordSearchLanguage = "sv" | "en";
export type WordSearchDirection = "reading" | "all";

export interface WordSearchPuzzle {
  grid: string[][];
  words: string[];
  language: WordSearchLanguage;
}

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
] as const;
const allDirections = [
  ...directions,
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
] as const;

const letterSets: Record<WordSearchLanguage, string> = {
  sv: "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

const allowedPatterns: Record<WordSearchLanguage, RegExp> = {
  sv: /^[A-ZÅÄÖ]+$/,
  en: /^[A-Z]+$/,
};

export function getWordSearchLetterSet(language: WordSearchLanguage): string {
  return letterSets[language];
}

export function prepareWordList(
  input: string,
  size: WordSearchSize,
  language: WordSearchLanguage = "sv",
): { words: string[]; error: string | null } {
  const words: string[] = [];
  const seen = new Set<string>();
  const locale = language === "sv" ? "sv-SE" : "en-US";

  for (const [index, line] of input.split(/\r?\n/).entries()) {
    const word = line
      .trim()
      .normalize("NFC")
      .toLocaleUpperCase(locale)
      .replace(/[\s-]/g, "");
    if (!word) continue;
    if (!allowedPatterns[language].test(word)) {
      return {
        words: [],
        error: `Ordet på rad ${index + 1} innehåller tecken som inte stöds i ${language === "sv" ? "svenska" : "engelska"}. Använd bokstäver från det valda språket.`,
      };
    }
    if (word.length > size) {
      return {
        words: [],
        error: `”${word}” är längre än spelplanens ${size} rutor. Välj en större spelplan eller korta ordet.`,
      };
    }
    if (seen.has(word)) {
      return { words: [], error: `Ordet ”${word}” finns med flera gånger.` };
    }
    seen.add(word);
    words.push(word);
  }

  if (words.length === 0) {
    return { words: [], error: "Skriv minst ett ord i ordlistan." };
  }
  if (words.length > size * size) {
    return { words: [], error: "Det finns fler ord än rutor i spelplanen." };
  }
  return { words, error: null };
}

export function generateWordSearch(
  words: readonly string[],
  size: WordSearchSize,
  random: () => number = Math.random,
  language: WordSearchLanguage = "sv",
  direction: WordSearchDirection = "reading",
): WordSearchPuzzle | null {
  if (words.length === 0 || words.some((word) => word.length > size)) return null;
  const orderedWords = [...words].sort((a, b) => b.length - a.length);
  const letters = getWordSearchLetterSet(language);
  const placementDirections = direction === "all" ? allDirections : directions;
  let bestGrid: (string | null)[][] | null = null;
  let bestPlacedWords = new Set<string>();
  let bestPlacedLetters = 0;

  for (let attempt = 0; attempt < 200; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array<string | null>(size).fill(null),
    );
    const placedWords = new Set<string>();

    for (const word of orderedWords) {
      const placements: { row: number; column: number; dr: number; dc: number }[] = [];
      for (const [dr, dc] of placementDirections) {
        for (let row = 0; row < size; row++) {
          for (let column = 0; column < size; column++) {
            const endRow = row + (word.length - 1) * dr;
            const endColumn = column + (word.length - 1) * dc;
            if (endRow >= 0 && endRow < size && endColumn >= 0 && endColumn < size) {
              placements.push({ row, column, dr, dc });
            }
          }
        }
      }
      shuffle(placements, random);

      const placement = placements.find(({ row, column, dr, dc }) =>
        [...word].every((letter, index) => {
          const existing = grid[row + index * dr]![column + index * dc];
          return existing === null || existing === letter;
        }),
      );

      if (!placement) continue;

      for (let index = 0; index < word.length; index++) {
        grid[placement.row + index * placement.dr]![placement.column + index * placement.dc] =
          word[index]!;
      }
      placedWords.add(word);
    }

    const placedLetters = [...placedWords].reduce((total, word) => total + word.length, 0);
    if (
      placedWords.size > bestPlacedWords.size ||
      (placedWords.size === bestPlacedWords.size && placedLetters > bestPlacedLetters)
    ) {
      bestGrid = grid.map((row) => [...row]);
      bestPlacedWords = placedWords;
      bestPlacedLetters = placedLetters;
    }
    if (placedWords.size === orderedWords.length) break;
  }

  if (!bestGrid) return null;
  return {
    grid: bestGrid.map((row) =>
      row.map((letter) => letter ?? letters[Math.floor(random() * letters.length)]!),
    ),
    words: words.filter((word) => bestPlacedWords.has(word)),
    language,
  };
}

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
  }
}
