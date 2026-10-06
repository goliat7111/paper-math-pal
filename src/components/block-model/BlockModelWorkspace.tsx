import { Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes } from "lucide-react";
import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

import { DrawingLayer } from "./DrawingLayer";
import { BlockModelToolbar } from "./BlockModelToolbar";
import { recognizeRectangle } from "./recognizeRectangle";
import {
  createWorkspaceHistory,
  workspaceHistoryReducer,
  type BlockModelObject,
  type WorkspaceSnapshot,
} from "./types";
import { divideAllBlockSegments, divideBlockSegment, getBlockSegmentBoundaries } from "./divisions";

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

const DEFAULT_BLOCK_WIDTH = 150;
const DEFAULT_BLOCK_HEIGHT = 64;
const BLOCK_VISUAL_SCALE = 0.6;
const MIN_BLOCK_DIVISIONS = 2;
const MAX_BLOCK_DIVISIONS = 20;

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
  const [dividingBlock, setDividingBlock] = useState(false);
  const [divisionCount, setDivisionCount] = useState("2");
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [unknownSymbol, setUnknownSymbol] = useState("x");
  const [textDraft, setTextDraft] = useState("");
  const [inlineEditingTextId, setInlineEditingTextId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inlineTextInputRef = useRef<HTMLInputElement>(null);
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
    if (!inlineEditingTextId) return;
    inlineTextInputRef.current?.focus();
    inlineTextInputRef.current?.select();
  }, [inlineEditingTextId]);

  useEffect(() => {
    setDividingBlock(false);
    setSelectedSegmentIndex(null);
  }, [selectedId]);

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
    (snapshot: WorkspaceSnapshot, before?: WorkspaceSnapshot) =>
      dispatch({ type: "change", snapshot, before }),
    [],
  );

  function updateObjectText(text: string, objectId = selectedId) {
    const targetObject = present.objects.find((object) => object.id === objectId);
    if (!targetObject) return;
    const currentText =
      targetObject.type === "block"
        ? targetObject.label
        : targetObject.type === "text"
          ? targetObject.text
          : targetObject.symbol;
    if (currentText === text) return;
    const objects = present.objects.map((object) => {
      if (object.id !== targetObject.id) return object;
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
      segmentWidth: DEFAULT_BLOCK_WIDTH,
      height: DEFAULT_BLOCK_HEIGHT,
      parts: 0,
      divisions: 1,
      extraDividers: [],
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
        ? {
            ...object,
            parts: object.parts + 1,
            extraDividers: object.extraDividers.map(
              (position) => (position * (object.parts + 1)) / (object.parts + 2),
            ),
          }
        : object,
    );
    changeSnapshot({ ...present, objects });
    setSelectedSegmentIndex(null);
  }

  function openDivisionControls() {
    if (selectedObject?.type !== "block") return;
    setDivisionCount(String(Math.max(MIN_BLOCK_DIVISIONS, selectedObject.divisions)));
    setSelectedSegmentIndex(null);
    setDividingBlock(true);
  }

  function updateBlockDivisions(mode: "block" | "segment" | "all") {
    if (selectedObject?.type !== "block") return;
    const count = Number(divisionCount);
    if (
      !Number.isSafeInteger(count) ||
      count < MIN_BLOCK_DIVISIONS ||
      count > MAX_BLOCK_DIVISIONS
    ) {
      return;
    }
    if (mode === "segment" && selectedSegmentIndex === null) return;

    const updatedBlock =
      mode === "block"
        ? { ...selectedObject, divisions: count }
        : mode === "all"
          ? divideAllBlockSegments(selectedObject, count)
          : divideBlockSegment(selectedObject, selectedSegmentIndex!, count);
    const objects = present.objects.map((object) =>
      object.id === selectedObject.id ? updatedBlock : object,
    );
    changeSnapshot({ ...present, objects });
    setSelectedSegmentIndex(null);
    setDividingBlock(false);
  }

  function makeWholeBlock() {
    if (selectedObject?.type !== "block") return;
    const isAlreadyWhole =
      selectedObject.parts === 0 &&
      selectedObject.divisions === 1 &&
      selectedObject.extraDividers.length === 0;
    if (isAlreadyWhole) return;

    const updatedBlock = {
      ...selectedObject,
      segmentWidth: selectedObject.segmentWidth * (selectedObject.parts + 1),
      parts: 0,
      divisions: 1,
      extraDividers: [],
    };
    const objects = present.objects.map((object) =>
      object.id === selectedObject.id ? updatedBlock : object,
    );
    changeSnapshot({ ...present, objects });
    setSelectedSegmentIndex(null);
    setDividingBlock(false);
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

  function changeTool(tool: Tool) {
    setActiveTool(tool);
  }

  function placeText(event: ReactMouseEvent<HTMLElement>) {
    if (!placingText) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const target = event.target;
    const segment = target instanceof Element ? target.closest(".bm-block-segment") : null;
    const blockElement = segment?.closest<HTMLElement>("[data-block-id]");
    const segmentsElement = segment?.parentElement;
    const blockId = blockElement?.dataset.blockId;
    const segmentIndex =
      segment && segmentsElement ? Array.from(segmentsElement.children).indexOf(segment) : -1;
    const item: BlockModelObject = {
      id: newId(),
      type: "text",
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      text: "",
      ...(blockId && segmentIndex >= 0 ? { blockId, segmentIndex } : {}),
    };
    changeSnapshot({ ...present, objects: [...present.objects, item] });
    setSelectedId(item.id);
    setInlineEditingTextId(item.id);
    setPlacingText(false);
  }

  function addUnknown(symbol: string) {
    const item: BlockModelObject = {
      id: newId(),
      type: "unknown",
      x: 36,
      y: 28,
      symbol,
    };
    changeSnapshot({ ...present, objects: [...present.objects, item] });
    setSelectedId(item.id);
    setActiveTool("select");
  }

  function selectUnknownSymbol(symbol: string) {
    setUnknownSymbol(symbol);
    addUnknown(symbol);
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
    const isCopyDrag = kind === "move" && object.type === "block" && event.ctrlKey;
    const objectBounds = event.currentTarget.getBoundingClientRect();
    const stageWidth = stageRef.current?.clientWidth ?? 1;
    const stageHeight = stageRef.current?.clientHeight ?? 1;
    const positionedObject =
      object.type === "text"
        ? {
            ...object,
            x:
              ((objectBounds.left +
                objectBounds.width / 2 -
                (stageRef.current?.getBoundingClientRect().left ?? 0)) /
                stageWidth) *
              100,
            y:
              ((objectBounds.top +
                objectBounds.height / 2 -
                (stageRef.current?.getBoundingClientRect().top ?? 0)) /
                stageHeight) *
              100,
          }
        : object;
    const gestureObject = isCopyDrag ? { ...positionedObject, id: newId() } : positionedObject;
    if (isCopyDrag) {
      dispatch({
        type: "preview",
        snapshot: { ...present, objects: [...present.objects, gestureObject] },
      });
    }
    gestureRef.current = {
      pointerId: event.pointerId,
      objectId: gestureObject.id,
      startX: point.x,
      startY: point.y,
      originalObject: gestureObject,
      before: present,
      kind,
      changed: isCopyDrag,
    };
    setSelectedId(gestureObject.id);
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
            ? gesture.originalObject.segmentWidth + dx / (count * BLOCK_VISUAL_SCALE)
            : object.segmentWidth,
        );
        return { ...object, segmentWidth };
      }
      return {
        ...object,
        ...(object.type === "text" ? { blockId: undefined, segmentIndex: undefined } : {}),
        x: Math.max(0, gesture.originalObject.x + (dx / stageWidth) * 100),
        y: Math.max(0, gesture.originalObject.y + (dy / stageHeight) * 100),
      };
    });
    if (!objects.some((object) => object.id === gesture.objectId)) {
      objects.push({
        ...gesture.originalObject,
        x: Math.max(0, gesture.originalObject.x + (dx / stageWidth) * 100),
        y: Math.max(0, gesture.originalObject.y + (dy / stageHeight) * 100),
      });
    }
    dispatch({ type: "preview", snapshot: { ...history.present, objects } });
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (gesture.changed) dispatch({ type: "commit", before: gesture.before });
  }

  function addStroke(
    stroke: { id: string; points: Array<{ x: number; y: number }> },
    viewport: { width: number; height: number },
  ) {
    const bounds = recognizeRectangle(stroke.points, viewport);
    if (bounds) {
      const stageWidth = stageRef.current?.clientWidth ?? viewport.width;
      const stageHeight = stageRef.current?.clientHeight ?? viewport.height;
      const block: BlockModelObject = {
        id: newId(),
        type: "block",
        x: Math.max(
          0,
          ((bounds.x + bounds.width / 2 - (DEFAULT_BLOCK_WIDTH * BLOCK_VISUAL_SCALE) / 2) /
            stageWidth) *
            100,
        ),
        y: Math.max(
          0,
          ((bounds.y + bounds.height / 2 - (DEFAULT_BLOCK_HEIGHT * BLOCK_VISUAL_SCALE) / 2) /
            stageHeight) *
            100,
        ),
        segmentWidth: DEFAULT_BLOCK_WIDTH,
        height: DEFAULT_BLOCK_HEIGHT,
        parts: 0,
        divisions: 1,
        extraDividers: [],
        label: "",
        color: blockColors[0].value,
      };
      changeSnapshot({ ...history.present, objects: [...history.present.objects, block] });
      setSelectedId(block.id);
      setActiveTool("select");
      return;
    }
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
        canDivideBlock={selectedObject?.type === "block"}
        placingText={placingText}
        unknownSymbol={unknownSymbol}
        onAddBlock={addBlock}
        onAddPart={addPart}
        onDivideBlock={openDivisionControls}
        onAddText={addText}
        onToolChange={changeTool}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onClear={clearWorkspace}
        onTextChange={setTextDraft}
        onSelectUnknownSymbol={selectUnknownSymbol}
      />

      {(selectedObject || placingText) && (
        <div className="bm-edit-bar no-print">
          {selectedObject?.type === "block" && dividingBlock ? (
            <div
              className="bm-division-controls"
              role="group"
              aria-label="Dela blocket i lika delar"
            >
              <label htmlFor="bm-division-count">Dela i lika många delar (2–20)</label>
              <button
                type="button"
                className="bm-division-stepper"
                aria-label="Färre delar"
                disabled={Number(divisionCount) <= MIN_BLOCK_DIVISIONS}
                onClick={() =>
                  setDivisionCount((value) =>
                    String(
                      Math.max(
                        MIN_BLOCK_DIVISIONS,
                        (Number.isSafeInteger(Number(value))
                          ? Number(value)
                          : MIN_BLOCK_DIVISIONS) - 1,
                      ),
                    ),
                  )
                }
              >
                −
              </button>
              <input
                id="bm-division-count"
                type="number"
                inputMode="numeric"
                min={MIN_BLOCK_DIVISIONS}
                max={MAX_BLOCK_DIVISIONS}
                step="1"
                value={divisionCount}
                onChange={(event) => setDivisionCount(event.target.value)}
              />
              <button
                type="button"
                className="bm-division-stepper"
                aria-label="Fler delar"
                disabled={Number(divisionCount) >= MAX_BLOCK_DIVISIONS}
                onClick={() =>
                  setDivisionCount((value) =>
                    String(
                      Math.min(
                        MAX_BLOCK_DIVISIONS,
                        (Number.isSafeInteger(Number(value))
                          ? Number(value)
                          : MIN_BLOCK_DIVISIONS) + 1,
                      ),
                    ),
                  )
                }
              >
                +
              </button>
              <span className="bm-division-hint">
                {selectedSegmentIndex === null
                  ? "Välj en del i blocket för att dela just den."
                  : `Del ${selectedSegmentIndex + 1} vald`}
              </span>
              <div className="bm-division-actions">
                <button
                  type="button"
                  className="bm-division-apply"
                  disabled={
                    !Number.isSafeInteger(Number(divisionCount)) ||
                    Number(divisionCount) < MIN_BLOCK_DIVISIONS ||
                    Number(divisionCount) > MAX_BLOCK_DIVISIONS
                  }
                  onClick={() => updateBlockDivisions("block")}
                >
                  Dela blocket
                </button>
                <button
                  type="button"
                  className="bm-division-apply"
                  disabled={
                    selectedSegmentIndex === null ||
                    !Number.isSafeInteger(Number(divisionCount)) ||
                    Number(divisionCount) < MIN_BLOCK_DIVISIONS ||
                    Number(divisionCount) > MAX_BLOCK_DIVISIONS
                  }
                  onClick={() => updateBlockDivisions("segment")}
                >
                  Dela delen
                </button>
                <button
                  type="button"
                  className="bm-division-apply"
                  disabled={
                    !Number.isSafeInteger(Number(divisionCount)) ||
                    Number(divisionCount) < MIN_BLOCK_DIVISIONS ||
                    Number(divisionCount) > MAX_BLOCK_DIVISIONS
                  }
                  onClick={() => updateBlockDivisions("all")}
                >
                  Dela alla delar
                </button>
                <button
                  type="button"
                  className="bm-division-cancel"
                  disabled={
                    selectedObject.parts === 0 &&
                    selectedObject.divisions === 1 &&
                    selectedObject.extraDividers.length === 0
                  }
                  onClick={makeWholeBlock}
                  title="Ta bort alla delar och indelningar"
                >
                  Helt block
                </button>
              </div>
              <button
                type="button"
                className="bm-division-cancel"
                onClick={() => setDividingBlock(false)}
              >
                Avbryt
              </button>
            </div>
          ) : !selectedObject ? (
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
            const totalWidth = object.segmentWidth * (object.parts + 1) * BLOCK_VISUAL_SCALE;
            const segmentStops = getBlockSegmentBoundaries(object);
            const segmentWidths = segmentStops
              .slice(1)
              .map((position, index) => `${(position - segmentStops[index]!) * 100}%`);
            return (
              <div
                key={object.id}
                className={`bm-object bm-block-object ${selected ? "bm-object-selected" : ""}`}
                data-block-id={object.id}
                style={{ left: `${object.x}%`, top: `${object.y}%`, width: totalWidth }}
                onPointerDown={(event) => startGesture(event, object, "move")}
                onDoubleClick={() => setSelectedId(object.id)}
                role="button"
                aria-label={`${object.label || "Block"}${selected ? ", markerat" : ""}`}
                aria-pressed={selected}
                tabIndex={0}
              >
                <span className="bm-block-label">{object.label}</span>
                <span
                  className="bm-block-segments"
                  style={{
                    height: object.height * BLOCK_VISUAL_SCALE,
                    gridTemplateColumns: segmentWidths.join(" "),
                  }}
                >
                  {segmentWidths.map((_, index) => (
                    <span
                      key={index}
                      className={`bm-block-segment ${
                        dividingBlock && selectedSegmentIndex === index
                          ? "bm-block-segment-target"
                          : ""
                      }`}
                      onPointerDown={(event) => {
                        if (!dividingBlock) return;
                        event.stopPropagation();
                        setSelectedSegmentIndex(index);
                      }}
                      onClick={(event) => {
                        if (!dividingBlock) return;
                        event.stopPropagation();
                        setSelectedSegmentIndex(index);
                      }}
                      onKeyDown={(event) => {
                        if (!dividingBlock || (event.key !== "Enter" && event.key !== " ")) return;
                        event.preventDefault();
                        setSelectedSegmentIndex(index);
                      }}
                      role={dividingBlock ? "button" : undefined}
                      aria-label={dividingBlock ? `Välj del ${index + 1} att dela` : undefined}
                      aria-pressed={dividingBlock ? selectedSegmentIndex === index : undefined}
                      tabIndex={dividingBlock ? 0 : undefined}
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
            const attachedBlock = object.blockId
              ? present.objects.find(
                  (candidate) => candidate.id === object.blockId && candidate.type === "block",
                )
              : undefined;
            const attachedBoundaries = attachedBlock
              ? getBlockSegmentBoundaries(attachedBlock)
              : null;
            const attachedSegmentStart =
              attachedBoundaries && object.segmentIndex !== undefined
                ? attachedBoundaries[object.segmentIndex]
                : undefined;
            const attachedSegmentEnd =
              attachedBoundaries && object.segmentIndex !== undefined
                ? attachedBoundaries[object.segmentIndex + 1]
                : undefined;
            const attachedStyle =
              attachedBlock &&
              attachedSegmentStart !== undefined &&
              attachedSegmentEnd !== undefined
                ? {
                    left: `calc(${attachedBlock.x}% + ${
                      attachedBlock.segmentWidth *
                      (attachedBlock.parts + 1) *
                      BLOCK_VISUAL_SCALE *
                      ((attachedSegmentStart + attachedSegmentEnd) / 2)
                    }px)`,
                    top: `calc(${attachedBlock.y}% + ${
                      (attachedBlock.height * BLOCK_VISUAL_SCALE) / 2
                    }px)`,
                    width: `${
                      attachedBlock.segmentWidth *
                      (attachedBlock.parts + 1) *
                      BLOCK_VISUAL_SCALE *
                      (attachedSegmentEnd - attachedSegmentStart)
                    }px`,
                    height: `${attachedBlock.height * BLOCK_VISUAL_SCALE}px`,
                  }
                : null;
            const inlineEditing = inlineEditingTextId === object.id;
            return (
              <div
                key={object.id}
                className={`bm-object bm-text-object ${
                  attachedStyle ? "bm-text-object--segment" : ""
                } ${selected ? "bm-object-selected" : ""}`}
                style={attachedStyle ?? { left: `${object.x}%`, top: `${object.y}%` }}
                onPointerDown={
                  inlineEditing ? undefined : (event) => startGesture(event, object, "move")
                }
                onDoubleClick={() => {
                  setSelectedId(object.id);
                  setTextDraft(object.text);
                  setInlineEditingTextId(object.id);
                }}
                role={inlineEditing ? undefined : "button"}
                aria-pressed={inlineEditing ? undefined : selected}
                tabIndex={inlineEditing ? -1 : 0}
              >
                {inlineEditing ? (
                  <input
                    ref={inlineTextInputRef}
                    className="bm-inline-text-input"
                    aria-label="Skriv text direkt på arbetsytan"
                    value={textDraft}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setTextDraft(event.target.value)}
                    onBlur={(event) => {
                      updateObjectText(event.currentTarget.value, object.id);
                      setInlineEditingTextId((currentId) =>
                        currentId === object.id ? null : currentId,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                      if (event.key === "Escape") {
                        setTextDraft(object.text);
                        event.currentTarget.blur();
                      }
                    }}
                  />
                ) : (
                  object.text || " "
                )}
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
        <span>
          Alla objekt kan flyttas. Ctrl-dra ett block för att kopiera. Markera ett block och välj
          Del för att bygga vidare.
        </span>
        <span>Ångra: Ctrl+Z · Gör om: Ctrl+Skift+Z</span>
      </footer>
    </main>
  );
}
