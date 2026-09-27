import type { MulTask } from "@/lib/worksheets";

/** Snabba tal multiplikation: 4 olika övningar per A4 (2×2),
 *  var och en med namnrad och 10 uppgifter. */
export function SheetSnabba({
  exercises,
  answers,
}: {
  exercises: MulTask[][];
  answers: boolean;
}) {
  return (
    <div className="a4-page flex flex-col">
      <h1 className="font-display text-center text-xl font-semibold tracking-wide text-sheet-ink">
        {answers ? "Snabba tal – Facit" : "Snabba tal"}
      </h1>
      <p className="mt-0.5 text-center text-xs text-sheet-ink/70">Multiplikation</p>
      <div className="mt-4 grid flex-1 grid-cols-2 grid-rows-2 gap-[6mm]">
        {exercises.map((tasks, ei) => (
          <section
            key={ei}
            className="flex flex-col rounded-md border border-sheet-grid p-[4mm]"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <div className="mb-[3mm] flex items-end gap-2 text-sm text-sheet-ink">
              <span>Namn:</span>
              <span className="flex-1 border-b border-sheet-line">{"\u00a0"}</span>
            </div>
            <ol className="flex flex-1 flex-col justify-between">
              {tasks.map((t, ti) => (
                <li
                  key={ti}
                  className="flex items-end font-mono text-[16px] leading-none tabular-nums text-sheet-ink"
                >
                  <span className="w-7 text-right">{t.a}</span>
                  <span className="w-5 text-center">·</span>
                  <span className="w-7 text-left">{t.b}</span>
                  <span className="w-5 text-center">=</span>
                  <span className="ml-1 flex-1 border-b border-sheet-line pb-[1px] text-left">
                    {answers ? (
                      <span className="font-bold text-sheet-answer">{t.a * t.b}</span>
                    ) : (
                      "\u00a0"
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
