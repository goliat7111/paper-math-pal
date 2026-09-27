import { chunk, type MulTask } from "@/lib/worksheets";
import { SheetHeader } from "./SheetHeader";

// Block om 5 uppgifter (sista blocket fylls ut); t.ex. 34 rader → 5×6 + 4
const blockSizes = (rows: number) => {
  const sizes: number[] = [];
  let left = rows;
  while (left > 0) {
    sizes.push(Math.min(5, left));
    left -= 5;
  }
  return sizes;
};

export function Sheet102({
  tasks,
  answers,
  orientation = "portrait",
}: {
  tasks: MulTask[];
  answers: boolean;
  orientation?: "portrait" | "landscape";
}) {
  const landscape = orientation === "landscape";
  const cols = landscape ? 6 : 3;
  const perCol = Math.ceil(tasks.length / cols); // 17 (liggande) / 34 (stående)
  const columns = Array.from({ length: cols }, (_, c) =>
    tasks.slice(c * perCol, (c + 1) * perCol),
  );
  return (
    <div className={`a4-page${landscape ? " landscape" : ""}`}>
      <SheetHeader title={answers ? "102 tal – Facit" : "102 tal"} subtitle="Multiplikation · 6 minuter" score="av 102" />
      <div
        className="mt-5 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: landscape ? "8mm" : "12mm" }}
      >
        {columns.map((col, ci) => (
          <div key={ci}>
            {chunk(col, blockSizes(col.length)).map((block, bi) => (
              <div key={bi} className={bi === 0 ? "" : "mt-[7mm]"}>
                {block.map((t, ti) => (
                  <div key={ti} className="flex h-[6.4mm] items-end font-mono text-[15px] leading-none tabular-nums">
                    <span className="w-6 text-right">{t.a}</span>
                    <span className="w-5 text-center">·</span>
                    <span className="w-6 text-left">{t.b}</span>
                    <span className="w-5 text-center">=</span>
                    <span className="ml-1 flex-1 border-b border-sheet-line pb-[1px] text-left">
                      {answers ? <span className="font-bold text-sheet-answer">{t.a * t.b}</span> : "\u00a0"}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
