type Point = { x: number; y: number };

export type RectangleBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function recognizeRectangle(
  points: Point[],
  viewport: { width: number; height: number },
): RectangleBounds | null {
  if (points.length < 8 || viewport.width <= 0 || viewport.height <= 0) return null;

  const screenPoints = points.map((point) => ({
    x: (point.x * viewport.width) / 1000,
    y: (point.y * viewport.height) / 1000,
  }));
  const xs = screenPoints.map((point) => point.x);
  const ys = screenPoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  if (width < 48 || height < 28 || width / height < 0.45 || width / height > 5.5) return null;

  const diagonal = Math.hypot(width, height);
  const first = screenPoints[0]!;
  const last = screenPoints[screenPoints.length - 1]!;
  if (Math.hypot(first.x - last.x, first.y - last.y) > Math.max(24, diagonal * 0.25)) {
    return null;
  }

  const tolerance = Math.max(14, Math.min(width, height) * 0.3);
  const inset = tolerance * 0.5;
  const cornerTolerance = Math.min(width, height) * 0.14;
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  const hasAllCorners = corners.every((corner) =>
    screenPoints.some(
      (point) =>
        Math.abs(point.x - corner.x) <= cornerTolerance &&
        Math.abs(point.y - corner.y) <= cornerTolerance,
    ),
  );
  if (!hasAllCorners) return null;

  const edgePoints: Record<"top" | "right" | "bottom" | "left", number[]> = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };

  for (const point of screenPoints) {
    if (Math.abs(point.y - minY) <= tolerance && point.x > minX + inset && point.x < maxX - inset) {
      edgePoints.top.push(point.x);
    }
    if (Math.abs(point.x - maxX) <= tolerance && point.y > minY + inset && point.y < maxY - inset) {
      edgePoints.right.push(point.y);
    }
    if (Math.abs(point.y - maxY) <= tolerance && point.x > minX + inset && point.x < maxX - inset) {
      edgePoints.bottom.push(point.x);
    }
    if (Math.abs(point.x - minX) <= tolerance && point.y > minY + inset && point.y < maxY - inset) {
      edgePoints.left.push(point.y);
    }
  }

  const horizontalCoverage = Math.min(
    width,
    Math.max(...edgePoints.top) - Math.min(...edgePoints.top),
    Math.max(...edgePoints.bottom) - Math.min(...edgePoints.bottom),
  );
  const verticalCoverage = Math.min(
    height,
    Math.max(...edgePoints.left) - Math.min(...edgePoints.left),
    Math.max(...edgePoints.right) - Math.min(...edgePoints.right),
  );

  if (
    Object.values(edgePoints).some((edge) => edge.length < 2) ||
    horizontalCoverage / width < 0.4 ||
    verticalCoverage / height < 0.4
  ) {
    return null;
  }

  return { x: minX, y: minY, width, height };
}
