import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SheetNumberSystems } from "./SheetNumberSystems";

describe("SheetNumberSystems", () => {
  it("shows base conversions and uses the correct hexadecimal key", () => {
    const tasks = [
      { value: 255, direction: "to-base" as const },
      { value: 254, direction: "to-decimal" as const },
    ];
    const sheet = renderToStaticMarkup(
      <SheetNumberSystems tasks={tasks} base={16} answers={false} />,
    );
    const key = renderToStaticMarkup(<SheetNumberSystems tasks={tasks} base={16} answers />);
    expect(sheet).toContain("255₁₀");
    expect(sheet).toContain("FE₁₆");
    expect(key).toContain("<strong>FF₁₆</strong>");
    expect(key).toContain("<strong>254₁₀</strong>");
  });
});
