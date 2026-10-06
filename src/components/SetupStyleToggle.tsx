import { useState } from "react";

export function SetupStyleToggle({
  ownSetup,
  onChange,
  showSetupStyle = true,
  showClean = true,
  clean,
  onCleanChange,
}: {
  ownSetup?: boolean;
  onChange?: (ownSetup: boolean) => void;
  showSetupStyle?: boolean;
  showClean?: boolean;
  clean?: boolean;
  onCleanChange?: (clean: boolean) => void;
}) {
  const [localClean, setLocalClean] = useState(false);
  const isClean = clean ?? localClean;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Utformning av elevblad</legend>
      <div className="flex flex-wrap gap-2">
        {showSetupStyle && ownSetup !== undefined && onChange && (
          <button
            type="button"
            aria-pressed={ownSetup}
            aria-label={ownSetup ? "Växla till uppställning" : "Växla till Ej uppst."}
            onClick={() => onChange(!ownSetup)}
            className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
          >
            {ownSetup ? "Uppst." : "Ej uppst."}
          </button>
        )}
        {showClean && (
          <button
            type="button"
            aria-pressed={isClean}
            onClick={() => {
              if (onCleanChange) onCleanChange(!isClean);
              else setLocalClean(!isClean);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              isClean
                ? "bg-green-700 text-white hover:bg-green-800"
                : "border border-input bg-background text-foreground hover:bg-accent"
            }`}
          >
            Clean
          </button>
        )}
      </div>
    </fieldset>
  );
}
