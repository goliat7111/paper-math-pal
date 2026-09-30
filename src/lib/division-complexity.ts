import { divisionSteps, type DivisionTask } from "./division";

/** Regler för heltalsdivision. Utelämnade egenskaper lämnas fria. */
export type DivisionComplexityRules = {
  dividendDigits: 2 | 3 | 4;
  groupFirstDigits?: boolean;
  minTransfers?: number;
  maxTransfers?: number;
  zeroInDividend?: boolean;
  zeroInQuotient?: boolean;
  withRemainder?: boolean;
};

export function analyzeDivisionComplexity(task: DivisionTask) {
  if (
    !Number.isInteger(task.dividend) ||
    task.dividend < 10 ||
    task.dividend > 9999 ||
    !Number.isInteger(task.divisor) ||
    task.divisor < 2 ||
    task.divisor > 9 ||
    (task.dividendDecimals ?? 0) !== 0 ||
    (task.quotientDecimals ?? 0) !== 0 ||
    task.shownDecimals
  ) {
    throw new Error("Komplexitetsreglerna kräver heltalsdivision med ensiffrig nämnare.");
  }
  const quotient = Math.floor(task.dividend / task.divisor);
  const steps = divisionSteps(task);
  const firstQuotient = steps.findIndex((step) => step.quotientDigit > 0);
  return {
    dividendDigits: String(task.dividend).length,
    groupFirstDigits: Number(String(task.dividend)[0]) < task.divisor,
    // Inledande gruppering och slutrest räknas som egna moment, inte växlingar.
    transfers: steps.filter(
      (step, i) => i >= firstQuotient && i < steps.length - 1 && step.remainder > 0,
    ).length,
    zeroInDividend: String(task.dividend).includes("0"),
    // Den oskrivna inledande nollan vid gruppering är ingen nolla i kvoten.
    zeroInQuotient: String(quotient).includes("0"),
    withRemainder: task.dividend % task.divisor > 0,
  };
}

export function matchesDivisionComplexity(task: DivisionTask, rules: DivisionComplexityRules) {
  const actual = analyzeDivisionComplexity(task);
  return (
    actual.dividendDigits === rules.dividendDigits &&
    (rules.groupFirstDigits === undefined || actual.groupFirstDigits === rules.groupFirstDigits) &&
    actual.transfers >= (rules.minTransfers ?? 0) &&
    actual.transfers <= (rules.maxTransfers ?? Infinity) &&
    (rules.zeroInDividend === undefined || actual.zeroInDividend === rules.zeroInDividend) &&
    (rules.zeroInQuotient === undefined || actual.zeroInQuotient === rules.zeroInQuotient) &&
    (rules.withRemainder === undefined || actual.withRemainder === rules.withRemainder)
  );
}

const plain = {
  groupFirstDigits: false,
  zeroInDividend: false,
  zeroInQuotient: false,
  withRemainder: false,
};

export const divisionProgression: ReadonlyArray<{ label: string; rules: DivisionComplexityRules }> =
  [
    { label: "Jämn division", rules: { ...plain, dividendDigits: 2, maxTransfers: 0 } },
    { label: "Fler positioner", rules: { ...plain, dividendDigits: 3, maxTransfers: 0 } },
    {
      label: "Divisorn ryms inte i första siffran",
      rules: { ...plain, dividendDigits: 3, groupFirstDigits: true, maxTransfers: 0 },
    },
    {
      label: "En växling",
      rules: { ...plain, dividendDigits: 2, minTransfers: 1, maxTransfers: 1 },
    },
    {
      label: "Flera växlingar",
      rules: { ...plain, dividendDigits: 3, minTransfers: 2, maxTransfers: 2 },
    },
    {
      label: "Nolla i dividenden",
      rules: {
        ...plain,
        dividendDigits: 3,
        zeroInDividend: true,
        minTransfers: 1,
        maxTransfers: 1,
      },
    },
    {
      label: "Nolla i kvoten",
      rules: {
        ...plain,
        dividendDigits: 3,
        zeroInQuotient: true,
        minTransfers: 1,
        maxTransfers: 1,
      },
    },
    { label: "Rest", rules: { ...plain, dividendDigits: 2, withRemainder: true, maxTransfers: 0 } },
    {
      label: "Flera växlingar + rest",
      rules: { ...plain, dividendDigits: 3, withRemainder: true, minTransfers: 2 },
    },
    {
      label: "Kombination: flera växlingar, nollor och rest",
      rules: {
        dividendDigits: 4,
        groupFirstDigits: false,
        minTransfers: 2,
        zeroInDividend: true,
        zeroInQuotient: true,
        withRemainder: true,
      },
    },
  ];

/** Sök hela det begränsade talområdet; ingen slumpmässig timeout eller hårdkodad reservuppgift. */
export function findDivisionCandidates(rules: DivisionComplexityRules): DivisionTask[] {
  if (
    ![2, 3, 4].includes(rules.dividendDigits) ||
    [rules.minTransfers, rules.maxTransfers].some(
      (value) => value !== undefined && (!Number.isInteger(value) || value < 0),
    )
  ) {
    throw new Error("Ogiltiga komplexitetsregler.");
  }
  const candidates: DivisionTask[] = [];
  for (
    let dividend = 10 ** (rules.dividendDigits - 1);
    dividend < 10 ** rules.dividendDigits;
    dividend++
  ) {
    for (let divisor = 2; divisor <= 9; divisor++) {
      const task = {
        dividend,
        divisor,
        quotient: Math.floor(dividend / divisor),
        remainder: dividend % divisor,
      };
      if (matchesDivisionComplexity(task, rules)) candidates.push(task);
    }
  }
  return candidates;
}

// Fasta steg delar kandidatpool mellan nya varianter. Manuella regler kan senare
// använda findDivisionCandidates utan att en obegränsad regelcache byggs upp.
let progressionPools: DivisionTask[][] | undefined;
export function genDivisionProgression(random: () => number = Math.random): DivisionTask[] {
  progressionPools ??= divisionProgression.map((step) => findDivisionCandidates(step.rules));
  return divisionProgression.map((step, i) => {
    const pool = progressionPools![i]!;
    if (!pool.length) throw new Error(`Hittade inga divisioner för ${step.label}.`);
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
      throw new Error("Slumptalet måste vara mellan 0 och 1 (exklusive 1).");
    return { ...pool[Math.floor(draw * pool.length)]!, note: step.label };
  });
}
