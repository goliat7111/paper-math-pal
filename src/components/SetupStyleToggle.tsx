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
        aria-label={ownSetup ? "Växla till uppställning" : "Växla till tom ruta"}
        onClick={() => onChange(!ownSetup)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
          ownSetup ? "bg-green-700 hover:bg-green-800" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {ownSetup ? "Uppst." : "Tom ruta"}
      </button>
    </fieldset>
  );
}
