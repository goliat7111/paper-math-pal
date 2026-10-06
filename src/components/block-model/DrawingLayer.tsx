import { useRef, useState, type PointerEvent } from "react";

import type { DrawingStroke } from "./types";

type DrawingLayerProps = {
  strokes: DrawingStroke[];
  active: boolean;
  onStrokeComplete: (stroke: DrawingStroke, viewport: { width: number; height: number }) => void;
};

function toPath(points: DrawingStroke["points"]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function DrawingLayer({ strokes, active, onStrokeComplete }: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointsRef = useRef<DrawingStroke["points"]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const [draftPath, setDraftPath] = useState("");

  function pointFromEvent(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 1000,
    };
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!active || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    pointsRef.current = [pointFromEvent(event)];
    setDraftPath(toPath(pointsRef.current));
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    pointsRef.current = [...pointsRef.current, pointFromEvent(event)];
    setDraftPath(toPath(pointsRef.current));
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    if (pointsRef.current.length > 1) {
      const rect = event.currentTarget.getBoundingClientRect();
      onStrokeComplete(
        {
          id: crypto.randomUUID(),
          points: pointsRef.current,
        },
        { width: rect.width, height: rect.height },
      );
    }
    pointerIdRef.current = null;
    pointsRef.current = [];
    setDraftPath("");
  }

  return (
    <svg
      ref={svgRef}
      className={`bm-drawing-layer ${active ? "bm-drawing-layer-active" : ""}`}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-label="Ritlager"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {strokes.map((stroke) => (
        <path key={stroke.id} d={toPath(stroke.points)} className="bm-drawing-stroke" />
      ))}
      {draftPath && <path d={draftPath} className="bm-drawing-stroke bm-drawing-draft" />}
    </svg>
  );
}
