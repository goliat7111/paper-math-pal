import { SheetHeader } from "./SheetHeader";

const groups = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / 5) }, (_, index) =>
    items.slice(index * 5, index * 5 + 5),
  );

export type HundredTask = {
  left: string;
  operator: string;
  right: string;
  answer: string;
  blank?: "left" | "right";
  result?: string;
};

export function SheetHundred({
  tasks,
  operation,
  answers,
  sheetTitle = "100 tal",
  alignUnits = false,
  alignOperands = false,
  tenFriendsLayout = false,
  divisionQuick = false,
}: {
  tasks: HundredTask[];
  operation: string;
  answers: boolean;
  sheetTitle?: string;
  alignUnits?: boolean;
  alignOperands?: boolean;
  tenFriendsLayout?: boolean;
  divisionQuick?: boolean;
}) {
  const columnSize = Math.ceil(tasks.length / 4);
  const columns = Array.from({ length: 4 }, (_, index) =>
    tasks.slice(index * columnSize, (index + 1) * columnSize),
  );
  const hasFillInTasks = tasks.some((task) => task.blank);
  return (
    <div
      className={`a4-page hundred-tasks-page${hasFillInTasks ? " hundred-tasks-page--fill-in" : ""}${alignUnits ? " hundred-tasks-page--align-units" : ""}${alignOperands ? " hundred-tasks-page--align-operands" : ""}${tenFriendsLayout ? " hundred-tasks-page--ten-friends-layout" : ""}${divisionQuick ? " hundred-tasks-page--division-quick" : ""}`}
    >
      <SheetHeader
        title={answers ? `${sheetTitle} – Facit` : sheetTitle}
        subtitle={`${operation} · 6 minuter`}
        score={`av ${tasks.length}`}
        compact
      />
      <div className="hundred-tasks-grid">
        {columns.map((column, columnIndex) => (
          <div className="hundred-tasks-column" key={columnIndex}>
            {groups(column).map((group, groupIndex) => (
              <div
                className={`hundred-tasks-group${group.some((task) => task.blank) ? " hundred-tasks-group--fill-in" : ""}${groupIndex > 0 && group.some((task) => task.blank) && !tenFriendsLayout ? " hundred-tasks-group--fill-in-divider" : ""}${alignUnits ? " hundred-tasks-group--spaced" : ""}${alignUnits && groupIndex > 0 ? " hundred-tasks-group--spaced-divider" : ""}${tenFriendsLayout ? " hundred-tasks-group--ten-friends" : ""}${tenFriendsLayout && groupIndex > 0 ? " hundred-tasks-group--ten-friends-divider" : ""}`}
                key={groupIndex}
                data-task-count={group.length}
              >
                {group.map((task, rowIndex) => (
                  <div
                    className={`hundred-task${task.blank ? " hundred-task-fill-in" : ""}`}
                    key={rowIndex}
                  >
                    <span
                      className={`hundred-task-left${task.blank === "left" ? " hundred-task-blank" : ""}`}
                    >
                      {task.blank === "left" && !answers
                        ? "\u00a0"
                        : task.blank === "left" && answers
                          ? task.answer
                          : task.left}
                    </span>
                    <span className="hundred-task-operator">{task.operator}</span>
                    <span
                      className={`hundred-task-right${task.blank === "right" ? " hundred-task-blank" : ""}`}
                    >
                      {task.blank === "right" && !answers
                        ? "\u00a0"
                        : task.blank === "right" && answers
                          ? task.answer
                          : task.right}
                    </span>
                    <span className="hundred-task-equals">=</span>
                    <span
                      className={`hundred-task-answer${task.result ? " hundred-task-result" : ""}${task.blank ? " hundred-task-fixed-result" : ""}`}
                    >
                      {task.result !== undefined ? (
                        task.result
                      ) : answers ? (
                        <strong>{task.answer}</strong>
                      ) : (
                        "\u00a0"
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        {tenFriendsLayout && (
          <div className="hundred-tasks-full-dividers" aria-hidden="true">
            {[1, 2, 3].map((divider) => (
              <span
                className={`hundred-tasks-full-divider hundred-tasks-full-divider--${divider}`}
                key={divider}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
