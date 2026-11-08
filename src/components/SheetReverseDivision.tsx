import type { ReverseDivisionTask } from "@/lib/reverse-division";
import { SheetHeader } from "./SheetHeader";

export function SheetReverseDivision({
  tasks,
  answers,
}: {
  tasks: ReverseDivisionTask[];
  answers: boolean;
}) {
  const columnCount = 4;
  const rows = Math.ceil(tasks.length / columnCount);
  const baseCount = Math.floor(tasks.length / columnCount);
  const remainder = tasks.length % columnCount;
  const columns = Array.from({ length: columnCount }, (_, column) => {
    const count = baseCount + (column < remainder ? 1 : 0);
    const start = column * baseCount + Math.min(column, remainder);
    return { start, tasks: tasks.slice(start, start + count) };
  });
  return (
    <div className="a4-page reverse-division-page">
      <SheetHeader
        title={answers ? "Omvänd multiplikation – Facit" : "Omvänd multiplikation"}
        subtitle="Division · 6 minuter"
        score={`av ${tasks.length}`}
        compact
      />
      <div className="reverse-division-grid">
        {columns.map((column, columnIndex) => (
          <div
            className="reverse-division-column"
            key={columnIndex}
            style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
          >
            {column.tasks.map((task, index) => (
              <div
                className="reverse-division-task"
                key={index}
                aria-label={`Uppgift ${column.start + index + 1}: ${task.dividend} delat med ${task.missing === "divisor" && !answers ? "lucka" : task.divisor} är ${task.missing === "quotient" && !answers ? "lucka" : task.quotient}`}
              >
                <span className="reverse-division-fraction">
                  <span className="reverse-division-numerator">{task.dividend}</span>
                  <span className="reverse-division-denominator">
                    <span className={task.missing === "divisor" ? "reverse-division-blank" : ""}>
                      {task.missing !== "divisor" || answers ? task.divisor : "\u00a0"}
                    </span>
                  </span>
                </span>
                <span className="reverse-division-equals">=</span>
                <span className="reverse-division-quotient">
                  <span className={task.missing === "quotient" ? "reverse-division-blank" : ""}>
                    {task.missing !== "quotient" || answers ? task.quotient : "\u00a0"}
                  </span>
                </span>
              </div>
            ))}
            {Array.from({ length: rows - column.tasks.length }, (_, index) => (
              <div className="reverse-division-empty" aria-hidden="true" key={`empty-${index}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
