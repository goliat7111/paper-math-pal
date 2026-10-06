import type { BlockModelObject } from "./types";

export type BlockModelBlock = Extract<BlockModelObject, { type: "block" }>;

export function getBlockSegmentBoundaries(block: BlockModelBlock): number[] {
  const partCount = block.parts + 1;
  const positions = [
    ...Array.from({ length: partCount - 1 }, (_, index) => (index + 1) / partCount),
    ...Array.from(
      { length: Math.max(0, block.divisions - 1) },
      (_, index) => (index + 1) / block.divisions,
    ),
    ...block.extraDividers,
  ]
    .filter((position) => position > 0 && position < 1)
    .sort((left, right) => left - right);

  const uniquePositions = positions.filter(
    (position, index) => index === 0 || position - positions[index - 1]! > 0.001,
  );
  return [0, ...uniquePositions, 1];
}

function addEqualDividers(dividers: number[], start: number, end: number, count: number): number[] {
  const additions = Array.from({ length: count - 1 }, (_, index) =>
    Number((start + ((end - start) * (index + 1)) / count).toFixed(10)),
  );
  return [...new Set([...dividers, ...additions])].sort((left, right) => left - right);
}

export function divideBlockSegment(
  block: BlockModelBlock,
  segmentIndex: number,
  count: number,
): BlockModelBlock {
  const boundaries = getBlockSegmentBoundaries(block);
  if (
    !Number.isSafeInteger(count) ||
    count < 2 ||
    segmentIndex < 0 ||
    segmentIndex >= boundaries.length - 1
  ) {
    return block;
  }

  return {
    ...block,
    extraDividers: addEqualDividers(
      block.extraDividers,
      boundaries[segmentIndex]!,
      boundaries[segmentIndex + 1]!,
      count,
    ),
  };
}

export function divideAllBlockSegments(block: BlockModelBlock, count: number): BlockModelBlock {
  if (!Number.isSafeInteger(count) || count < 2) return block;
  const boundaries = getBlockSegmentBoundaries(block);
  const extraDividers = boundaries
    .slice(1)
    .reduce(
      (dividers, end, index) => addEqualDividers(dividers, boundaries[index]!, end, count),
      block.extraDividers,
    );
  return { ...block, extraDividers };
}
