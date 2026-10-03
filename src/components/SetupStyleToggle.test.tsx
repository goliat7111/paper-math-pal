import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupStyleToggle } from "./SetupStyleToggle";

describe("SetupStyleToggle", () => {
  it("offers the blank-box choice when a ready-made setup is active", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle ownSetup={false} onChange={() => {}} />);

    expect(markup).toContain('aria-label="Växla till tom ruta"');
    expect(markup).toContain(">Tom ruta</button>");
  });

  it("offers the setup choice when a blank box is active", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle ownSetup onChange={() => {}} />);

    expect(markup).toContain('aria-label="Växla till uppställning"');
    expect(markup).toContain(">Uppst.</button>");
  });
});
