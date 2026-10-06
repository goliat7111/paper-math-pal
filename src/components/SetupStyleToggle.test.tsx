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

  it("places a Clean toggle beside the setup style button", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle ownSetup onChange={() => {}} />);
    const setupIndex = markup.indexOf(">Uppst.</button>");
    const cleanIndex = markup.indexOf(">Clean</button>");

    expect(setupIndex).toBeGreaterThan(-1);
    expect(cleanIndex).toBeGreaterThan(setupIndex);
    expect(markup).toContain('aria-pressed="false"');
  });

  it("can show Clean without a setup-style toggle for other twelve-task worksheets", () => {
    const markup = renderToStaticMarkup(<SetupStyleToggle showSetupStyle={false} showClean />);

    expect(markup).toContain(">Clean</button>");
    expect(markup).not.toContain(">Uppst.</button>");
    expect(markup).not.toContain(">Ej uppst.</button>");
  });

  it("reflects the controlled Clean selection", () => {
    const markup = renderToStaticMarkup(
      <SetupStyleToggle showSetupStyle={false} clean onCleanChange={() => {}} />,
    );

    expect(markup).toContain('aria-pressed="true"');
  });

  it("can hide Clean when the selected worksheet does not have twelve tasks", () => {
    const markup = renderToStaticMarkup(
      <SetupStyleToggle ownSetup onChange={() => {}} showClean={false} />,
    );

    expect(markup).toContain(">Uppst.</button>");
    expect(markup).not.toContain(">Clean</button>");
  });
});
