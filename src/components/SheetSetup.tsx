import { Fragment, useEffect, useRef, useState } from "react";
import { evenRowGap, fitGridCount, setupLayout, type SetupTask } from "@/lib/worksheets";
import { SheetHeader } from "./Sheet102";

// Sifferkolumnernas bredd och rutnätets mellanrum anpassas efter längsta talet
const colsFor = (tasks: SetupTask[]) => Math.max(...tasks.map((t) => setupLayout(t).nCols));
const digitMM = (cols: number) => (cols >= 7 ? 6 : cols >= 6 ? 7 : cols >= 5 ? 7.5 : cols >= 4 ? 8 : 9);
const gapMM = (cols: number) => (cols >= 6 ? 4 : cols >= 5 ? 6 : cols >= 4 ? 10 : 14);
const MM_PX = 96 / 25.4; // CSS: 1mm = 96/25.4 px
const SAFETY_MM = 2; // litet säkerhetsmått för fonter/avrundning

export type SetupFit = { cols: number; rows: number; count: number; gapMM: number };

const digitLabel = (range: [number, number], singular: string, plural: string) => {
  const [lo, hi] = [...range].sort((a, b) => a - b);
  return lo === hi ? `${lo}-${singular}` : `${lo}–${hi} ${plural}`;
};

export function SheetSetup({
  tasks,
  answers,
  topDigits,
  bottomDigits,
  orientation = "portrait",
  onFit,
}: {
  tasks: SetupTask[];
  answers: boolean;
  topDigits: [number, number];
  bottomDigits: [number, number];
  orientation?: "portrait" | "landscape";
  onFit?: (fit: SetupFit) => void;
}) {
  const maxCols = colsFor(tasks);
  const digitMm = digitMM(maxCols);
  const colGapMm = gapMM(maxCols);
  const multi = tasks.some((t) => t.m.length > 1);
  const rowGapMm = multi ? 8 : 12;
  const landscape = orientation === "landscape";

  // Fyll sidan: fler uppgifter när talen är små; mellanrummen fördelas jämnt
  const pageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<SetupFit | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    const grid = gridRef.current;
    const first = grid?.firstElementChild as HTMLElement | null;
    if (!page || !grid || !first) return;
    const ps = getComputedStyle(page);
    // A4-höjden är fix (297/210 mm): sidan får inte växa med innehållet,
    // annars mäts "tillgängligt utrymme" av ett överfullt blad och
    // sidfyllnaden hamnar utanför pappret.
    const pageHMM = landscape ? 210 : 297;
    const availMM =
      pageHMM -
      parseFloat(ps.paddingTop) -
      parseFloat(ps.paddingBottom) -
      (grid.getBoundingClientRect().top - page.getBoundingClientRect().top) / MM_PX -
      SAFETY_MM;
    const innerWMM =
      (page.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)) / MM_PX;
    const wMM = first.offsetWidth / MM_PX;
    const hMM = first.offsetHeight / MM_PX;
    const { cols, rows, count } = fitGridCount(
      innerWMM,
      availMM,
      wMM,
      hMM,
      colGapMm,
      rowGapMm,
      tasks.length,
    );
    const next: SetupFit = {
      cols,
      rows,
      count,
      gapMM: evenRowGap(availMM, rows, hMM, rowGapMm),
    };
    setFit((prev) =>
      prev &&
      prev.cols === next.cols &&
      prev.rows === next.rows &&
      prev.count === next.count &&
      Math.abs(prev.gapMM - next.gapMM) < 0.01
        ? prev
        : next,
    );
    onFit?.(next);
  }); // kör efter varje rendering tills måttet stabiliserats

  const initial = Math.min(12, tasks.length);
  const shown = tasks.slice(0, fit ? fit.count : initial);
  const cols = fit ? fit.cols : 3;

  return (
    <div ref={pageRef} className={`a4-page${landscape ? " landscape" : ""}`}>
      <SheetHeader
        title={answers ? "Multiplikation – Facit" : "Multiplikation"}
        subtitle={`Uppställning · ${digitLabel(topDigits, "siffrigt tal", "siffror")} · ${digitLabel(bottomDigits, "siffrig faktor", "siffror")}`}
        score={`av ${shown.length}`}
      />
      <div
        ref={gridRef}
        className="mt-8 grid justify-items-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: `${colGapMm}mm`,
          rowGap: `${fit ? fit.gapMM : rowGapMm}mm`,
        }}
      >
        {shown.map((t, i) => (
          <Problem key={i} n={i + 1} t={t} answers={answers} digitMm={digitMm} />
        ))}
      </div>
    </div>
  );
}

function Problem({
  n,
  t,
  answers,
  digitMm,
}: {
  n: number;
  t: SetupTask;
  answers: boolean;
  digitMm: number;
}) {
  const L = setupLayout(t);
  const gridCols = `repeat(${L.nCols}, ${digitMm}mm) 14mm`;
  const cellH = `${digitMm}mm`;
  const multi = L.partialRows.length > 0;
  const productRowIdx = 3 + L.partialRows.length;

  // Teckenrad: × plus den undre faktorn högerställd mot ental
  const signRow = L.bottomRow.map((c, i) => (i === L.signCol ? "×" : c));

  const carryBox = (carries: number[], row: string | number) => (
    <div
      className="flex flex-col items-center justify-center gap-[1px] border border-sheet-grid"
      style={{ gridColumn: L.nCols + 1, gridRow: row, minHeight: cellH }}
    >
      {answers &&
        carries.map((c, i) => (
          <div key={i} className="text-[11px] font-bold leading-none text-sheet-answer">
            {c}
          </div>
        ))}
    </div>
  );

  return (
    <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
      <div className="mb-1 text-[11px] font-semibold text-sheet-muted">{n})</div>
      <div className="grid-sheet" style={{ gridTemplateColumns: gridCols }}>
        {/* Rad 1: övre faktorn */}
        {L.topRow.map((c, i) => (
          <Cell key={`t${i}`} v={c} col={i + 1} row={1} height={cellH} />
        ))}
        {/* Ensiffrig faktor: minnesrutan spänner över rad 1–2 */}
        {!multi && carryBox(L.carries, "1 / span 2")}
        {/* Rad 2: teckenrad med understrykning */}
        {signRow.map((c, i) => (
          <Cell key={`s${i}`} v={c} col={i + 1} row={2} height={cellH} underline />
        ))}
        {/* Delprodukter, var och en med egen minnesruta */}
        {L.partialRows.map((p, r) => (
          <Fragment key={`par${r}`}>
            {p.cells.map((c, i) => (
              <Cell
                key={`p${r}-${i}`}
                v={answers ? c : ""}
                col={i + 1}
                row={3 + r}
                height={cellH}
                answer={answers}
              />
            ))}
            {carryBox(p.carries, 3 + r)}
          </Fragment>
        ))}
        {/* Produkten, med streck ovanför när det finns delprodukter */}
        {L.productRow.map((c, i) => (
          <Cell
            key={`pr${i}`}
            v={answers ? c : ""}
            col={i + 1}
            row={productRowIdx}
            height={cellH}
            answer={answers}
            rule={multi}
          />
        ))}
      </div>
    </div>
  );
}

function Cell({
  v,
  col,
  row,
  height,
  underline,
  answer,
  rule,
}: {
  v: string;
  col: number;
  row: number;
  height: string;
  underline?: boolean;
  answer?: boolean;
  rule?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center border border-sheet-grid font-mono tabular-nums text-[20px] text-sheet-ink",
        underline ? "border-b-2 border-b-sheet-ink" : "",
        answer ? "font-bold text-sheet-answer" : "",
      ].join(" ")}
      style={{
        gridColumn: col,
        gridRow: row,
        height,
        ...(rule ? { borderTop: "2px solid var(--sheet-ink)" } : {}),
      }}
    >
      {v.trim() || "\u00a0"}
    </div>
  );
}
