export type NumberBase = 2 | 4 | 16;
export type ConversionDirection = "to-base" | "to-decimal";
export type ConversionMode = ConversionDirection | "both";

export type NumberSystemTask = {
  value: number;
  direction: ConversionDirection;
};

export function formatBaseValue(value: number, base: NumberBase): string {
  return value.toString(base).toUpperCase();
}

export function genNumberSystemTasks(
  count = 20,
  mode: ConversionMode = "both",
  maxValue = 255,
): NumberSystemTask[] {
  if (!Number.isInteger(count) || count < 1 || count > 40
    || !Number.isInteger(maxValue) || maxValue < 1 || maxValue > 65535
    || (mode !== "both" && mode !== "to-base" && mode !== "to-decimal")) {
    throw new Error("Välj 1–40 uppgifter och ett största decimaltal mellan 1 och 65535.");
  }
  if (mode === "both" && count > maxValue * 2) {
    throw new Error("Det finns inte tillräckligt många olika tal för båda omvandlingsriktningarna.");
  }
  if (mode !== "both" && count > maxValue) {
    throw new Error("Det finns inte tillräckligt många olika tal i det valda talområdet.");
  }
  const tasks: NumberSystemTask[] = [];
  const seen = new Set<string>();
  while (tasks.length < count) {
    const direction = mode === "both" ? (tasks.length % 2 === 0 ? "to-base" : "to-decimal") : mode;
    const value = 1 + Math.floor(Math.random() * maxValue);
    const key = `${direction}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push({ value, direction });
  }
  return tasks;
}

export function solveNumberSystemTask(task: NumberSystemTask, base: NumberBase): string {
  return task.direction === "to-base" ? formatBaseValue(task.value, base) : String(task.value);
}
