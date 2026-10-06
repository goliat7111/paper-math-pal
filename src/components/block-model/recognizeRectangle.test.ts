import { describe, expect, it } from "vitest";

import { recognizeRectangle } from "./recognizeRectangle";

const viewport = { width: 1000, height: 800 };

function rectanglePoints(
  left: number,
  top: number,
  width: number,
  height: number,
  samplesPerSide = 8,
) {
  const corners = [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
    { x: left, y: top },
  ];
  const points = corners.slice(0, -1).flatMap((start, side) => {
    const end = corners[side + 1]!;
    return Array.from({ length: samplesPerSide }, (_, index) => {
      const progress = index / samplesPerSide;
      return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      };
    });
  });
  points.push(corners.at(-1)!);
  return points.map((point) => ({ x: point.x, y: (point.y * 1000) / viewport.height }));
}

describe("recognizeRectangle", () => {
  it("recognizes a closed hand-drawn rectangle and converts it to screen coordinates", () => {
    expect(recognizeRectangle(rectanglePoints(100, 120, 180, 64), viewport)).toEqual({
      x: 100,
      y: 120,
      width: 180,
      height: 64,
    });
  });

  it("accepts imperfect corners and a small gap between the ends of the stroke", () => {
    const points = rectanglePoints(100, 120, 180, 64);
    points[points.length - 1] = {
      x: points[0]!.x + 28,
      y: points[0]!.y + 8,
    };

    expect(recognizeRectangle(points, viewport)).not.toBeNull();
  });

  it("accepts a wobbly stroke around the straight sides", () => {
    const points = rectanglePoints(100, 120, 180, 64).map((point, index) => ({
      x: point.x + (index % 2 === 0 ? 3 : -3),
      y: point.y + (index % 3 === 0 ? 4 : -4),
    }));
    points[points.length - 1] = points[0]!;

    expect(recognizeRectangle(points, viewport)).not.toBeNull();
  });

  it("does not recognize an open rectangle", () => {
    const points = rectanglePoints(100, 120, 180, 64);
    points.pop();
    points[points.length - 1] = { x: 100, y: (120 * 1000) / viewport.height + 60 };
    expect(recognizeRectangle(points, viewport)).toBeNull();
  });

  it("does not recognize a diagonal mark", () => {
    const points = Array.from({ length: 20 }, (_, index) => ({
      x: index * 20,
      y: index * 20,
    }));
    expect(recognizeRectangle(points, viewport)).toBeNull();
  });

  it("does not mistake a closed circle for a rectangle", () => {
    const points = Array.from({ length: 65 }, (_, index) => {
      const angle = (index / 64) * Math.PI * 2;
      return {
        x: 200 + Math.cos(angle) * 40,
        y: (180 + Math.sin(angle) * 40) * (1000 / viewport.height),
      };
    });
    expect(recognizeRectangle(points, viewport)).toBeNull();
  });
});
