import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SheetHeader } from "./SheetHeader";

describe("SheetHeader", () => {
  it.each([false, true])("keeps a 10 mm gap before the date (compact: %s)", (compact) => {
    const markup = renderToStaticMarkup(
      <SheetHeader title="Titel" subtitle="Undertitel" score="av 12" compact={compact} />,
    );

    expect(markup).toContain(
      'class="flex items-end gap-2 mr-[10mm] min-w-0 flex-1"><span>Namn:</span>',
    );
    expect(markup).toContain(`width:${compact ? "26mm" : "32mm"};flex:none`);
    expect(markup).toContain("Datum:");
    expect(markup).toContain("Poäng:");
    expect(markup).toContain("av 12");
    expect(markup).not.toContain("40mm");
  });
});
