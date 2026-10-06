import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddSubSetup, SheetAddSub } from "./SheetAddSub";

describe("AddSubSetup", () => {
  it("keeps addition carries in their original cells and aligns them low within those cells", () => {
    const markup = renderToStaticMarkup(
      <AddSubSetup t={{ op: "add", terms: [48, 57], decs: [0, 0] }} answers />,
    );

    expect(markup).not.toContain("addsub-answer-wrap");
    expect(markup).toMatch(/addsub-cell addsub-small" style="grid-column:3;grid-row:2">1<\/div>/);
    expect(markup).toMatch(/addsub-cell addsub-small" style="grid-column:4;grid-row:2">1<\/div>/);
    expect(markup).toMatch(/addsub-cell is-answer" style="grid-column:5;grid-row:5">5<\/div>/);
  });

  it("uses the shared low comma position in decimal cells", () => {
    const markup = renderToStaticMarkup(
      <AddSubSetup t={{ op: "add", terms: [125, 26], decs: [1, 1] }} answers />,
    );

    expect(markup.match(/class="worksheet-comma"/g)).toHaveLength(3);
  });

  it("leaves subtraction borrow markings in their original columns", () => {
    const markup = renderToStaticMarkup(
      <AddSubSetup t={{ op: "sub", terms: [400, 7], decs: [0, 0] }} answers />,
    );

    expect(markup).not.toContain("addsub-answer-wrap");
    expect(markup).toContain("addsub-small");
  });

  it("crosses out borrowed tens that are passed on across zeroes", () => {
    const markup = renderToStaticMarkup(
      <AddSubSetup t={{ op: "sub", terms: [922, 388], decs: [0, 2] }} answers />,
    );

    expect(markup.match(/addsub-cell addsub-small is-borrow-used/g)).toHaveLength(2);
  });

  it("uses a 9 by 8 grid in addition and subtraction setup sheets", () => {
    for (const op of ["add", "sub"] as const) {
      const markup = renderToStaticMarkup(
        <SheetAddSub
          tasks={[{ op, terms: op === "add" ? [24, 37] : [83, 26], decs: [0, 0] }]}
          answers={false}
          ownSetup={false}
        />,
      );

      expect(markup).toContain("grid-template-columns:repeat(9, minmax(0, 1fr))");
      expect(markup).toContain("grid-template-rows:repeat(8, minmax(0, 1fr))");
      expect(markup.match(/class="addsub-cell"/g)).toHaveLength(73);
    }
  });

  it("keeps the 9 by 8 blank grid option limited to addition and subtraction", () => {
    for (const op of ["add", "sub"] as const) {
      const withGrid = renderToStaticMarkup(
        <SheetAddSub
          tasks={[{ op, terms: op === "add" ? [24, 37] : [83, 26], decs: [0, 0] }]}
          answers={false}
          ownSetup
          ownGrid
        />,
      );
      const withoutGrid = renderToStaticMarkup(
        <SheetAddSub
          tasks={[{ op, terms: op === "add" ? [24, 37] : [83, 26], decs: [0, 0] }]}
          answers={false}
          ownSetup
          ownGrid={false}
        />,
      );

      expect(withGrid).toContain("addsub-box--own addsub-box--grid");
      expect(withoutGrid).toContain("addsub-box--own");
      expect(withoutGrid).not.toContain("addsub-box--grid");
    }
  });
});
