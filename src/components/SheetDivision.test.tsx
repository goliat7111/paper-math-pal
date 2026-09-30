import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { genDivisionProgression } from "../lib/division-complexity";
import { SheetDivision } from "./SheetDivision";

describe("Progressionsserie på arbetsblad", () => {
  it("behåller ordning och numrering över två sidor i båda uppställningarna", () => {
    const tasks = genDivisionProgression(() => 0);
    for (const ownSetup of [true, false])
      for (const answers of [true, false]) {
        const pages = [0, 6].map((startIndex) =>
          renderToStaticMarkup(
            <SheetDivision
              tasks={tasks.slice(startIndex, startIndex + 6)}
              answers={answers}
              ownSetup={ownSetup}
              progression
              startIndex={startIndex}
            />,
          ),
        );
        expect(pages[0]!.match(/class="own-setup-task"/g)).toHaveLength(6);
        expect(pages[1]!.match(/class="own-setup-task"/g)).toHaveLength(4);
        expect(pages[1]).toContain('aria-label="Uppgift 9"');
        expect(pages[1]).toContain('aria-label="Uppgift 10"');
        expect(pages[1]).toContain("Progressionsserie");
        expect(pages[1]!.includes(tasks[9]!.note!)).toBe(answers);
        if (answers) expect(pages[1]).toContain(`rest ${tasks[9]!.remainder}`);
      }
  });
});
