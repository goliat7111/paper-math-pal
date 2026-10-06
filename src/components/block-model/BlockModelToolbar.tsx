import {
  Eraser,
  Hand,
  PenLine,
  Plus,
  Redo2,
  RotateCcw,
  Split,
  Type,
  Undo2,
  Variable,
} from "lucide-react";

type Tool = "select" | "pen";

type BlockModelToolbarProps = {
  activeTool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  canAddPart: boolean;
  placingText: boolean;
  unknownSymbol: string;
  onAddBlock: () => void;
  onAddPart: () => void;
  onAddText: () => void;
  onAddUnknown: () => void;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onClear: () => void;
  onTextChange: (text: string) => void;
  onUnknownSymbolChange: (symbol: string) => void;
};

const buttonClass =
  "bm-tool-button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

export function BlockModelToolbar({
  activeTool,
  canUndo,
  canRedo,
  hasSelection,
  canAddPart,
  placingText,
  unknownSymbol,
  onAddBlock,
  onAddPart,
  onAddText,
  onAddUnknown,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onClear,
  onTextChange,
  onUnknownSymbolChange,
}: BlockModelToolbarProps) {
  return (
    <div className="bm-toolbar no-print" role="toolbar" aria-label="Blockmodellens verktyg">
      <button className={`${buttonClass} bm-tool-primary`} onClick={onAddBlock}>
        <Plus aria-hidden="true" /> Block
      </button>
      <button
        className={buttonClass}
        onClick={onAddPart}
        disabled={!canAddPart || activeTool === "pen"}
      >
        <Split aria-hidden="true" /> Del
      </button>
      <button
        className={`${buttonClass} ${placingText ? "bm-tool-active" : ""}`}
        onClick={onAddText}
        aria-pressed={placingText}
      >
        <Type aria-hidden="true" /> {placingText ? "Klicka på ytan" : "Text"}
      </button>
      <div className="bm-symbol-tool" role="group" aria-label="Lägg till okänd storhet">
        <button
          className="bm-symbol-add"
          onClick={onAddUnknown}
          title={`Lägg till ${unknownSymbol}`}
          aria-label={`Lägg till ${unknownSymbol}`}
        >
          <Variable aria-hidden="true" /> {unknownSymbol}
        </button>
        <select
          className="bm-symbol-select"
          aria-label="Välj symbol att lägga till"
          value={unknownSymbol}
          onChange={(event) => onUnknownSymbolChange(event.currentTarget.value)}
        >
          <option value="x">x</option>
          <option value="?">?</option>
        </select>
      </div>
      <span className="bm-toolbar-divider" aria-hidden="true" />
      <button
        className={`${buttonClass} ${activeTool === "pen" ? "bm-tool-active" : ""}`}
        onClick={() => onToolChange(activeTool === "pen" ? "select" : "pen")}
        aria-pressed={activeTool === "pen"}
      >
        {activeTool === "pen" ? <Hand aria-hidden="true" /> : <PenLine aria-hidden="true" />}
        {activeTool === "pen" ? "Markera" : "Penna"}
      </button>
      <button className={buttonClass} onClick={onUndo} disabled={!canUndo} title="Ångra (Ctrl+Z)">
        <Undo2 aria-hidden="true" /> Ångra
      </button>
      <button
        className={buttonClass}
        onClick={onRedo}
        disabled={!canRedo}
        title="Gör om (Ctrl+Skift+Z)"
      >
        <Redo2 aria-hidden="true" /> Gör om
      </button>
      <button
        className={buttonClass}
        onClick={onDelete}
        disabled={!hasSelection}
        title="Radera markerat objekt"
      >
        <Eraser aria-hidden="true" /> Radera
      </button>
      <button className={`${buttonClass} bm-tool-clear`} onClick={onClear}>
        <RotateCcw aria-hidden="true" /> Rensa
      </button>
    </div>
  );
}
