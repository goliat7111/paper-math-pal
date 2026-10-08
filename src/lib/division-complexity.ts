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
      label: "Kombination: flera växlingar och nollor",
      rules: {
        dividendDigits: 4,
        groupFirstDigits: false,
        minTransfers: 2,
        zeroInDividend: true,
        zeroInQuotient: true,
        withRemainder: false,
      },
    },
    {
      label: "Gruppering",
      rules: {
        ...plain,
        dividendDigits: 3,
        groupFirstDigits: true,
        withRemainder: false,
      },
    },
    {
      label: "Nolla i kvoten",
      rules: {
        ...plain,
        dividendDigits: 3,
        zeroInQuotient: true,
        withRemainder: false,
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
type ChallengeProfile = { mask: number; tasks: DivisionTask[] };
type ChallengeProfilePair = [ChallengeProfile, ChallengeProfile];
let finalChallengeProfiles: ChallengeProfilePair[] | undefined;

const finalChallengeLabels = [
  "Gruppering",
  "En växling",
  "Flera växlingar",
  "Nolla i dividenden",
  "Nolla i kvoten",
] as const;

function getFinalChallengeProfiles(): ChallengeProfilePair[] {
  if (finalChallengeProfiles) return finalChallengeProfiles;

  const profiles = new Map<number, DivisionTask[]>();
  for (const task of findDivisionCandidates({ dividendDigits: 3, withRemainder: false })) {
    const complexity = analyzeDivisionComplexity(task);
    const features = [
      complexity.groupFirstDigits,
      complexity.transfers === 1,
      complexity.transfers >= 2,
      complexity.zeroInDividend,
      complexity.zeroInQuotient,
    ];
    const mask = features.reduce((value, present, i) => value | (present ? 1 << i : 0), 0);
    const tasks = profiles.get(mask) ?? [];
    tasks.push(task);
    profiles.set(mask, tasks);
  }

  const groupedProfiles = [...profiles].map(([mask, tasks]) => ({ mask, tasks }));
  let maxChallenges = -1;
  const bestPairs: ChallengeProfilePair[] = [];
  for (let i = 0; i < groupedProfiles.length; i++) {
    for (let j = i; j < groupedProfiles.length; j++) {
      const first = groupedProfiles[i]!;
      const second = groupedProfiles[j]!;
      if (i === j && first.tasks.length < 2) continue;
      const covered = first.mask | second.mask;
      let challengeCount = 0;
      for (let bits = covered; bits; bits &= bits - 1) challengeCount++;
      if (challengeCount > maxChallenges) {
        maxChallenges = challengeCount;
        bestPairs.length = 0;
      }
      if (challengeCount === maxChallenges) bestPairs.push([first, second]);
    }
  }
  if (!bestPairs.length) throw new Error("Hittade inga kombinationer för uppgift 11 och 12.");
  finalChallengeProfiles = bestPairs;
  return bestPairs;
}

function drawIndex(length: number, random: () => number): number {
  const draw = random();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
    throw new Error("Slumptalet måste vara mellan 0 och 1 (exklusive 1).");
  return Math.floor(draw * length);
}

function genFinalChallengePair(random: () => number): DivisionTask[] {
  const pairs = getFinalChallengeProfiles();
  const pair = pairs[drawIndex(pairs.length, random)];
  if (!pair) throw new Error("Hittade inga kombinationer för uppgift 11 och 12.");
  const [firstProfile, secondProfile] = pair;
  const firstIndex = drawIndex(firstProfile.tasks.length, random);
  const secondIndex =
    firstProfile === secondProfile
      ? (firstIndex + 1 + drawIndex(firstProfile.tasks.length - 1, random)) %
        firstProfile.tasks.length
      : drawIndex(secondProfile.tasks.length, random);
  const tasks = [{ ...firstProfile.tasks[firstIndex]! }, { ...secondProfile.tasks[secondIndex]! }];
  if (drawIndex(2, random) === 1) tasks.reverse();
  for (const task of tasks) {
    const complexity = analyzeDivisionComplexity(task);
    const features = [
      complexity.groupFirstDigits,
      complexity.transfers === 1,
      complexity.transfers >= 2,
      complexity.zeroInDividend,
      complexity.zeroInQuotient,
    ];
    task.note = finalChallengeLabels.filter((_, i) => features[i]).join(" · ");
  }
  return tasks;
}

export function genDivisionProgression(
  random: () => number = Math.random,
  allowRest = true,
): DivisionTask[] {
  progressionPools ??= divisionProgression.map((step) => findDivisionCandidates(step.rules));
  const steps = divisionProgression
    .map((step, i) => ({ step, pool: progressionPools![i]! }))
    .filter(({ step }) => allowRest || !step.rules.withRemainder);
  const tasks = steps.slice(0, 10).map(({ step, pool }) => {
    if (!pool.length) throw new Error(`Hittade inga divisioner för ${step.label}.`);
    return { ...pool[drawIndex(pool.length, random)]!, note: step.label };
  });
  return [...tasks, ...genFinalChallengePair(random)];
}

function _unused() {
  const tasks = [].map(() => {
    const pool: never[] = [];
    if (!pool.length) throw new Error(`Hittade inga divisioner för ${step.label}.`);
    return { ...pool[drawIndex(pool.length, random)]!, note: step.label };
  });
  return [...tasks, ...genFinalChallengePair(random)];
}
