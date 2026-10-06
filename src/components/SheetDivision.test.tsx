import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { genDivisionProgression } from "../lib/division-complexity";
import { SheetDivision } from "./SheetDivision";

describe("Progressionsserie på arbetsblad", () => {
  it("renders clean continuation pages without repeating the header", () => {
    const markup = renderToStaticMarkup(
      <SheetDivision
        tasks={Array.from({ length: 6 }, (_, index) => ({
          dividend: index + 26,
          divisor: 2,
          quotient: (index + 26) / 2,
          remainder: 0,
        }))}
        answers={false}
        ownSetup
        clean
        showHeader={false}
        startIndex={6}
        scoreTotal={12}
      />,
    );

    expect(markup.match(/class="own-setup-task"/g)).toHaveLength(6);
    expect(markup).not.toContain("Division</h2>");
    expect(markup).toContain("Uppgift 7");
    expect(markup).toContain("26 / 2");
    expect(markup).not.toContain("exercise-twelve-box");
  });

  it("uses the shared low comma position in division cells", () => {
    const markup = renderToStaticMarkup(
      <SheetDivision
        tasks={[
          {
            dividend: 125,
            divisor: 5,
            quotient: 25,
            remainder: 0,
            dividendDecimals: 1,
            quotientDecimals: 1,
          },
        ]}
        answers
        ownSetup={false}
      />,
    );

    expect(markup.match(/class="worksheet-comma"/g)).toHaveLength(1);
  });

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
        expect(pages[1]!.match(/class="own-setup-task"/g)).toHaveLength(6);
        expect(pages[1]).toContain('aria-label="Uppgift 9"');
        expect(pages[1]).toContain('aria-label="Uppgift 10"');
        expect(pages[1]).toContain('aria-label="Uppgift 11"');
        expect(pages[1]).toContain('aria-label="Uppgift 12"');
        expect(pages[1]).toContain("Progressionsserie");
        expect(pages[1]!.includes(tasks[9]!.note!)).toBe(answers);
        expect(pages[1]!.includes(tasks[10]!.note!)).toBe(answers);
        expect(pages[1]!.includes(tasks[11]!.note!)).toBe(answers);
        expect(tasks.slice(9, 12).every((task) => task.remainder === 0)).toBe(true);
        if (answers) expect(pages[1]).not.toContain("rest 0");
      }
  });
});
