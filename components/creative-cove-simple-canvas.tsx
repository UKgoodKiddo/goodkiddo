"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

type CreativeCoveSimpleCanvasProps = {
  className?: string;
  color: string;
  size: number;
  tool: "draw" | "eraser";
};

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  color: string;
  points: Point[];
  size: number;
  tool: "draw" | "eraser";
};

export type CreativeCoveSimpleCanvasHandle = {
  clear: () => void;
  hasStrokes: () => boolean;
  save: () => void;
  undo: () => void;
};

const BACKGROUND_COLOR = "#ffffff";

function getCreativeCoveExportName() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    "-",
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");

  return `creative-cove-art-${stamp}.png`;
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  rect: { width: number; height: number },
) {
  if (!stroke.points.length) {
    return;
  }

  context.save();
  context.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.tool === "eraser" ? "#000000" : stroke.color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.size;

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    const radius = stroke.size / 2;
    context.beginPath();
    context.arc(point.x, point.y, Math.max(radius, 0.5), 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let index = 1; index < stroke.points.length; index += 1) {
    const point = stroke.points[index];
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.restore();
}

export const CreativeCoveSimpleCanvas = forwardRef<
  CreativeCoveSimpleCanvasHandle,
  CreativeCoveSimpleCanvasProps
>(function CreativeCoveSimpleCanvas({ className, color, size, tool }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const surfaceSizeRef = useRef({ height: 1, width: 1 });

  function getContext() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function fillBackground(context: CanvasRenderingContext2D) {
    const { height, width } = surfaceSizeRef.current;
    context.save();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function redrawAllStrokes() {
    const context = getContext();

    if (!context) {
      return;
    }

    fillBackground(context);

    for (const stroke of strokesRef.current) {
      drawStroke(context, stroke, surfaceSizeRef.current);
    }

    if (activeStrokeRef.current) {
      drawStroke(context, activeStrokeRef.current, surfaceSizeRef.current);
    }
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const dpr = window.devicePixelRatio || 1;

    surfaceSizeRef.current = { height, width };
    canvas.width = Math.max(Math.round(width * dpr), 1);
    canvas.height = Math.max(Math.round(height * dpr), 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = getContext();

    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawAllStrokes();
  }

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function finishStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointerIdRef.current !== event.pointerId || !activeStrokeRef.current) {
      return;
    }

    event.preventDefault();

    const finishedStroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    strokesRef.current = [...strokesRef.current, finishedStroke];
    redrawAllStrokes();
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    activeStrokeRef.current = {
      color,
      points: [getPoint(event)],
      size,
      tool,
    };
    redrawAllStrokes();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointerIdRef.current !== event.pointerId || !activeStrokeRef.current) {
      return;
    }

    event.preventDefault();
    activeStrokeRef.current = {
      ...activeStrokeRef.current,
      points: [...activeStrokeRef.current.points, getPoint(event)],
    };
    redrawAllStrokes();
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    finishStroke(event);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLCanvasElement>) {
    finishStroke(event);
  }

  useLayoutEffect(() => {
    resizeCanvas();
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeStrokeRef.current) {
      return;
    }

    activeStrokeRef.current = {
      ...activeStrokeRef.current,
      color,
      size,
      tool,
    };
  }, [color, size, tool]);

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        strokesRef.current = [];
        activeStrokeRef.current = null;
        pointerIdRef.current = null;
        redrawAllStrokes();
      },
      hasStrokes() {
        return strokesRef.current.length > 0;
      },
      save() {
        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        const link = document.createElement("a");
        link.download = getCreativeCoveExportName();
        link.href = canvas.toDataURL("image/png");
        link.click();
      },
      undo() {
        if (!strokesRef.current.length) {
          return;
        }

        strokesRef.current = strokesRef.current.slice(0, -1);
        redrawAllStrokes();
      },
    }),
    [],
  );

  return (
    <div className={className} ref={containerRef}>
      <canvas
        className="creative-cove-simple-canvas__surface"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={canvasRef}
      />
    </div>
  );
});
