"use client";

import { useEffect, useState, type CSSProperties } from "react";
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

const CREATIVE_COVE_BASE_PATH = "/creative-cove-asset-handover";

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setCurrentTool(activeTool);
    editor.setStyleForNextShapes(DefaultColorStyle, activeColor);
    editor.setStyleForNextShapes(DefaultSizeStyle, activeSize);
  }, [activeColor, activeSize, activeTool, editor]);

  function handleToolChange(toolId: CreativeToolId) {
    setActiveTool(toolId);
  }

  function handleColorChange(color: TLDefaultColorStyle) {
    if (editor) {
      editor.setStyleForSelectedShapes(DefaultColorStyle, color);
    }

    setActiveColor(color);
    setActiveTool("draw");
  }

  function handleSizeChange(size: TLDefaultSizeStyle) {
    if (editor) {
      editor.setStyleForSelectedShapes(DefaultSizeStyle, size);
    }

    setActiveSize(size);
    setActiveTool("draw");
  }

  function handleUndo() {
    if (!editor) {
      return;
    }

    editor.undo();
  }

  function handleClear() {
    if (!editor) {
      return;
    }

    const pageShapeIds = Array.from(editor.getCurrentPageShapeIds());

    if (!pageShapeIds.length) {
      return;
    }

    if (!window.confirm("Clear this drawing?")) {
      return;
    }

    editor.deleteShapes(pageShapeIds);
    editor.selectNone();
    setActiveTool("draw");
  }

  async function handleSave() {
    if (!editor || isSaving) {
      return;
    }

    const pageShapeIds = Array.from(editor.getCurrentPageShapeIds());

    if (!pageShapeIds.length) {
      return;
    }

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
      <section className="creative-cove-scene">
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
            <div className="creative-cove-drawing-stage">
              <Tldraw autoFocus hideUi onMount={setEditor} />
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
      </section>
    </div>
  );
}
