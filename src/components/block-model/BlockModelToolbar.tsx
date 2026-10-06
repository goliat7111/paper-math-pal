import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Eraser,
  Grid2X2,
  Hand,
  PenLine,
  Plus,
  Redo2,
  RotateCcw,
  Split,
  Type,
  Undo2,
} from "lucide-react";

type Tool = "select" | "pen";

type BlockModelToolbarProps = {
  activeTool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  canAddPart: boolean;
  canDivideBlock: boolean;
  placingText: boolean;
  unknownSymbol: string;
  onAddBlock: () => void;
  onAddPart: () => void;
  onDivideBlock: () => void;
  onAddText: () => void;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onClear: () => void;
  onTextChange: (text: string) => void;
  onSelectUnknownSymbol: (symbol: string) => void;
};

const buttonClass =
  "bm-tool-button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

export function BlockModelToolbar({
  activeTool,
  canUndo,
  canRedo,
  hasSelection,
  canAddPart,
  canDivideBlock,
  placingText,
  unknownSymbol,
  onAddBlock,
  onAddPart,
  onDivideBlock,
  onAddText,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onClear,
  onTextChange,
  onSelectUnknownSymbol,
}: BlockModelToolbarProps) {
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [symbolMenuPosition, setSymbolMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const symbolTriggerRef = useRef<HTMLButtonElement>(null);
  const symbolMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbolMenuOpen) return;

    function positionMenu() {
      const trigger = symbolTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.max(rect.width, 64);
      const menuHeight = 98;
      const top =
        rect.bottom + menuHeight <= window.innerHeight - 8
          ? rect.bottom + 4
          : Math.max(8, rect.top - menuHeight - 4);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setSymbolMenuPosition({ top, left, width });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !symbolTriggerRef.current?.contains(target) &&
        !symbolMenuRef.current?.contains(target)
      ) {
        setSymbolMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSymbolMenuOpen(false);
    }

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [symbolMenuOpen]);

  return (
    <div className="bm-toolbar no-print" role="toolbar" aria-label="Blockmodellens verktyg">
      <button className={`${buttonClass} bm-tool-primary`} onClick={onAddBlock}>
        <Plus aria-hidden="true" /> Block
      </button>
      <button
        className={buttonClass}
        onClick={onAddPart}
        disabled={!canAddPart || activeTool !== "select"}
      >
        <Split aria-hidden="true" /> Del
      </button>
      <button
        className={buttonClass}
        onClick={onDivideBlock}
        disabled={!canDivideBlock || activeTool !== "select"}
        title="Dela hela blocket i lika stora delar"
      >
        <Grid2X2 aria-hidden="true" /> Dela i
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
          type="button"
          className="bm-symbol-insert"
          onClick={() => onSelectUnknownSymbol(unknownSymbol)}
          aria-label={`Lägg till symbolen ${unknownSymbol}`}
          title={`Lägg till ${unknownSymbol}`}
        >
          {unknownSymbol}
        </button>
        <button
          type="button"
          ref={symbolTriggerRef}
          className="bm-symbol-trigger"
          onClick={() => setSymbolMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={symbolMenuOpen}
          aria-label="Byt symbol"
        >
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      {symbolMenuOpen &&
        createPortal(
          <div
            ref={symbolMenuRef}
            className="bm-symbol-menu"
            role="menu"
            aria-label="Välj symbol"
            style={{
              top: symbolMenuPosition.top,
              left: symbolMenuPosition.left,
              width: symbolMenuPosition.width,
            }}
          >
            {["x", "?"].map((symbol) => (
              <button
                key={symbol}
                className="bm-symbol-option"
                role="menuitemradio"
                aria-checked={unknownSymbol === symbol}
                onClick={() => {
                  onSelectUnknownSymbol(symbol);
                  setSymbolMenuOpen(false);
                }}
              >
                {symbol}
              </button>
            ))}
          </div>,
          document.body,
        )}
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
