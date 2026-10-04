import { SheetHeader } from "./SheetHeader";

const groups = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / 5) }, (_, index) => items.slice(index * 5, index * 5 + 5));

export type HundredTask = {
  left: string;
  operator: string;
  right: string;
  answer: string;
};

export function SheetHundred({ tasks, operation, answers }: {
  tasks: HundredTask[];
  operation: string;
  answers: boolean;
}) {
  const columns = Array.from({ length: 4 }, (_, index) => tasks.slice(index * 25, (index + 1) * 25));
  return (
    <div className="a4-page hundred-tasks-page">
      <SheetHeader
        title={answers ? "100 tal – Facit" : "100 tal"}
        subtitle={`${operation} · 6 minuter`}
        score={`av ${tasks.length}`}
        compact
      />
      <div className="hundred-tasks-grid">
        {columns.map((column, columnIndex) => (
          <div className="hundred-tasks-column" key={columnIndex}>
            {groups(column).map((group, groupIndex) => (
              <div className="hundred-tasks-group" key={groupIndex}>
                {group.map((task, rowIndex) => (
                  <div className="hundred-task" key={rowIndex}>
                    <span className="hundred-task-left">{task.left}</span>
                    <span className="hundred-task-operator">{task.operator}</span>
                    <span className="hundred-task-right">{task.right}</span>
                    <span className="hundred-task-equals">=</span>
                    <span className="hundred-task-answer">{answers ? <strong>{task.answer}</strong> : "\u00a0"}</span>
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
