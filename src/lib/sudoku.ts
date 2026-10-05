export type Difficulty = "easy" | "medium" | "hard";

export type SudokuPuzzle = {
  puzzle: number[][];
  solution: number[][];
  difficulty: Difficulty;
};

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function cloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function findEmptyCell(board: number[][]): [number, number] | null {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

function isValidPlacement(board: number[][], row: number, col: number, value: number): boolean {
  for (let index = 0; index < 9; index += 1) {
    if (board[row][index] === value && index !== col) {
      return false;
    }
    if (board[index][col] === value && index !== row) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    for (let colIndex = 0; colIndex < 3; colIndex += 1) {
      const currentRow = boxRow + rowIndex;
      const currentCol = boxCol + colIndex;
      if (board[currentRow][currentCol] === value && (currentRow !== row || currentCol !== col)) {
        return false;
      }
    }
  }

  return true;
}

function solveBoard(board: number[][]): boolean {
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  for (const value of shuffle(DIGITS)) {
    if (!isValidPlacement(board, row, col, value)) {
      continue;
    }

    board[row][col] = value;

    if (solveBoard(board)) {
      return true;
    }

    board[row][col] = 0;
  }

  return false;
}

export function generateSolvedSudokuBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
  solveBoard(board);
  return board;
}

export function solveSudoku(board: number[][]): number[][] | null {
  const copy = cloneBoard(board);
  return solveBoard(copy) ? copy : null;
}

export function isValidSudokuBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row += 1) {
    const seenInRow = new Set<number>();
    for (let col = 0; col < 9; col += 1) {
      const value = board[row][col];
      if (value === 0) {
        continue;
      }
      if (seenInRow.has(value) || !isValidPlacement(board, row, col, value)) {
        return false;
      }
      seenInRow.add(value);
    }
  }

  for (let col = 0; col < 9; col += 1) {
    const seenInColumn = new Set<number>();
    for (let row = 0; row < 9; row += 1) {
      const value = board[row][col];
      if (value === 0) {
        continue;
      }
      if (seenInColumn.has(value)) {
        return false;
      }
      seenInColumn.add(value);
    }
  }

  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const seenInBox = new Set<number>();
      for (let row = boxRow; row < boxRow + 3; row += 1) {
        for (let col = boxCol; col < boxCol + 3; col += 1) {
          const value = board[row][col];
          if (value === 0) {
            continue;
          }
          if (seenInBox.has(value)) {
            return false;
          }
          seenInBox.add(value);
        }
      }
    }
  }

  return true;
}

export function generateSudokuPuzzle(
  difficulty: Difficulty = "medium",
  visibleClues?: number,
): SudokuPuzzle {
  const solution = generateSolvedSudokuBoard();
  const puzzle = cloneBoard(solution);
  const targetClues = Math.max(17, Math.min(81, visibleClues ?? { easy: 39, medium: 32, hard: 26 }[difficulty]));

  const cells = shuffle(Array.from({ length: 81 }, (_, index) => index));
  for (let index = 0; index < 81 - targetClues; index += 1) {
    const cell = cells[index];
    const row = Math.floor(cell / 9);
    const col = cell % 9;
    puzzle[row][col] = 0;
  }

  return {
    puzzle,
    solution,
    difficulty,
  };
}

export function getSudokuDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return "Lätt";
    case "medium":
      return "Medel";
    case "hard":
      return "Svår";
    default:
      return "Medel";
  }
}
