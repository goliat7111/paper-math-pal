import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Skalning av arbetsbladen på skärmen: --fit anpassar efter både sidans bredd och fönstrets höjd,
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
    const updateFit = () => {
      const width = el.clientWidth || el.getBoundingClientRect().width;
      if (width <= 0) return;
      const page = el.querySelector(".a4-page");
      const landscape = page?.classList.contains("landscape");
      const pageWidth = landscape ? 297 : 210;
      const pageHeight = landscape ? 210 : 297;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const documentTop = el.getBoundingClientRect().top + window.scrollY;
      // On narrow screens the preview starts below the controls; fit it to a full viewport.
      const top = documentTop < viewportHeight / 2 ? Math.max(16, documentTop) : 16;
      const height = Math.max(1, viewportHeight - top - 24);
      setFit(Math.max(0.01, Math.min(1, width / (pageWidth * 96 / 25.4), height / (pageHeight * 96 / 25.4))));
    };
    const ro = new ResizeObserver(updateFit);
    const observer = new MutationObserver(updateFit);
    observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    updateFit();
    ro.observe(el);
    window.addEventListener("resize", updateFit);
    window.visualViewport?.addEventListener("resize", updateFit);
    return () => { ro.disconnect(); observer.disconnect(); window.removeEventListener("resize", updateFit); window.visualViewport?.removeEventListener("resize", updateFit); };
  }, []);
  const mainProps = {
    ref: mainRef,
    style: { "--fit": fit, "--zoom": zoom } as CSSProperties,
  };
  const changeZoom = (value: number) => {
    setZoom(value);
    if (value === 1) requestAnimationFrame(() => {
      const page = mainRef.current?.querySelector(".a4-page");
      if (!page) return;
      const rect = page.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) page.scrollIntoView({ block: "start", inline: "nearest" });
    });
  };
  return { mainProps, zoom, setZoom: changeZoom, zoomStep };
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
