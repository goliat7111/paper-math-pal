import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddSubSetup } from "./SheetAddSub";

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
});
