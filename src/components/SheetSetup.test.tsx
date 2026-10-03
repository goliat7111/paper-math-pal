import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetOwnSetup } from "./SheetOwnSetup";
import { Problem, SheetSetup } from "./SheetSetup";

describe("Problem", () => {
  it("keeps one short row while all other rows share the same grid height", () => {
    const markup = renderToStaticMarkup(
      <Problem n={1} t={{ digits: [9, 9, 9], m: [9, 9] }} answers digitMm={5.5} showNumber={false} />,
    );

    expect(markup.match(/multiplication-carry-digit/g)).toHaveLength(6);
    expect(markup).toMatch(/grid-column:9;grid-row:1/);
    expect(markup).toMatch(/grid-column:10;grid-row:1/);
    expect(markup).toMatch(/grid-column:9;grid-row:3/);
    expect(markup).toMatch(/grid-column:10;grid-row:3/);
    expect(markup).toMatch(/grid-column:3 \/ 9;grid-row:3;border-bottom:2px solid var\(--sheet-ink\)/);
    expect(markup).toMatch(/grid-column:9 \/ 11;grid-row:3;border-bottom:2px solid var\(--sheet-ink\)/);
    expect(markup).toMatch(/class="flex items-center justify-center font-mono text-\[9px\] font-bold text-sheet-answer" style="grid-column:\d+;grid-row:4;height:100%">1<\/div>/);
    expect(markup).not.toMatch(/class="flex items-center justify-center font-mono text-\[9px\] font-bold text-sheet-answer" style="grid-column:\d+;grid-row:7/);
    expect(markup).toMatch(/grid-row:7;border-top:2px solid var\(--sheet-ink\)/);
    expect(markup).toMatch(/grid-column:\d+;grid-row:7;height:100%;font-size:5mm/);
    expect(markup).toContain('class="flex items-center justify-center font-mono text-[9px] font-bold text-sheet-answer"');
    expect(markup).toContain("grid-template-rows:minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) 3mm minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr)");
    expect(markup.match(/border border-sheet-grid/g)).toHaveLength(90);
  });

  it("right-aligns each setup and renders a single 10 by 9 grid", () => {
    const markup = renderToStaticMarkup(
      <SheetSetup
        tasks={[{ digits: [7, 0, 9], m: [2] }]}
        answers={false}
        topDigits={[3, 3]}
        bottomDigits={[1, 1]}
      />,
    );

    expect(markup).toMatch(/grid-column:8;grid-row:2[^>]*>9<\/div>/);
    expect(markup).toContain('class="exercise-twelve-box"');
    expect(markup).not.toContain("multiplication-setup-grid");
    expect(markup.match(/border border-sheet-grid/g)).toHaveLength(90);
  });

  it("uses the shared low comma position in multiplication cells", () => {
    const markup = renderToStaticMarkup(
      <Problem n={1} t={{ digits: [1, 2, 5], m: [2], dt: 1 }} answers digitMm={5.5} showNumber={false} />,
    );

    expect(markup.match(/class="worksheet-comma"/g)).toHaveLength(2);
  });

  it("places the ones partial product directly below the short row", () => {
    const markup = renderToStaticMarkup(
      <Problem n={1} t={{ digits: [3, 4, 5, 6], m: [2, 3] }} answers digitMm={5.5} showNumber={false} />,
    );

    expect(markup).toMatch(/grid-column:8;grid-row:5;height:100%;font-size:5mm">8<\/div>/);
    expect(markup).toMatch(/grid-column:7;grid-row:6;height:100%;font-size:5mm">2<\/div>/);
    expect(markup).toMatch(/grid-column:3;grid-row:6;height:100%;font-size:5mm">\+<\/div>/);
    expect(markup).toMatch(/grid-row:7;border-top:2px solid var\(--sheet-ink\)/);
  });

  it("uses the same full setup grid in the own-setup answer key with either student grid option", () => {
    const tasks = [{ digits: [4, 8, 3], m: [2] }];
    const withStudentGrid = renderToStaticMarkup(
      <SheetOwnSetup tasks={tasks} answers ownGrid />,
    );
    const withoutStudentGrid = renderToStaticMarkup(
      <SheetOwnSetup tasks={tasks} answers ownGrid={false} />,
    );

    for (const markup of [withStudentGrid, withoutStudentGrid]) {
      expect(markup).not.toContain("own-setup-key");
      expect(markup).toContain("grid-template-columns:repeat(10, minmax(5mm, 1fr))");
      expect(markup).toContain("grid-template-rows:minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) 3mm minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr) minmax(5mm, 1fr)");
      expect(markup.match(/border border-sheet-grid/g)).toHaveLength(90);
    }
  });
});
