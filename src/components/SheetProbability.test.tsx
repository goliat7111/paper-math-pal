import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetProbability } from "./SheetProbability";

describe("SheetProbability", () => {
  it("renders eight bottle experiments with four recording rows", () => {
    const markup = renderToStaticMarkup(<SheetProbability protocol="bottles" />);
    expect(markup).toContain("Skaka flaska A");
    expect(markup).toContain("Skaka flaska H");
    expect(markup.match(/scope="row"/g)).toHaveLength(32);
    expect(markup).toContain("landscape");
  });

  it("includes the coin and dice experiments from the workbook", () => {
    const coins = renderToStaticMarkup(<SheetProbability protocol="coins" />);
    const dice = renderToStaticMarkup(<SheetProbability protocol="dice" />);
    expect(coins).toContain("Kasta ett mynt");
    expect(coins).toContain("Krona–klave");
    expect(dice).toContain("Slå en tärning");
    expect(dice).toContain("Slå två tärningar");
    expect(dice).toContain("12");
  });
});
