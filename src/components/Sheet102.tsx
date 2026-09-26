import { chunk, type MulTask } from "@/lib/worksheets";

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
              <div key={bi} className="mb-[3.2mm]">
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

export function SheetHeader({ title, subtitle, score }: { title: string; subtitle: string; score?: string }) {
  return (
    <div className="border-b-2 border-sheet-ink pb-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[22px] font-semibold text-sheet-ink">{title}</h2>
        <span className="text-[12px] uppercase tracking-widest text-sheet-muted">{subtitle}</span>
      </div>
      <div className="mt-3 flex gap-6 text-[13px] text-sheet-ink">
        <Field label="Namn" grow />
        <Field label="Datum" w="32mm" />
        {score && (
          <div className="flex items-end gap-2">
            <span>Poäng:</span>
            <span className="inline-block w-[14mm] border-b border-sheet-ink" />
            <span>{score}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, grow, w }: { label: string; grow?: boolean; w?: string }) {
  return (
    <div className={`flex items-end gap-2 ${grow ? "flex-1" : ""}`}>
      <span>{label}:</span>
      <span className="inline-block flex-1 border-b border-sheet-ink" style={w ? { width: w, flex: "none" } : undefined} />
    </div>
  );
}
