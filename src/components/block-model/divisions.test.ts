import { describe, expect, it } from "vitest";

import {
  divideAllBlockSegments,
  divideBlockSegment,
  getBlockSegmentBoundaries,
  type BlockModelBlock,
} from "./divisions";

const block: BlockModelBlock = {
  id: "block",
  type: "block",
  x: 0,
  y: 0,
  segmentWidth: 150,
  height: 64,
  parts: 1,
  divisions: 1,
  extraDividers: [],
  label: "",
  color: "#fff2bf",
};

describe("block divisions", () => {
  it("adds equal divisions within only the selected segment", () => {
    const divided = divideBlockSegment(block, 1, 3);
    const boundaries = getBlockSegmentBoundaries(divided);

    expect(boundaries).toHaveLength(5);
    [0, 0.5, 2 / 3, 5 / 6, 1].forEach((boundary, index) => {
      expect(boundaries[index]).toBeCloseTo(boundary);
    });
    expect(getBlockSegmentBoundaries(block)).toEqual([0, 0.5, 1]);
  });

  it("divides every existing segment while keeping previous boundaries", () => {
    const divided = divideAllBlockSegments(block, 2);

    expect(getBlockSegmentBoundaries(divided)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("keeps whole-block divisions and appended parts aligned", () => {
    const dividedBlock = { ...block, divisions: 3, extraDividers: [] };

    expect(getBlockSegmentBoundaries(dividedBlock)).toEqual([0, 1 / 3, 0.5, 2 / 3, 1]);
  });

  it("ignores an invalid segment index or division count", () => {
    expect(divideBlockSegment(block, -1, 3)).toBe(block);
    expect(divideBlockSegment(block, 0, 1)).toBe(block);
  });
});
