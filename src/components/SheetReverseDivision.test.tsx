import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { genReverseDivision } from "@/lib/reverse-division";
import { SheetReverseDivision } from "./SheetReverseDivision";

describe("Arbetsblad för omvänd multiplikation", () => {
  it("visar samma uppgifter med luckor på elevbladet och ifyllda värden i facit", () => {
    const tasks = genReverseDivision();
    const sheet = renderToStaticMarkup(<SheetReverseDivision tasks={tasks} answers={false} />);
    const key = renderToStaticMarkup(<SheetReverseDivision tasks={tasks} answers />);
    expect(sheet.match(/class="reverse-division-task"/g)).toHaveLength(60);
    expect(key.match(/class="reverse-division-task"/g)).toHaveLength(60);
    expect(sheet.match(/class="reverse-division-blank"/g)).toHaveLength(60);
    expect(key.match(/class="reverse-division-blank"/g)).toHaveLength(60);
    for (const markup of [sheet, key]) {
      const columns = markup.split('class="reverse-division-column"').slice(1);
      expect(columns).toHaveLength(4);
      expect(
        columns.map((column) => column.match(/class="reverse-division-task"/g)?.length),
      ).toEqual([15, 15, 15, 15]);
      expect(markup.match(/class="reverse-division-empty"/g)).toBeNull();
    }
    for (const task of tasks) {
      const missing = task.missing === "divisor" ? task.divisor : task.quotient;
      expect(key).toContain(`class="reverse-division-blank">${missing}</span>`);
    }
    expect(sheet).toContain("av 60");
    expect(key).toContain("Omvänd multiplikation – Facit");
  });
});
