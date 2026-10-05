import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetPyramids } from "./SheetPyramids";
import type { NumberPyramid } from "@/lib/number-pyramids";

const pyramid: NumberPyramid = {
  rows: [[12], [5, 7], [2, 3, 4]],
  given: [[true], [false, false], [true, true, false]],
};

describe("SheetPyramids", () => {
  it("shows the top number and all but one bottom number on a student sheet", () => {
    const markup = renderToStaticMarkup(
      <SheetPyramids pyramids={[pyramid]} rowCount={3} mode="top" topTotal={12} answers={false} />,
    );
    expect(markup.match(/class="pyramid-cell is-filled"/g)).toHaveLength(3);
    expect(markup).toContain(">12</div>");
    expect(markup).toContain(">2</div>");
    expect(markup).toContain(">3</div>");
    expect(markup).not.toContain(">5</div>");
    expect(markup).not.toContain(">4</div>");
  });

  it("shows every number on the answer sheet", () => {
    const markup = renderToStaticMarkup(
      <SheetPyramids pyramids={[pyramid]} rowCount={3} mode="top" topTotal={12} answers />,
    );
    expect(markup.match(/class="pyramid-cell is-filled"/g)).toHaveLength(6);
  });
});
