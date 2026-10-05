export type PrintContent = "both" | "sheet" | "key";

const OPTIONS: { value: PrintContent; label: string }[] = [
  { value: "sheet", label: "Bara elevblad" },
  { value: "key", label: "Bara facit" },
  { value: "both", label: "Elevblad + facit" },
];

export const showSheet = (c: PrintContent) => c !== "key";
export const showKey = (c: PrintContent) => c !== "sheet";
export const pagesLabel = (c: PrintContent) =>
  c === "both" ? "2 sidor (blad + facit)" : c === "sheet" ? "1 sida (bladet)" : "1 sida (facit)";
export const keySuffix = (c: PrintContent) => (c === "key" ? "-facit" : "");

/** Val av vad som skrivs ut / exporteras: elevblad, facit eller båda. */
export function PrintContentChoice({
  value,
  onChange,
}: {
  value: PrintContent;
  onChange: (v: PrintContent) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">Skriv ut / spara</legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-7 rounded-md border px-3 text-xs font-semibold ${value === o.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:bg-accent"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
