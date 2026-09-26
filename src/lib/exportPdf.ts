export type Orientation = "portrait" | "landscape";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/** Exporterar alla synliga blad (.a4-page i utskriftsområdet) som en
 *  utskriftsklar A4-PDF med bevarad layout. Varje blad blir exakt en
 *  PDF-sida, så uppgifter hålls alltid ihop (även i liggande A4).
 *  Diskreta sidnummer ritas i bladets nedre marginal. */
export async function exportSheetsToPdf(
  orientation: Orientation,
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
    const page = pages[i]!;
    const png = await toPng(page, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: page.offsetWidth,
      height: page.offsetHeight,
      style: { boxShadow: "none" },
    });
    if (i > 0) pdf.addPage("a4", orientation);
    pdf.addImage(png, "PNG", 0, 0, w, h);
    // Diskret sidnummer i den nedre marginalen (påverkar inte bladet)
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(160);
    pdf.text(`Sida ${i + 1} av ${pages.length}`, w / 2, h - 6, { align: "center" });
    pdf.setTextColor(0);
  }
  pdf.save(filename);
  return pages.length;
}
