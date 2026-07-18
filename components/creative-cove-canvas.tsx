"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  exportAs,
  Tldraw,
  type Editor,
  type TLDefaultColorStyle,
  type TLDefaultSizeStyle,
} from "tldraw";
import "tldraw/tldraw.css";

type CreativeToolId = "draw" | "eraser";

type ToolbarButtonConfig = {
  action: "tool" | "undo" | "clear" | "save";
  iconSrc: string;
  id: string;
  label: string;
};

type ColorSwatchConfig = {
  id: string;
  imageSrc: string;
  tldrawColor: TLDefaultColorStyle;
};

type SizeButtonConfig = {
  iconSrc: string;
  id: string;
  label: string;
  tldrawSize: TLDefaultSizeStyle;
};

type BubbleSpec = {
  delay: string;
  drift: string;
  duration: string;
  left: string;
  opacity: number;
  size: string;
  start: string;
};

type DecorativeAsset = {
  className: string;
  loading?: "eager" | "lazy";
  src: string;
};

type PointerDebugEntry = {
  defaultPrevented: boolean;
  layer: string;
  phase: "capture" | "bubble";
  pointerType: string;
  target: string;
  type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup";
};

type EditorDebugEntry = {
  detail: string;
  event: string;
  tool: string;
};

type DrawShapeLike = {
  id: unknown;
  props?: {
    isComplete?: boolean;
  };
  type: string;
};

type CanvasStatus = {
  activeColor: string;
  drawShapeCount: number;
  editorInstance: string;
  mountCount: number;
  pageShapeCount: number;
  toolPath: string;
};

const CREATIVE_COVE_BASE_PATH = "/creative-cove-asset-handover";
const ENABLE_CREATIVE_COVE_PERSISTENCE = false;
const CREATIVE_COVE_PERSISTENCE_KEY = "goodkiddo-creative-cove";
const MAX_DEBUG_ENTRIES = 24;

const BACKGROUND_ASSETS = {
  bubble: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/bubble.webp`,
  crabby: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/crabby.webp`,
  largeRocks: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/large-rocks.webp`,
  orangeBubbleCoral: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/orange-bubble-coral.webp`,
  orangeStarfish: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/orange-starfish.webp`,
  pageTitleCard: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/page-title-card.webp`,
  pinkCoral: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/pink-coral.webp`,
  pinkStarfish: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/pink-starfish.webp`,
  purpleBubbleCoral: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/purple-bubble-coral.webp`,
  purpleCoral: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/purple-coral.webp`,
  seaweed1: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/seaweed-1.webp`,
  seaweed2: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/seaweed-2.webp`,
  seaweed3: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/seaweed-3.webp`,
  seaweed4: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/seaweed-4.webp`,
  smallRock: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/small-rock.webp`,
  stonePlatform: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/stone-platform.webp`,
  uiBackground: `${CREATIVE_COVE_BASE_PATH}/ui-background-images/ui-background.webp`,
} as const;

const MASK_ASSETS = {
  blueSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/blue.webp`,
  blackSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/black.webp`,
  brownSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/brown.webp`,
  coloursIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/colours-icon.webp`,
  eraserIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/eraser-icon.webp`,
  greenSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/green.webp`,
  orangeSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/orange.webp`,
  pencilIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/pencil-icon.webp`,
  pencilThicknessMedium:
    `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/pencil-thickness-medium.webp`,
  pencilThicknessThick:
    `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/pencil-thickness-thick.webp`,
  pencilThicknessThin:
    `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/pencil-thickness-thin.webp`,
  pinkSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/pink.webp`,
  purpleSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/purple.webp`,
  redSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/red.webp`,
  refreshIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/refresh-icon.webp`,
  saveIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/save-icon.webp`,
  undoIcon: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/button-icons/undo-icon.webp`,
  whiteSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/white.webp`,
  yellowSwatch: `${CREATIVE_COVE_BASE_PATH}/tldraw-masks-and-buttons/colour-swatches/yellow.webp`,
} as const;

const TOOLBAR_BUTTONS: ToolbarButtonConfig[] = [
  { action: "tool", iconSrc: MASK_ASSETS.pencilIcon, id: "draw", label: "Pen" },
  { action: "tool", iconSrc: MASK_ASSETS.eraserIcon, id: "eraser", label: "Eraser" },
  { action: "undo", iconSrc: MASK_ASSETS.undoIcon, id: "undo", label: "Undo" },
  { action: "tool", iconSrc: MASK_ASSETS.coloursIcon, id: "colour-picker", label: "Colours" },
  { action: "clear", iconSrc: MASK_ASSETS.refreshIcon, id: "clear", label: "Refresh" },
  { action: "save", iconSrc: MASK_ASSETS.saveIcon, id: "save", label: "Save" },
];

const COLOR_SWATCHES: ColorSwatchConfig[] = [
  { id: "blue", imageSrc: MASK_ASSETS.blueSwatch, tldrawColor: "blue" },
  { id: "orange", imageSrc: MASK_ASSETS.orangeSwatch, tldrawColor: "orange" },
  { id: "black", imageSrc: MASK_ASSETS.blackSwatch, tldrawColor: "black" },
  { id: "green", imageSrc: MASK_ASSETS.greenSwatch, tldrawColor: "green" },
  { id: "brown", imageSrc: MASK_ASSETS.brownSwatch, tldrawColor: "orange" },
  { id: "red", imageSrc: MASK_ASSETS.redSwatch, tldrawColor: "red" },
  { id: "purple", imageSrc: MASK_ASSETS.purpleSwatch, tldrawColor: "violet" },
  { id: "pink", imageSrc: MASK_ASSETS.pinkSwatch, tldrawColor: "light-red" },
  { id: "yellow", imageSrc: MASK_ASSETS.yellowSwatch, tldrawColor: "yellow" },
  { id: "white", imageSrc: MASK_ASSETS.whiteSwatch, tldrawColor: "white" },
];

const SIZE_BUTTONS: SizeButtonConfig[] = [
  { iconSrc: MASK_ASSETS.pencilThicknessThin, id: "thin", label: "Thin", tldrawSize: "s" },
  { iconSrc: MASK_ASSETS.pencilThicknessMedium, id: "medium", label: "Medium", tldrawSize: "m" },
  { iconSrc: MASK_ASSETS.pencilThicknessThick, id: "thick", label: "Thick", tldrawSize: "l" },
];

const FAR_BUBBLES: BubbleSpec[] = [
  { delay: "0s", drift: "10px", duration: "17s", left: "11%", opacity: 0.28, size: "0.9rem", start: "74%" },
  { delay: "1.3s", drift: "-14px", duration: "14s", left: "21%", opacity: 0.33, size: "1.5rem", start: "84%" },
  { delay: "2.8s", drift: "12px", duration: "18s", left: "35%", opacity: 0.24, size: "1.1rem", start: "76%" },
  { delay: "0.8s", drift: "-10px", duration: "15s", left: "49%", opacity: 0.29, size: "1.8rem", start: "82%" },
  { delay: "3.4s", drift: "16px", duration: "16s", left: "64%", opacity: 0.27, size: "1.2rem", start: "79%" },
  { delay: "1.9s", drift: "-12px", duration: "13s", left: "78%", opacity: 0.32, size: "1.4rem", start: "86%" },
  { delay: "4.1s", drift: "11px", duration: "12s", left: "87%", opacity: 0.23, size: "1rem", start: "81%" },
];

const FOREGROUND_BUBBLES: BubbleSpec[] = [
  { delay: "0.5s", drift: "-18px", duration: "11s", left: "14%", opacity: 0.62, size: "1.45rem", start: "92%" },
  { delay: "2.1s", drift: "14px", duration: "10s", left: "27%", opacity: 0.58, size: "2rem", start: "88%" },
  { delay: "1.2s", drift: "-20px", duration: "12s", left: "41%", opacity: 0.54, size: "1.3rem", start: "90%" },
  { delay: "3.7s", drift: "16px", duration: "9s", left: "56%", opacity: 0.57, size: "2.1rem", start: "94%" },
  { delay: "1.6s", drift: "-15px", duration: "10.5s", left: "71%", opacity: 0.49, size: "1.25rem", start: "87%" },
  { delay: "4.5s", drift: "12px", duration: "11.5s", left: "83%", opacity: 0.6, size: "1.8rem", start: "91%" },
];

const DECORATIVE_ASSETS: DecorativeAsset[] = [
  { className: "creative-cove-decor creative-cove-decor--large-rocks", loading: "eager", src: BACKGROUND_ASSETS.largeRocks },
  { className: "creative-cove-decor creative-cove-decor--small-rock-a", src: BACKGROUND_ASSETS.smallRock },
  { className: "creative-cove-decor creative-cove-decor--small-rock-b", src: BACKGROUND_ASSETS.smallRock },
  { className: "creative-cove-decor creative-cove-decor--small-rock-c", src: BACKGROUND_ASSETS.smallRock },
  { className: "creative-cove-decor creative-cove-decor--small-rock-d", src: BACKGROUND_ASSETS.smallRock },
  { className: "creative-cove-decor creative-cove-decor--small-rock-e", src: BACKGROUND_ASSETS.smallRock },
  { className: "creative-cove-decor creative-cove-decor--pink-coral", loading: "eager", src: BACKGROUND_ASSETS.pinkCoral },
  { className: "creative-cove-decor creative-cove-decor--purple-coral", src: BACKGROUND_ASSETS.purpleCoral },
  { className: "creative-cove-decor creative-cove-decor--orange-bubble-coral", src: BACKGROUND_ASSETS.orangeBubbleCoral },
  { className: "creative-cove-decor creative-cove-decor--purple-bubble-coral", src: BACKGROUND_ASSETS.purpleBubbleCoral },
  { className: "creative-cove-decor creative-cove-decor--seaweed-1", src: BACKGROUND_ASSETS.seaweed1 },
  { className: "creative-cove-decor creative-cove-decor--seaweed-2", src: BACKGROUND_ASSETS.seaweed2 },
  { className: "creative-cove-decor creative-cove-decor--seaweed-3", src: BACKGROUND_ASSETS.seaweed3 },
  { className: "creative-cove-decor creative-cove-decor--seaweed-4", src: BACKGROUND_ASSETS.seaweed4 },
  { className: "creative-cove-decor creative-cove-decor--pink-starfish", src: BACKGROUND_ASSETS.pinkStarfish },
  { className: "creative-cove-decor creative-cove-decor--orange-starfish", src: BACKGROUND_ASSETS.orangeStarfish },
  { className: "creative-cove-decor creative-cove-decor--stone-platform", loading: "eager", src: BACKGROUND_ASSETS.stonePlatform },
  { className: "creative-cove-decor creative-cove-decor--crabby", loading: "eager", src: BACKGROUND_ASSETS.crabby },
];

function CreativeCoveToolbarButton({
  disabled = false,
  iconSrc,
  isActive = false,
  label,
  onClick,
}: {
  disabled?: boolean;
  iconSrc: string;
  isActive?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isActive}
      className="creative-cove-action-button"
      data-active={isActive ? "true" : "false"}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="creative-cove-action-button__icon-wrap" aria-hidden="true">
        <img alt="" className="creative-cove-action-button__icon" loading="lazy" src={iconSrc} />
      </span>
      <span className="creative-cove-action-button__label">{label}</span>
    </button>
  );
}

function CreativeCoveColorButton({
  imageSrc,
  isActive,
  label,
  onClick,
}: {
  imageSrc: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={isActive}
      className="creative-cove-swatch-button"
      data-active={isActive ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      <img alt="" className="creative-cove-swatch-button__image" loading="lazy" src={imageSrc} />
    </button>
  );
}

function CreativeCoveThicknessButton({
  iconSrc,
  isActive,
  label,
  onClick,
}: {
  iconSrc: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isActive}
      className="creative-cove-thickness-button"
      data-active={isActive ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      <span className="creative-cove-thickness-button__icon-wrap" aria-hidden="true">
        <img alt="" className="creative-cove-thickness-button__icon" loading="lazy" src={iconSrc} />
      </span>
      <span className="creative-cove-thickness-button__label">{label}</span>
    </button>
  );
}

export function CreativeCoveCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeColor, setActiveColor] = useState<TLDefaultColorStyle>("blue");
  const [activeSize, setActiveSize] = useState<TLDefaultSizeStyle>("m");
  const [activeTool, setActiveTool] = useState<CreativeToolId>("draw");
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>({
    activeColor: "blue",
    drawShapeCount: 0,
    editorInstance: "editor:none store:none",
    mountCount: 0,
    pageShapeCount: 0,
    toolPath: "loading",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editorDebugLog, setEditorDebugLog] = useState<EditorDebugEntry[]>([]);
  const [pointerDebugLog, setPointerDebugLog] = useState<PointerDebugEntry[]>([]);
  const editorRef = useRef<Editor | null>(null);
  const visibleEditorRef = useRef<Editor | null>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeColorRef = useRef(activeColor);
  const activeSizeRef = useRef(activeSize);
  const activeToolRef = useRef(activeTool);
  const mountCountRef = useRef(0);
  const objectIdsRef = useRef(new WeakMap<object, number>());
  const nextObjectIdRef = useRef(1);

  function appendEditorDebugEntry(entry: EditorDebugEntry) {
    setEditorDebugLog((current) => [entry, ...current].slice(0, MAX_DEBUG_ENTRIES));
  }

  function getObjectInstanceId(target: object | null | undefined) {
    if (!target) {
      return "none";
    }

    const existingId = objectIdsRef.current.get(target);

    if (existingId) {
      return `#${existingId}`;
    }

    const nextId = nextObjectIdRef.current;
    nextObjectIdRef.current += 1;
    objectIdsRef.current.set(target, nextId);
    return `#${nextId}`;
  }

  function getEditorStore(editorInstance: Editor | null | undefined) {
    const candidate = (editorInstance as (Editor & { store?: object | null }) | null | undefined)?.store;
    return candidate && typeof candidate === "object" ? candidate : null;
  }

  function getEditorInstanceLabel(editorInstance: Editor | null | undefined) {
    return `editor:${getObjectInstanceId(editorInstance)} store:${getObjectInstanceId(getEditorStore(editorInstance))}`;
  }

  function getEditorRelationshipSummary(targetEditor: Editor | null | undefined) {
    const refEditor = editorRef.current;
    const visibleEditorInstance = visibleEditorRef.current;

    return [
      `target ${getEditorInstanceLabel(targetEditor)}`,
      `ref ${getEditorInstanceLabel(refEditor)}`,
      `visible ${getEditorInstanceLabel(visibleEditorInstance)}`,
      `ref===visible ${refEditor === visibleEditorInstance}`,
      `target===ref ${targetEditor === refEditor}`,
      `target===visible ${targetEditor === visibleEditorInstance}`,
    ].join(" | ");
  }

  function logToolbarCommand(command: string, targetEditor: Editor | null | undefined, detail: string) {
    appendEditorDebugEntry({
      detail: `${detail} | ${getEditorRelationshipSummary(targetEditor)}`,
      event: `toolbar:${command}`,
      tool: targetEditor?.getPath() ?? "no-editor",
    });
  }

  useEffect(() => {
    activeColorRef.current = activeColor;
    activeSizeRef.current = activeSize;
    activeToolRef.current = activeTool;
  }, [activeColor, activeSize, activeTool]);

  useEffect(() => {
    visibleEditorRef.current = editor;

    appendEditorDebugEntry({
      detail: getEditorRelationshipSummary(editor),
      event: "visible-editor-sync",
      tool: editor?.getPath() ?? "no-editor",
    });
  }, [editor]);

  useEffect(() => {
    const sceneElement = sceneRef.current;
    const stageElement = stageRef.current;
    const currentEditor = editor;

    if (!sceneElement || !stageElement) {
      return;
    }

    const loggedEvents = new Set<string>();
    const maxEntries = 18;

    function describeTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) {
        return "unknown";
      }

      const className =
        typeof target.className === "string"
          ? target.className.trim().replace(/\s+/g, ".")
          : "";

      return className ? `${target.tagName.toLowerCase()}.${className}` : target.tagName.toLowerCase();
    }

    function appendDebugEntry(layer: string, phase: "capture" | "bubble", event: PointerEvent) {
      const roundedX = Math.round(event.clientX);
      const roundedY = Math.round(event.clientY);
      const key = [
        layer,
        phase,
        event.type,
        event.pointerType || "unknown",
        event.pointerId,
        roundedX,
        roundedY,
        event.buttons,
      ].join("|");

      if (loggedEvents.has(key)) {
        return;
      }

      loggedEvents.add(key);

      setPointerDebugLog((current) => {
        const nextEntry: PointerDebugEntry = {
          defaultPrevented: event.defaultPrevented,
          layer,
          phase,
          pointerType: event.pointerType || "unknown",
          target: describeTarget(event.target),
          type: event.type as PointerDebugEntry["type"],
        };

        return [nextEntry, ...current].slice(0, maxEntries);
      });
    }

    function attachPointerDebugListeners(
      element: Element,
      layer: string,
      listeners: Array<() => void>,
    ) {
      const handler = (phase: "capture" | "bubble"): EventListener => (event) => {
        if (!(event instanceof PointerEvent)) {
          return;
        }

        appendDebugEntry(layer, phase, event);
      };

      const captureHandler = handler("capture");
      const bubbleHandler = handler("bubble");

      for (const eventName of ["pointercancel", "pointerdown", "pointermove", "pointerup"] as const) {
        element.addEventListener(eventName, captureHandler, { capture: true, passive: true });
        element.addEventListener(eventName, bubbleHandler, { passive: true });
        listeners.push(() => element.removeEventListener(eventName, captureHandler, true));
        listeners.push(() => element.removeEventListener(eventName, bubbleHandler));
      }
    }

    function completeOnPointerCancel(event: PointerEvent) {
      if (!currentEditor || event.pointerType !== "touch" || !currentEditor.inputs.getIsDragging()) {
        return;
      }

      appendEditorDebugEntry({
        detail: `Forced complete after DOM pointercancel | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "pointercancel->complete",
        tool: currentEditor.getCurrentToolId(),
      });

      currentEditor.complete();
    }

    const cleanupCallbacks: Array<() => void> = [];
    attachPointerDebugListeners(sceneElement, "scene", cleanupCallbacks);
    attachPointerDebugListeners(stageElement, "stage", cleanupCallbacks);
    stageElement.addEventListener("pointercancel", completeOnPointerCancel, { passive: true });
    cleanupCallbacks.push(() =>
      stageElement.removeEventListener("pointercancel", completeOnPointerCancel),
    );

    const tlRoot =
      stageElement.querySelector(".tl-container") ??
      stageElement.querySelector(".tl-canvas") ??
      stageElement.querySelector("[data-tldraw]");

    if (tlRoot) {
      attachPointerDebugListeners(tlRoot, "tldraw-root", cleanupCallbacks);
    }

    const tlCanvas = stageElement.querySelector(".tl-canvas");
    if (tlCanvas) {
      attachPointerDebugListeners(tlCanvas, "tldraw-canvas", cleanupCallbacks);
    }

    const tlBackgroundWrapper = stageElement.querySelector(".tl-background__wrapper");
    if (tlBackgroundWrapper) {
      attachPointerDebugListeners(
        tlBackgroundWrapper,
        "tldraw-background-wrapper",
        cleanupCallbacks,
      );
    }

    const tlBackground = stageElement.querySelector(".tl-background");
    if (tlBackground) {
      attachPointerDebugListeners(tlBackground, "tldraw-background", cleanupCallbacks);
    }

    const tlHtmlLayer = stageElement.querySelector(".tl-html-layer");
    if (tlHtmlLayer) {
      attachPointerDebugListeners(tlHtmlLayer, "tldraw-html-layer", cleanupCallbacks);
    }

    const handleVisibilityChange = () => {
      if (
        !currentEditor ||
        document.visibilityState !== "hidden" ||
        !currentEditor.inputs.getIsDragging()
      ) {
        return;
      }

      setEditorDebugLog((current) => [
        {
          detail: "Forced complete on page hide",
          event: "visibilitychange->complete",
          tool: currentEditor.getCurrentToolId(),
        },
        ...current,
      ].slice(0, 18));

      currentEditor.complete();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    cleanupCallbacks.push(() =>
      document.removeEventListener("visibilitychange", handleVisibilityChange),
    );

    return () => {
      appendEditorDebugEntry({
        detail: `Pointer listeners cleanup | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "pointer-debug-cleanup",
        tool: currentEditor?.getPath() ?? "no-editor",
      });
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    appendEditorDebugEntry({
      detail: `Applying tool/style sync | tool:${activeTool} color:${activeColor} size:${activeSize} | ${getEditorRelationshipSummary(editor)}`,
      event: "effect-apply-style",
      tool: editor.getPath(),
    });

    editor.setCurrentTool(activeTool);
    editor.setStyleForNextShapes(DefaultColorStyle, activeColor);
    editor.setStyleForNextShapes(DefaultSizeStyle, activeSize);
  }, [activeColor, activeSize, activeTool, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentEditor = editor;

    function getToolPath() {
      return currentEditor.getPath();
    }

    function refreshCanvasStatus(reason: string) {
      const pageShapes = currentEditor.getCurrentPageShapes();
      const drawShapes = pageShapes.filter((shape) => shape.type === "draw");

      setCanvasStatus({
        activeColor: activeColorRef.current,
        drawShapeCount: drawShapes.length,
        editorInstance: getEditorInstanceLabel(currentEditor),
        mountCount: mountCountRef.current,
        pageShapeCount: pageShapes.length,
        toolPath: getToolPath(),
      });

      appendEditorDebugEntry({
        detail: `${reason} | page:${pageShapes.length} draw:${drawShapes.length} color:${activeColorRef.current} | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "status",
        tool: getToolPath(),
      });
    }

    function finalizeIncompleteDrawShapes(reason: string) {
      const incompleteDrawShapes = Array.from(currentEditor.getCurrentPageShapeIds())
        .map((shapeId) => currentEditor.getShape(shapeId) as DrawShapeLike | undefined)
        .filter((shape): shape is DrawShapeLike => {
          return !!shape && shape.type === "draw" && shape.props?.isComplete !== true;
        });

      if (!incompleteDrawShapes.length) {
        appendEditorDebugEntry({
          detail: `0 incomplete on ${reason} | ${getEditorRelationshipSummary(currentEditor)}`,
          event: "draw-complete-scan",
          tool: getToolPath(),
        });
        return;
      }

      currentEditor.updateShapes(
        incompleteDrawShapes.map((shape) => ({
          id: shape.id,
          props: { isComplete: true },
          type: "draw" as const,
        })) as any,
      );

      appendEditorDebugEntry({
        detail: `${incompleteDrawShapes.length} forced complete on ${reason} | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "draw-complete-fix",
        tool: getToolPath(),
      });
    }

    function restoreActiveTool(reason: string) {
      const desiredTool = activeToolRef.current;

      window.setTimeout(() => {
        if (desiredTool !== "draw" && desiredTool !== "eraser") {
          return;
        }

        const currentTool = currentEditor.getCurrentToolId();

        if (currentTool === desiredTool) {
          return;
        }

        currentEditor.setCurrentTool(desiredTool);
        currentEditor.setStyleForNextShapes(DefaultColorStyle, activeColorRef.current);
        currentEditor.setStyleForNextShapes(DefaultSizeStyle, activeSizeRef.current);

        appendEditorDebugEntry({
          detail: `${reason} | ${getEditorRelationshipSummary(currentEditor)}`,
          event: "tool-restore",
          tool: `${getToolPath()} ${currentTool}->${desiredTool}`,
        });
        refreshCanvasStatus(`restore:${reason}`);
      }, 0);
    }

    const handleEditorEvent = (info: any) => {
      if (info.type === "pointer") {
        appendEditorDebugEntry({
          detail: `${info.target ?? "unknown"} | ${getEditorRelationshipSummary(currentEditor)}`,
          event: info.name,
          tool: getToolPath(),
        });

        if (info.name === "pointer_up") {
          window.setTimeout(() => finalizeIncompleteDrawShapes("pointer_up:0ms"), 0);
          window.setTimeout(() => finalizeIncompleteDrawShapes("pointer_up:250ms"), 250);
          window.setTimeout(() => refreshCanvasStatus("pointer_up"), 80);
          restoreActiveTool("pointer_up");
        }

        return;
      }

      if (info.type === "misc" && ["cancel", "complete", "interrupt"].includes(info.name)) {
        appendEditorDebugEntry({
          detail: `editor lifecycle | ${getEditorRelationshipSummary(currentEditor)}`,
          event: info.name,
          tool: getToolPath(),
        });

        if (info.name === "complete") {
          window.setTimeout(() => finalizeIncompleteDrawShapes("complete"), 0);
        }

        window.setTimeout(() => refreshCanvasStatus(info.name), 0);
        restoreActiveTool(info.name);
        return;
      }

      if (info.type === "click" && info.name === "double_click") {
        appendEditorDebugEntry({
          detail: `click sequence | ${getEditorRelationshipSummary(currentEditor)}`,
          event: info.name,
          tool: getToolPath(),
        });
      }
    };

    const handleCreatedShapes = (records: Array<{ id: string; type?: string; typeName?: string }>) => {
      const shapes = records.filter((record) => record.typeName === "shape");

      if (!shapes.length) {
        return;
      }

      appendEditorDebugEntry({
        detail: `${shapes.map((shape) => shape.type ?? shape.id).join(", ")} | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "created-shapes",
        tool: getToolPath(),
      });
      refreshCanvasStatus("created-shapes");
    };

    const handleDeletedShapes = (shapeIds: string[]) => {
      appendEditorDebugEntry({
        detail: `${shapeIds.length} removed | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "deleted-shapes",
        tool: getToolPath(),
      });
      refreshCanvasStatus("deleted-shapes");
    };

    const handleChange = (entry: {
      changes: { removed: Record<string, { id: string; typeName?: string }> };
      source: string;
    }) => {
      const removedShapes = Object.values(entry.changes.removed).filter(
        (record) => record.typeName === "shape",
      );

      if (!removedShapes.length) {
        return;
      }

      appendEditorDebugEntry({
        detail: `${removedShapes.length} removed via ${entry.source} | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "change",
        tool: getToolPath(),
      });
      refreshCanvasStatus(`change:${entry.source}`);
    };

    currentEditor.on("event", handleEditorEvent);
    currentEditor.on("created-shapes", handleCreatedShapes);
    currentEditor.on("deleted-shapes", handleDeletedShapes);
    currentEditor.on("change", handleChange);
    appendEditorDebugEntry({
      detail: `Subscribed editor listeners | ${getEditorRelationshipSummary(currentEditor)}`,
      event: "editor-subscribe",
      tool: getToolPath(),
    });
    refreshCanvasStatus("effect-start");

    return () => {
      appendEditorDebugEntry({
        detail: `Unsubscribing editor listeners | ${getEditorRelationshipSummary(currentEditor)}`,
        event: "editor-cleanup",
        tool: getToolPath(),
      });
      currentEditor.off("event", handleEditorEvent);
      currentEditor.off("created-shapes", handleCreatedShapes);
      currentEditor.off("deleted-shapes", handleDeletedShapes);
      currentEditor.off("change", handleChange);
    };
  }, [editor]);

  function handleToolChange(toolId: CreativeToolId) {
    logToolbarCommand("tool", editor, `nextTool:${toolId}`);
    setActiveTool(toolId);
  }

  function handleEditorMount(editorInstance: Editor) {
    mountCountRef.current += 1;
    editorRef.current = editorInstance;
    setEditor(editorInstance);
    setCanvasStatus({
      activeColor: activeColorRef.current,
      drawShapeCount: 0,
      editorInstance: getEditorInstanceLabel(editorInstance),
      mountCount: mountCountRef.current,
      pageShapeCount: 0,
      toolPath: editorInstance.getPath(),
    });
    appendEditorDebugEntry({
      detail: `mount #${mountCountRef.current} | persistence:${ENABLE_CREATIVE_COVE_PERSISTENCE ? CREATIVE_COVE_PERSISTENCE_KEY : "disabled"} | ${getEditorRelationshipSummary(editorInstance)}`,
      event: "editor-mount",
      tool: editorInstance.getPath(),
    });
  }

  function handleColorChange(color: TLDefaultColorStyle) {
    logToolbarCommand("color", editor, `nextColor:${color}`);

    if (editor) {
      editor.setStyleForSelectedShapes(DefaultColorStyle, color);
    }

    setActiveColor(color);
    setActiveTool("draw");
  }

  function handleSizeChange(size: TLDefaultSizeStyle) {
    logToolbarCommand("size", editor, `nextSize:${size}`);

    if (editor) {
      editor.setStyleForSelectedShapes(DefaultSizeStyle, size);
    }

    setActiveSize(size);
    setActiveTool("draw");
  }

  function handleUndo() {
    if (!editor) {
      logToolbarCommand("undo", editor, "blocked:no-editor");
      return;
    }

    logToolbarCommand("undo", editor, "perform");
    editor.undo();
  }

  function handleClear() {
    if (!editor) {
      logToolbarCommand("clear", editor, "blocked:no-editor");
      return;
    }

    const pageShapeIds = Array.from(editor.getCurrentPageShapeIds());

    if (!pageShapeIds.length) {
      logToolbarCommand("clear", editor, "blocked:empty-page");
      return;
    }

    if (!window.confirm("Clear this drawing?")) {
      logToolbarCommand("clear", editor, "cancelled:confirm");
      return;
    }

    logToolbarCommand("clear", editor, `perform:${pageShapeIds.length}-shapes`);
    editor.deleteShapes(pageShapeIds);
    editor.selectNone();
    setActiveTool("draw");
  }

  async function handleSave() {
    if (!editor || isSaving) {
      logToolbarCommand("save", editor, isSaving ? "blocked:isSaving" : "blocked:no-editor");
      return;
    }

    const pageShapeIds = Array.from(editor.getCurrentPageShapeIds());

    if (!pageShapeIds.length) {
      logToolbarCommand("save", editor, "blocked:empty-page");
      return;
    }

    logToolbarCommand("save", editor, `perform:${pageShapeIds.length}-shapes`);
    setIsSaving(true);

    try {
      await exportAs(editor, pageShapeIds, {
        format: "png",
        name: "creative-cove-art",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="creative-cove-shell">
      <section className="creative-cove-scene" ref={sceneRef}>
        <img
          alt=""
          aria-hidden="true"
          className="creative-cove-background"
          fetchPriority="high"
          src={BACKGROUND_ASSETS.uiBackground}
        />

        <div className="creative-cove-bubble-layer creative-cove-bubble-layer--far" aria-hidden="true">
          {FAR_BUBBLES.map((bubble, index) => (
            <img
              key={`far-bubble-${index}`}
              alt=""
              className="creative-cove-bubble"
              loading="lazy"
              src={BACKGROUND_ASSETS.bubble}
              style={
                {
                  "--bubble-delay": bubble.delay,
                  "--bubble-drift": bubble.drift,
                  "--bubble-duration": bubble.duration,
                  "--bubble-left": bubble.left,
                  "--bubble-opacity": bubble.opacity,
                  "--bubble-size": bubble.size,
                  "--bubble-start": bubble.start,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="creative-cove-decor-layer" aria-hidden="true">
          {DECORATIVE_ASSETS.map((asset) => (
            <img
              key={asset.className}
              alt=""
              className={asset.className}
              loading={asset.loading ?? "lazy"}
              src={asset.src}
            />
          ))}
        </div>

        <div
          className="creative-cove-bubble-layer creative-cove-bubble-layer--foreground"
          aria-hidden="true"
        >
          {FOREGROUND_BUBBLES.map((bubble, index) => (
            <img
              key={`foreground-bubble-${index}`}
              alt=""
              className="creative-cove-bubble"
              loading="lazy"
              src={BACKGROUND_ASSETS.bubble}
              style={
                {
                  "--bubble-delay": bubble.delay,
                  "--bubble-drift": bubble.drift,
                  "--bubble-duration": bubble.duration,
                  "--bubble-left": bubble.left,
                  "--bubble-opacity": bubble.opacity,
                  "--bubble-size": bubble.size,
                  "--bubble-start": bubble.start,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <img
          alt="Creative Cove. Draw anything. Be creative."
          className="creative-cove-title-card"
          fetchPriority="high"
          src={BACKGROUND_ASSETS.pageTitleCard}
        />

        <div className="creative-cove-ui">
          <div className="creative-cove-canvas-shell">
            <div className="creative-cove-drawing-stage" ref={stageRef}>
              <Tldraw
                autoFocus
                hideUi
                onMount={handleEditorMount}
                persistenceKey={
                  ENABLE_CREATIVE_COVE_PERSISTENCE ? CREATIVE_COVE_PERSISTENCE_KEY : undefined
                }
              />
            </div>
          </div>

          <div className="creative-cove-controls">
            <div className="creative-cove-toolbar" aria-label="Creative Cove tools" role="toolbar">
              {TOOLBAR_BUTTONS.map((button) => {
                const isActive =
                  (button.action === "tool" && button.id === activeTool) ||
                  (button.id === "colour-picker" && activeTool === "draw");

                return (
                  <CreativeCoveToolbarButton
                    key={button.id}
                    disabled={!editor || (button.action === "save" && isSaving)}
                    iconSrc={button.iconSrc}
                    isActive={isActive}
                    label={button.label}
                    onClick={() => {
                      switch (button.action) {
                        case "tool":
                          if (button.id === "draw" || button.id === "eraser") {
                            handleToolChange(button.id);
                            return;
                          }

                          setActiveTool("draw");
                          return;
                        case "undo":
                          handleUndo();
                          return;
                        case "clear":
                          handleClear();
                          return;
                        case "save":
                          void handleSave();
                          return;
                      }
                    }}
                  />
                );
              })}
            </div>

            <div className="creative-cove-swatches" aria-label="Colour swatches" role="group">
              {COLOR_SWATCHES.map((swatch) => (
                <CreativeCoveColorButton
                  key={swatch.id}
                  imageSrc={swatch.imageSrc}
                  isActive={activeColor === swatch.tldrawColor}
                  label={swatch.id}
                  onClick={() => handleColorChange(swatch.tldrawColor)}
                />
              ))}
            </div>

            <div className="creative-cove-thickness-row" aria-label="Pen thickness" role="group">
              {SIZE_BUTTONS.map((sizeButton) => (
                <CreativeCoveThicknessButton
                  key={sizeButton.id}
                  iconSrc={sizeButton.iconSrc}
                  isActive={activeSize === sizeButton.tldrawSize}
                  label={sizeButton.label}
                  onClick={() => handleSizeChange(sizeButton.tldrawSize)}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="creative-cove-debug-panel" aria-live="polite">
          <p className="creative-cove-debug-panel__title">Pointer debug</p>
          <p className="creative-cove-debug-panel__summary">
            {pointerDebugLog.length
              ? "DOM events first, editor events below."
              : "Touch the drawing area to log canvas and editor pointer events."}
          </p>
          <p className="creative-cove-debug-panel__summary">
            {`status: ${canvasStatus.toolPath} | ${canvasStatus.editorInstance} | mount ${canvasStatus.mountCount} | page ${canvasStatus.pageShapeCount} | draw ${canvasStatus.drawShapeCount} | color ${canvasStatus.activeColor}`}
          </p>
          <div className="creative-cove-debug-panel__log creative-cove-debug-panel__log--pointer">
            {pointerDebugLog.map((entry, index) => (
              <div className="creative-cove-debug-panel__entry" key={`${entry.layer}-${entry.phase}-${entry.type}-${index}`}>
                <span>{entry.type}</span>
                <span>{entry.layer}</span>
                <span>{entry.phase}</span>
                <span>{entry.pointerType}</span>
                <span>{entry.defaultPrevented ? "prevented" : "open"}</span>
                <span>{entry.target}</span>
              </div>
            ))}
          </div>
          <p className="creative-cove-debug-panel__summary">Editor event stream</p>
          <div className="creative-cove-debug-panel__log creative-cove-debug-panel__log--editor">
            {editorDebugLog.length ? (
              editorDebugLog.map((entry, index) => (
                <div className="creative-cove-debug-panel__entry" key={`${entry.event}-${entry.tool}-${index}`}>
                  <span>{entry.event}</span>
                  <span>{entry.tool}</span>
                  <span>{entry.detail}</span>
                </div>
              ))
            ) : (
              <div className="creative-cove-debug-panel__entry">
                <span>No editor events logged yet.</span>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
