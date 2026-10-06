export function SetupStyleToggle({
  ownSetup,
  onChange,
}: {
  ownSetup: boolean;
  onChange: (ownSetup: boolean) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Utformning av elevblad</legend>
      <button
        type="button"
        aria-pressed={ownSetup}
        aria-label={ownSetup ? "Växla till uppställning" : "Växla till Ej uppst."}
        onClick={() => onChange(!ownSetup)}
        className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
      >
        {ownSetup ? "Uppst." : "Ej uppst."}
      </button>
    </fieldset>
  );
}
