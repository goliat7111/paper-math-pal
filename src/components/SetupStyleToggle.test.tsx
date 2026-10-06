import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupStyleToggle } from "./SetupStyleToggle";

describe("SetupStyleToggle", () => {
  it("offers the blank-box choice when a ready-made setup is active", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle ownSetup={false} onChange={() => {}} />);

    expect(markup).toContain('aria-label="Växla till Ej uppst."');
    expect(markup).toContain(">Ej uppst.</button>");
  });

  it("offers the setup choice when a blank box is active", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle ownSetup onChange={() => {}} />);

    expect(markup).toContain('aria-label="Växla till uppställning"');
    expect(markup).toContain(">Uppst.</button>");
  });

  it("keeps the same button color in both modes", () => {
    const blankBox = renderToStaticMarkup(
      <SetupStyleToggle ownSetup={false} onChange={() => {}} />,
    );
    const setup = renderToStaticMarkup(<SetupStyleToggle ownSetup onChange={() => {}} />);
    const buttonClass =
      "rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800";

    expect(blankBox).toContain(buttonClass);
    expect(setup).toContain(buttonClass);
  });
});
