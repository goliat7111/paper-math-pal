import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Problem } from "./SheetSetup";

describe("Problem", () => {
  it("shows multiplication and addition carries in the answer key for multi-digit factors", () => {
    const markup = renderToStaticMarkup(
      <Problem n={1} t={{ digits: [9, 9], m: [9, 9] }} answers digitMm={5.5} showNumber={false} />,
    );

    expect(markup).toMatch(/grid-row:4;height:4mm">8<\/div>/);
    expect(markup).toMatch(/grid-row:7;height:4mm">1<\/div>/);
  });
});
