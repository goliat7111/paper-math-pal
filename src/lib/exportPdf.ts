export type Orientation = "portrait" | "landscape";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/** Exporterar alla synliga blad (.a4-page i utskriftsområdet) som en
 *  utskriftsklar A4-PDF med bevarad layout. */
export async function exportSheetsToPdf(
  orientation: "portrait" | "landscape",
  filename = "raknebladet.pdf",
): Promise<number> {
  const pages = Array.from(
    document.querySelectorAll<HTMLElement>(".print-area .a4-page"),
  );
  if (pages.length === 0) return 0;
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
  const w = orientation === "portrait" ? 210 : 297;
  const h = orientation === "portrait" ? 297 : 210;
  for (let i = 0; i < pages.length; i++) {
    const png = await toPng(pages[i], {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: pages[i].offsetWidth,
      height: pages[i].offsetHeight,
      style: { boxShadow: "none" },
    });
    if (i > 0) pdf.addPage("a4", orientation);
    pdf.addImage(png, "PNG", 0, 0, w, h);
  }
  pdf.save(filename);
  return pages.length;
}
