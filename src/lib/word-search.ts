export type WordSearchSize = 10 | 12 | 15;

export interface WordSearchPuzzle {
  grid: string[][];
  words: string[];
}

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
] as const;
const letters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞĀĂĄĆČĎĐĒĖĘĚĞĢĪĮİĶĹĽŁŃŅŇŌŐŔŘŚŞŠŢŤŪŮŰŲŹŻŽ";

export function prepareWordList(
  input: string,
  size: WordSearchSize,
): { words: string[]; error: string | null } {
  const words: string[] = [];
  const seen = new Set<string>();

  for (const [index, line] of input.split(/\r?\n/).entries()) {
    const word = line.trim().normalize("NFC").toLocaleUpperCase("sv-SE").replace(/[\s-]/g, "");
    if (!word) continue;
    if (!/^\p{Script=Latin}+$/u.test(word)) {
      return {
        words: [],
        error: `Ordet på rad ${index + 1} innehåller tecken som inte stöds. Använd latinska bokstäver.`,
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
): WordSearchPuzzle | null {
  if (words.length === 0 || words.some((word) => word.length > size)) return null;
  const orderedWords = [...words].sort((a, b) => b.length - a.length);

  for (let attempt = 0; attempt < 200; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array<string | null>(size).fill(null),
    );
    let allPlaced = true;

    for (const word of orderedWords) {
      const placements: { row: number; column: number; dr: number; dc: number }[] = [];
      for (const [dr, dc] of directions) {
        for (let row = 0; row < size; row++) {
          for (let column = 0; column < size; column++) {
            const endRow = row + (word.length - 1) * dr;
            const endColumn = column + (word.length - 1) * dc;
            if (endRow < size && endColumn < size) {
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

      if (!placement) {
        allPlaced = false;
        break;
      }

      for (let index = 0; index < word.length; index++) {
        grid[placement.row + index * placement.dr]![placement.column + index * placement.dc] =
          word[index]!;
      }
    }

    if (!allPlaced) continue;
    return {
      grid: grid.map((row) =>
        row.map((letter) => letter ?? letters[Math.floor(random() * letters.length)]!),
      ),
      words: [...words],
    };
  }

  return null;
}

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
  }
}
