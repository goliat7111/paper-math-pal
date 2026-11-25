import { SheetHeader } from "./SheetHeader";

const groups = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / 5) }, (_, index) =>
    items.slice(index * 5, index * 5 + 5),
  );

export type HundredTask = {
  left: string;
  operator: string;
  right: string;
  third?: string;
  answer: string;
  blank?: "left" | "right" | "third";
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
  friendsLayout = false,
  subtitle,
}: {
  tasks: HundredTask[];
  operation: string;
  answers: boolean;
  sheetTitle?: string;
  alignUnits?: boolean;
  alignOperands?: boolean;
  tenFriendsLayout?: boolean;
  divisionQuick?: boolean;
  friendsLayout?: boolean;
  subtitle?: string;
}) {
  const threeTermFriends = friendsLayout && tasks.some((task) => task.third !== undefined);
  const columnCount = friendsLayout ? (threeTermFriends ? 2 : 3) : 4;
  const columnSize = Math.ceil(tasks.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, index) => {
    if (!friendsLayout) return tasks.slice(index * columnSize, (index + 1) * columnSize);
    const base = Math.floor(tasks.length / columnCount);
    const extra = tasks.length % columnCount;
    const start = index * base + Math.min(index, extra);
    return tasks.slice(start, start + base + (index < extra ? 1 : 0));
  });
  const hasFillInTasks = tasks.some((task) => task.blank);
  return (
    <div
      className={`a4-page hundred-tasks-page${hasFillInTasks ? " hundred-tasks-page--fill-in" : ""}${alignUnits ? " hundred-tasks-page--align-units" : ""}${alignOperands ? " hundred-tasks-page--align-operands" : ""}${tenFriendsLayout ? " hundred-tasks-page--ten-friends-layout" : ""}${divisionQuick ? " hundred-tasks-page--division-quick" : ""}${friendsLayout ? " hundred-tasks-page--friends" : ""}`}
      data-friends-size={
        friendsLayout
          ? tasks.length <= 36
            ? "large"
            : tasks.length <= 42
              ? "medium"
              : "small"
          : undefined
      }
      data-friends-columns={friendsLayout ? columnCount : undefined}
      data-friends-three-terms={threeTermFriends ? "true" : undefined}
      data-friends-subtraction={friendsLayout && operation === "Subtraktion" ? "true" : undefined}
    >
      <SheetHeader
        title={answers ? `${sheetTitle} – Facit` : sheetTitle}
        subtitle={subtitle ?? `${operation} · 6 minuter`}
        score={`av ${tasks.length}`}
        compact
      />
      <div className="hundred-tasks-grid">
        {columns.map((column, columnIndex) => (
          <div
            className="hundred-tasks-column"
            key={columnIndex}
            style={
              friendsLayout
                ? { gridTemplateRows: `repeat(${columnSize}, minmax(0, 1fr))` }
                : undefined
            }
          >
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
                    {task.third !== undefined && (
                      <>
                        <span className="hundred-task-operator">{task.operator}</span>
                        <span
                          className={`hundred-task-third${task.blank === "third" ? " hundred-task-blank" : ""}`}
                        >
                          {task.blank === "third" && !answers
                            ? "\u00a0"
                            : task.blank === "third" && answers
                              ? task.answer
                              : task.third}
                        </span>
                      </>
                    )}
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
