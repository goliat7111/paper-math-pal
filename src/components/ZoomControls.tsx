import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Skalning av arbetsbladen på skärmen: --fit anpassar efter sidans bredd,
 *  --zoom är användarens manuella zoom. Påverkar aldrig utskrift eller PDF. */
export function useSheetZoom() {
  const mainRef = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(1);
  const zoomStep = (dir: number) =>
    setZoom(z => Math.min(3, Math.max(0.5, Math.round((z + dir * 0.25) * 100) / 100)));
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, el.clientWidth / (297 * 96 / 25.4))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const mainProps = {
    ref: mainRef,
    style: { "--fit": fit, "--zoom": zoom } as CSSProperties,
  };
  return { mainProps, zoom, setZoom, zoomStep };
}

export function ZoomControls({ zoom, setZoom, zoomStep }: { zoom: number; setZoom: (z: number) => void; zoomStep: (dir: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">Zoom i förhandsgranskningen</legend>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" className="h-7 px-3 text-xs font-semibold" variant={zoom === 1 ? "default" : "outline"} aria-pressed={zoom === 1} onClick={() => setZoom(1)}>Hel sida</Button>
        <Button type="button" size="sm" className="h-7 w-7 px-0" variant="outline" aria-label="Zooma ut" disabled={zoom <= 0.5} onClick={() => zoomStep(-1)}><ZoomOut className="h-3.5 w-3.5" /></Button>
        <span className="w-12 text-center text-xs font-semibold tabular-nums" aria-live="polite">{Math.round(zoom * 100)} %</span>
        <Button type="button" size="sm" className="h-7 w-7 px-0" variant="outline" aria-label="Zooma in" disabled={zoom >= 3} onClick={() => zoomStep(1)}><ZoomIn className="h-3.5 w-3.5" /></Button>
      </div>
    </fieldset>
  );
}
