import { Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes } from "lucide-react";
import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

import { DrawingLayer } from "./DrawingLayer";
import { BlockModelToolbar } from "./BlockModelToolbar";
import {
  createWorkspaceHistory,
  workspaceHistoryReducer,
  type BlockModelObject,
  type WorkspaceSnapshot,
} from "./types";

type Tool = "select" | "pen";
type Gesture = {
  pointerId: number;
  objectId: string;
  startX: number;
  startY: number;
  originalObject: BlockModelObject;
  before: WorkspaceSnapshot;
  kind: "move" | "resize";
  changed: boolean;
};

const blockColors = [
  { name: "Gul", value: "#fff2bf" },
  { name: "Blå", value: "#d8ecff" },
  { name: "Grön", value: "#d9f1dd" },
  { name: "Rosa", value: "#ffe0e8" },
  { name: "Lila", value: "#e9ddff" },
];

const newId = () => crypto.randomUUID();

export function BlockModelWorkspace() {
  const [history, dispatch] = useReducer(
    workspaceHistoryReducer,
    undefined,
    createWorkspaceHistory,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [placingText, setPlacingText] = useState(false);
  const [unknownSymbol, setUnknownSymbol] = useState("x");
  const [textDraft, setTextDraft] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const present = history.present;
  const selectedObject = present.objects.find((object) => object.id === selectedId) ?? null;
  const selectedObjectText =
    selectedObject?.type === "block"
      ? selectedObject.label
      : selectedObject?.type === "text"
        ? selectedObject.text
        : selectedObject?.type === "unknown"
          ? selectedObject.symbol
          : "";

  useEffect(() => {
    setTextDraft(selectedObjectText);
  }, [selectedId, selectedObject?.type, selectedObjectText]);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        dispatch({
          type: "change",
          snapshot: {
            ...present,
            objects: present.objects.filter((object) => object.id !== selectedId),
          },
        });
        setSelectedId(null);
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        setSelectedId(null);
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [present, selectedId]);

  const changeSnapshot = useCallback(
    (snapshot: WorkspaceSnapshot) => dispatch({ type: "change", snapshot }),
    [],
  );

  function updateObjectText(text: string) {
    if (!selectedObject) return;
    const currentText =
      selectedObject.type === "block"
        ? selectedObject.label
        : selectedObject.type === "text"
          ? selectedObject.text
          : selectedObject.symbol;
    if (currentText === text) return;
    const objects = present.objects.map((object) => {
      if (object.id !== selectedObject.id) return object;
      if (object.type === "block") return { ...object, label: text };
      if (object.type === "text") return { ...object, text };
      return { ...object, symbol: text };
    });
    changeSnapshot({ ...present, objects });
  }

  function addBlock() {
    const blockCount = present.objects.filter((object) => object.type === "block").length;
    const block: BlockModelObject = {
      id: newId(),
      type: "block",
      x: 20 + (blockCount % 3) * 18,
      y: 20 + Math.floor(blockCount / 3) * 14,
      segmentWidth: 150,
      height: 64,
      parts: 0,
      label: "",
      color: blockColors[0].value,
    };
    changeSnapshot({ ...present, objects: [...present.objects, block] });
    setSelectedId(block.id);
    setActiveTool("select");
  }

  function addPart() {
    if (selectedObject?.type !== "block") return;
    const objects = present.objects.map((object) =>
      object.id === selectedObject.id && object.type === "block"
        ? { ...object, parts: object.parts + 1 }
        : object,
    );
    changeSnapshot({ ...present, objects });
  }

  function updateBlockColor(color: string) {
    if (selectedObject?.type !== "block" || selectedObject.color === color) return;
    const objects = present.objects.map((object) =>
      object.id === selectedObject.id && object.type === "block" ? { ...object, color } : object,
    );
    changeSnapshot({ ...present, objects });
  }

  function addText() {
    setPlacingText((current) => !current);
    setActiveTool("select");
  }

  function placeText(event: ReactMouseEvent<HTMLElement>) {
    if (!placingText) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const item: BlockModelObject = {
      id: newId(),
      type: "text",
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      text: "",
    };
    changeSnapshot({ ...present, objects: [...present.objects, item] });
    setSelectedId(item.id);
    setPlacingText(false);
  }

  function addUnknown() {
    const item: BlockModelObject = {
      id: newId(),
      type: "unknown",
      x: 36,
      y: 28,
      symbol: unknownSymbol,
    };
    changeSnapshot({ ...present, objects: [...present.objects, item] });
    setSelectedId(item.id);
    setActiveTool("select");
  }

  function changeUnknownSymbol(symbol: string) {
    setUnknownSymbol(symbol);
    if (selectedObject?.type !== "unknown" || selectedObject.symbol === symbol) return;
    const objects = present.objects.map((object) =>
      object.id === selectedObject.id && object.type === "unknown" ? { ...object, symbol } : object,
    );
    changeSnapshot({ ...present, objects });
  }

  function deleteObject(id: string) {
    changeSnapshot({
      ...present,
      objects: present.objects.filter((object) => object.id !== id),
    });
    setSelectedId((currentId) => (currentId === id ? null : currentId));
  }

  function deleteSelected() {
    if (selectedId) deleteObject(selectedId);
  }

  function clearWorkspace() {
    if (present.objects.length === 0 && present.strokes.length === 0) return;
    if (!window.confirm("Vill du rensa hela arbetsytan? Det går att ångra.")) return;
    changeSnapshot({ objects: [], strokes: [] });
    setSelectedId(null);
  }

  function undo() {
    dispatch({ type: "undo" });
    setSelectedId(null);
  }

  function redo() {
    dispatch({ type: "redo" });
    setSelectedId(null);
  }

  function stagePoint(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startGesture(
    event: ReactPointerEvent<HTMLDivElement>,
    object: BlockModelObject,
    kind: Gesture["kind"],
  ) {
    if (activeTool !== "select" || placingText || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = stagePoint(event);
    gestureRef.current = {
      pointerId: event.pointerId,
      objectId: object.id,
      startX: point.x,
      startY: point.y,
      originalObject: object,
      before: present,
      kind,
      changed: false,
    };
    setSelectedId(object.id);
  }

  function moveGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = stagePoint(event);
    const dx = point.x - gesture.startX;
    const dy = point.y - gesture.startY;
    if (dx !== 0 || dy !== 0) gesture.changed = true;
    const stageWidth = stageRef.current?.clientWidth ?? 1;
    const stageHeight = stageRef.current?.clientHeight ?? 1;
    const objects = history.present.objects.map((object) => {
      if (object.id !== gesture.objectId) return object;
      if (gesture.kind === "resize" && object.type === "block") {
        const count = object.parts + 1;
        const segmentWidth = Math.max(
          48,
          gesture.originalObject.type === "block"
            ? gesture.originalObject.segmentWidth + dx / count
            : object.segmentWidth,
        );
        return { ...object, segmentWidth };
      }
      return {
        ...object,
        x: Math.max(0, gesture.originalObject.x + (dx / stageWidth) * 100),
        y: Math.max(0, gesture.originalObject.y + (dy / stageHeight) * 100),
      };
    });
    dispatch({ type: "preview", snapshot: { ...history.present, objects } });
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (gesture.changed) dispatch({ type: "commit", before: gesture.before });
  }

  function addStroke(stroke: { id: string; points: Array<{ x: number; y: number }> }) {
    changeSnapshot({ ...history.present, strokes: [...history.present.strokes, stroke] });
  }

  return (
    <main className="bm-page">
      <header className="bm-header no-print">
        <Link to="/" className="bm-back-link">
          <ArrowLeft aria-hidden="true" /> Till startsidan
        </Link>
        <div className="bm-title">
          <span className="bm-title-icon">
            <Boxes aria-hidden="true" />
          </span>
          <div>
            <h1>Blockmodellen</h1>
            <p>Bygg modellen tillsammans</p>
          </div>
        </div>
        <span className="bm-header-note">Tryck · dra · utforska</span>
      </header>

      <BlockModelToolbar
        activeTool={activeTool}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        hasSelection={Boolean(selectedObject)}
        canAddPart={selectedObject?.type === "block"}
        placingText={placingText}
        unknownSymbol={unknownSymbol}
        onAddBlock={addBlock}
        onAddPart={addPart}
        onAddText={addText}
        onAddUnknown={addUnknown}
        onToolChange={setActiveTool}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onClear={clearWorkspace}
        onTextChange={setTextDraft}
        onUnknownSymbolChange={changeUnknownSymbol}
      />

      {(selectedObject || placingText) && (
        <div className="bm-edit-bar no-print">
          {!selectedObject ? (
            <>
              <label>Placera text</label>
              <span>Klicka där texten ska ligga</span>
            </>
          ) : selectedObject.type !== "unknown" ? (
            <>
              <label htmlFor="bm-object-label">
                {selectedObject.type === "block" ? "Namn på block" : "Text"}
              </label>
              {selectedObject.type === "block" && (
                <div className="bm-color-options" role="group" aria-label="Blockets bakgrundsfärg">
                  {blockColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`bm-color-swatch ${
                        selectedObject.color === color.value ? "bm-color-swatch-selected" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      aria-label={color.name}
                      aria-pressed={selectedObject.color === color.value}
                      title={color.name}
                      onClick={() => updateBlockColor(color.value)}
                    />
                  ))}
                </div>
              )}
              <input
                id="bm-object-label"
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                onBlur={(event) => updateObjectText(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                placeholder={selectedObject.type === "block" ? "t.ex. Lisa" : "Text"}
              />
            </>
          ) : null}
        </div>
      )}

      <section
        ref={stageRef}
        className={`bm-stage ${activeTool === "pen" ? "bm-stage-pen" : ""} ${
          placingText ? "bm-stage-place-text" : ""
        }`}
        aria-label="Blockmodellens arbetsyta"
        tabIndex={0}
        onClick={placeText}
        onPointerMove={moveGesture}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget && activeTool === "select") {
            setSelectedId(null);
          }
        }}
      >
        {present.objects.length === 0 && present.strokes.length === 0 && (
          <div className="bm-empty-prompt" aria-hidden="true">
            <span>Börja bygga här</span>
            <span>
              {placingText ? "Klicka där texten ska ligga" : "Välj + Block, Text eller x"}
            </span>
          </div>
        )}

        {present.objects.map((object) => {
          const selected = object.id === selectedId;
          if (object.type === "block") {
            const totalWidth = object.segmentWidth * (object.parts + 1);
            return (
              <div
                key={object.id}
                className={`bm-object bm-block-object ${selected ? "bm-object-selected" : ""}`}
                style={{ left: `${object.x}%`, top: `${object.y}%`, width: totalWidth }}
                onPointerDown={(event) => startGesture(event, object, "move")}
                onDoubleClick={() => setSelectedId(object.id)}
                role="button"
                aria-label={`${object.label || "Block"}${selected ? ", markerat" : ""}`}
                aria-pressed={selected}
                tabIndex={0}
              >
                <span className="bm-block-label">{object.label}</span>
                <span className="bm-block-segments" style={{ height: object.height }}>
                  {Array.from({ length: object.parts + 1 }, (_, index) => (
                    <span
                      key={index}
                      className="bm-block-segment"
                      style={{ backgroundColor: object.color }}
                    />
                  ))}
                </span>
                {selected && (
                  <button
                    className="bm-resize-handle"
                    aria-label="Ändra blockets bredd"
                    title="Dra för att ändra bredd"
                    onPointerDown={(event) => startGesture(event, object, "resize")}
                  />
                )}
              </div>
            );
          }
          if (object.type === "text") {
            return (
              <div
                key={object.id}
                className={`bm-object bm-text-object ${selected ? "bm-object-selected" : ""}`}
                style={{ left: `${object.x}%`, top: `${object.y}%` }}
                onPointerDown={(event) => startGesture(event, object, "move")}
                onDoubleClick={() => setSelectedId(object.id)}
                role="button"
                aria-pressed={selected}
                tabIndex={0}
              >
                {object.text || " "}
              </div>
            );
          }
          return (
            <Fragment key={object.id}>
              <div
                className={`bm-object bm-unknown-object ${selected ? "bm-object-selected" : ""}`}
                style={{ left: `${object.x}%`, top: `${object.y}%` }}
                onPointerDown={(event) => startGesture(event, object, "move")}
                onDoubleClick={() => setSelectedId(object.id)}
                role="button"
                aria-label="Okänd storhet"
                aria-pressed={selected}
                tabIndex={0}
              >
                {object.symbol || " "}
              </div>
              {selected && (
                <button
                  className="bm-object-delete"
                  style={{ left: `calc(${object.x}% + 43px)`, top: `calc(${object.y}% - 18px)` }}
                  aria-label={`Ta bort symbolen ${object.symbol}`}
                  title="Ta bort den här symbolen"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => deleteObject(object.id)}
                >
                  ×
                </button>
              )}
            </Fragment>
          );
        })}

        <DrawingLayer
          strokes={present.strokes}
          active={activeTool === "pen"}
          onStrokeComplete={addStroke}
        />
      </section>
      <footer className="bm-footer no-print">
        <span>Alla objekt kan flyttas. Markera ett block och välj Del för att bygga vidare.</span>
        <span>Ångra: Ctrl+Z · Gör om: Ctrl+Skift+Z</span>
      </footer>
    </main>
  );
}
