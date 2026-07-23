"use client";

import Image from "next/image";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BOOP_POP_PIRATES_ASSETS,
  BOOP_POP_PIRATES_COLLECTIBLE_IDS,
  BOOP_POP_PIRATES_PRELOAD_ASSETS,
  BOOP_POP_PIRATES_REGULAR_BUBBLES,
  getBoopPopPiratesCollectibleById,
  type BoopPopPiratesCollectibleId,
} from "@/lib/boop-pop-pirates";

type BubbleEntity = {
  asset: string;
  bottomPx: number;
  collectibleId: BoopPopPiratesCollectibleId | null;
  driftPx: number;
  durationMs: number;
  id: number;
  kind: "collectible" | "regular";
  label: string;
  leftPx: number;
  risePx: number;
  scale: number;
  sizePx: number;
  swayDurationMs: number;
  swayPx: number;
};

type EffectEntity = {
  id: number;
  kind: "landing" | "pop";
  xPx: number;
  yPx: number;
};

type FallingCollectibleEntity = {
  asset: string;
  durationMs: number;
  id: number;
  itemId: BoopPopPiratesCollectibleId;
  landingX: number;
  landingY: number;
  label: string;
  startX: number;
  startY: number;
};

type WaitingCollectibleEntity = {
  asset: string;
  collectDx: number;
  collectDy: number;
  id: number;
  itemId: BoopPopPiratesCollectibleId;
  label: string;
  status: "collecting" | "waiting";
  xPx: number;
  yPx: number;
};

type StageMetrics = {
  height: number;
  shipHeight: number;
  shipWidth: number;
  width: number;
};

const MAX_ACTIVE_BUBBLES = 12;
const SHIP_TAP_THROTTLE_MS = 180;
const POP_EFFECT_MS = 320;
const LANDING_EFFECT_MS = 420;
const COLLECT_ANIMATION_MS = 260;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getNowMs() {
  return performance.now();
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffleCollectibleCycle() {
  const next = [...BOOP_POP_PIRATES_COLLECTIBLE_IDS];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function loadImageAsset(src: string) {
  return new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

export function BoopPopPiratesGame({
  childId,
  childName,
  initialCollectedCollectibleIds,
}: {
  childId: string;
  childName: string;
  initialCollectedCollectibleIds: BoopPopPiratesCollectibleId[];
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shipRef = useRef<HTMLButtonElement | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const shipXRef = useRef(0);
  const shipDirectionRef = useRef<1 | -1>(1);
  const hasMeasuredShipRef = useRef(false);
  const lastLaunchAtRef = useRef(0);
  const lastAnimationTimeRef = useRef(0);
  const nextBubbleIdRef = useRef(1);
  const nextEffectIdRef = useRef(1);
  const nextCollectibleIdRef = useRef(1);
  const bubbleNodesRef = useRef(new Map<number, HTMLButtonElement>());
  const activeBubblesRef = useRef<BubbleEntity[]>([]);
  const waitingCollectiblesRef = useRef<WaitingCollectibleEntity[]>([]);
  const collectedCollectibleIdsRef = useRef<BoopPopPiratesCollectibleId[]>(
    initialCollectedCollectibleIds,
  );
  const queuedRewardCountRef = useRef(0);
  const owedCollectibleIdRef = useRef<BoopPopPiratesCollectibleId | null>(null);
  const repeatCollectibleCycleRef = useRef<BoopPopPiratesCollectibleId[]>(
    shuffleCollectibleCycle(),
  );
  const lastRegularBubbleIdRef = useRef<string | null>(null);
  const regularPopCountRef = useRef(0);
  const persistenceTimeoutsRef = useRef<number[]>([]);
  const transientTimeoutsRef = useRef<number[]>([]);
  const retryAttemptsRef = useRef(
    new Map<BoopPopPiratesCollectibleId, number>(),
  );
  const persistenceInFlightRef = useRef(
    new Set<BoopPopPiratesCollectibleId>(),
  );
  const [assetsReady, setAssetsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics>({
    height: 844,
    shipHeight: 0,
    shipWidth: 0,
    width: 390,
  });
  const [popCount, setPopCount] = useState(0);
  const [activeBubbles, setActiveBubbles] = useState<BubbleEntity[]>([]);
  const [activeEffects, setActiveEffects] = useState<EffectEntity[]>([]);
  const [fallingCollectibles, setFallingCollectibles] = useState<
    FallingCollectibleEntity[]
  >([]);
  const [waitingCollectibles, setWaitingCollectibles] = useState<
    WaitingCollectibleEntity[]
  >([]);
  const [collectedCollectibleIds, setCollectedCollectibleIds] = useState<
    BoopPopPiratesCollectibleId[]
  >(initialCollectedCollectibleIds);

  const shipBottomOffsetPx = clamp(stageMetrics.height * 0.058, 20, 52);
  const waterlineYPx =
    stageMetrics.height - shipBottomOffsetPx - Math.max(stageMetrics.shipHeight * 0.1, 10);
  const shipPickupTargetYPx =
    stageMetrics.height - shipBottomOffsetPx - Math.max(stageMetrics.shipHeight * 0.48, 48);

  useEffect(() => {
    activeBubblesRef.current = activeBubbles;
  }, [activeBubbles]);

  useEffect(() => {
    waitingCollectiblesRef.current = waitingCollectibles;
  }, [waitingCollectibles]);

  useEffect(() => {
    collectedCollectibleIdsRef.current = collectedCollectibleIds;
  }, [collectedCollectibleIds]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      BOOP_POP_PIRATES_PRELOAD_ASSETS.map((asset) => loadImageAsset(asset)),
    ).then(() => {
      if (!cancelled) {
        setAssetsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    const syncVisibility = () => {
      setIsDocumentVisible(!document.hidden);
    };

    syncReducedMotion();
    syncVisibility();

    mediaQuery.addEventListener("change", syncReducedMotion);
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      mediaQuery.removeEventListener("change", syncReducedMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    const transientTimeouts = transientTimeoutsRef.current;
    const persistenceTimeouts = persistenceTimeoutsRef.current;

    function clearTimeouts(timeoutIds: number[]) {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    }

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      clearTimeouts(transientTimeouts);
      clearTimeouts(persistenceTimeouts);
    };
  }, []);

  function performCollectiblePersistence(collectibleId: BoopPopPiratesCollectibleId) {
    if (persistenceInFlightRef.current.has(collectibleId)) {
      return;
    }

    persistenceInFlightRef.current.add(collectibleId);

    void fetch("/api/child/boop-pop-pirates/collect", {
      body: JSON.stringify({ collectibleId }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Persistence request failed.");
        }

        retryAttemptsRef.current.delete(collectibleId);
      })
      .catch(() => {
        const nextAttempt =
          (retryAttemptsRef.current.get(collectibleId) ?? 0) + 1;
        retryAttemptsRef.current.set(collectibleId, nextAttempt);

        const timeoutId = window.setTimeout(() => {
          persistenceInFlightRef.current.delete(collectibleId);
          performCollectiblePersistence(collectibleId);
        }, Math.min(10_000, 1_000 * 2 ** Math.min(nextAttempt, 3)));

        persistenceTimeoutsRef.current.push(timeoutId);
      })
      .finally(() => {
        if (!retryAttemptsRef.current.has(collectibleId)) {
          persistenceInFlightRef.current.delete(collectibleId);
        }
      });
  }

  const queueCollectiblePersistence = useEffectEvent(
    (collectibleId: BoopPopPiratesCollectibleId) => {
      performCollectiblePersistence(collectibleId);
    },
  );

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const shipRect = shipRef.current?.getBoundingClientRect();

      setStageMetrics((current) => {
        const nextMetrics = {
          height: stageRect.height,
          shipHeight: shipRect?.height ?? current.shipHeight,
          shipWidth: shipRect?.width ?? current.shipWidth,
          width: stageRect.width,
        };

        const maxX = Math.max(0, nextMetrics.width - nextMetrics.shipWidth);

        if (!hasMeasuredShipRef.current && nextMetrics.shipWidth > 0) {
          shipXRef.current = clamp(
            nextMetrics.width * 0.18,
            0,
            maxX,
          );
          hasMeasuredShipRef.current = true;
        } else {
          shipXRef.current = clamp(shipXRef.current, 0, maxX);
        }

        return nextMetrics;
      });
    };

    const scheduleMeasure = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        measure();
        resizeFrameRef.current = null;
      });
    };

    measure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(stage);

    if (shipRef.current) {
      observer.observe(shipRef.current);
    }

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, []);

  useEffect(() => {
    if (!assetsReady || !isDocumentVisible) {
      return;
    }

    const runFrame = (now: number) => {
      if (lastAnimationTimeRef.current === 0) {
        lastAnimationTimeRef.current = now;
      }

      const deltaSeconds = Math.min(
        (now - lastAnimationTimeRef.current) / 1000,
        0.05,
      );
      lastAnimationTimeRef.current = now;

      const shipWidth = stageMetrics.shipWidth;
      const maxX = Math.max(0, stageMetrics.width - shipWidth);
      const travelSpeed = prefersReducedMotion ? 54 : 78;
      let nextX = shipXRef.current + shipDirectionRef.current * travelSpeed * deltaSeconds;

      if (nextX <= 0) {
        nextX = 0;
        shipDirectionRef.current = 1;
      } else if (nextX >= maxX) {
        nextX = maxX;
        shipDirectionRef.current = -1;
      }

      shipXRef.current = nextX;

      if (shipRef.current) {
        shipRef.current.style.transform = `translate3d(${nextX}px, 0, 0)`;
        shipRef.current.style.setProperty(
          "--ship-facing",
          String(shipDirectionRef.current),
        );
      }

      const shipCenterX = nextX + shipWidth / 2;
      const pickupRadius = Math.max(shipWidth * 0.28, 34);
      let crossedCollectible = false;

      for (const collectible of waitingCollectiblesRef.current) {
        if (collectible.status !== "waiting") {
          continue;
        }

        if (Math.abs(shipCenterX - collectible.xPx) > pickupRadius) {
          continue;
        }

        crossedCollectible = true;
        break;
      }

      if (crossedCollectible) {
        setWaitingCollectibles((current) => {
          let changed = false;
          const next = current.map((collectible) => {
            if (collectible.status !== "waiting") {
              return collectible;
            }

            if (Math.abs(shipCenterX - collectible.xPx) > pickupRadius) {
              return collectible;
            }

            changed = true;

            const timeoutId = window.setTimeout(() => {
              setWaitingCollectibles((latest) =>
                latest.filter((entry) => entry.id !== collectible.id),
              );

              if (!collectedCollectibleIdsRef.current.includes(collectible.itemId)) {
                setCollectedCollectibleIds((latest) =>
                  latest.includes(collectible.itemId)
                    ? latest
                    : [...latest, collectible.itemId],
                );
                queueCollectiblePersistence(collectible.itemId);
              }
            }, COLLECT_ANIMATION_MS);

            transientTimeoutsRef.current.push(timeoutId);

            return {
              ...collectible,
              collectDx: shipCenterX - collectible.xPx,
              collectDy: shipPickupTargetYPx - collectible.yPx,
              status: "collecting" as const,
            } satisfies WaitingCollectibleEntity;
          });

          return changed ? next : current;
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(runFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(runFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      lastAnimationTimeRef.current = 0;
    };
  }, [
    assetsReady,
    isDocumentVisible,
    prefersReducedMotion,
    shipPickupTargetYPx,
    stageMetrics.shipWidth,
    stageMetrics.width,
  ]);

  function queueTransientEffect(effect: Omit<EffectEntity, "id">, durationMs: number) {
    const effectId = nextEffectIdRef.current;
    nextEffectIdRef.current += 1;

    setActiveEffects((current) => [...current, { ...effect, id: effectId }]);

    const timeoutId = window.setTimeout(() => {
      setActiveEffects((current) => current.filter((entry) => entry.id !== effectId));
    }, durationMs);

    transientTimeoutsRef.current.push(timeoutId);
  }

  function getBubbleCenter(bubbleId: number) {
    const bubbleNode = bubbleNodesRef.current.get(bubbleId);
    const stageRect = stageRef.current?.getBoundingClientRect();

    if (!bubbleNode || !stageRect) {
      return null;
    }

    const bubbleRect = bubbleNode.getBoundingClientRect();

    return {
      xPx: bubbleRect.left - stageRect.left + bubbleRect.width / 2,
      yPx: bubbleRect.top - stageRect.top + bubbleRect.height / 2,
    };
  }

  function chooseNextCollectibleId() {
    const collectedSet = new Set(collectedCollectibleIdsRef.current);
    const uncollectedIds = BOOP_POP_PIRATES_COLLECTIBLE_IDS.filter(
      (collectibleId) => !collectedSet.has(collectibleId),
    );

    if (uncollectedIds.length > 0) {
      return pickRandom(uncollectedIds);
    }

    if (!repeatCollectibleCycleRef.current.length) {
      repeatCollectibleCycleRef.current = shuffleCollectibleCycle();
    }

    return repeatCollectibleCycleRef.current.shift()!;
  }

  function chooseRegularBubble() {
    const lastBubbleId = lastRegularBubbleIdRef.current;
    const candidates = BOOP_POP_PIRATES_REGULAR_BUBBLES.filter(
      (bubble) => bubble.id !== lastBubbleId,
    );
    const bubble = pickRandom(
      candidates.length > 0 ? candidates : BOOP_POP_PIRATES_REGULAR_BUBBLES,
    );
    lastRegularBubbleIdRef.current = bubble.id;
    return bubble;
  }

  function armMilestoneRewardIfNeeded() {
    queuedRewardCountRef.current += 1;
  }

  function spawnBubble(kind: "collectible" | "regular") {
    const shipWidth = stageMetrics.shipWidth;
    const shipHeight = stageMetrics.shipHeight;
    const emitterX =
      shipXRef.current +
      shipWidth * (shipDirectionRef.current === 1 ? 0.72 : 0.28) +
      randomBetween(-6, 6);
    const emitterY =
      stageMetrics.height -
      shipBottomOffsetPx -
      shipHeight * 0.56 +
      randomBetween(-5, 5);
    const bubbleId = nextBubbleIdRef.current;
    nextBubbleIdRef.current += 1;
    const baseSize = kind === "collectible" ? 74 : 68;
    const bubbleSize = baseSize + randomBetween(0, 16);
    const risePx = emitterY + bubbleSize + 90;

    if (kind === "collectible") {
      const collectibleId = owedCollectibleIdRef.current ?? chooseNextCollectibleId();
      const collectible = getBoopPopPiratesCollectibleById(collectibleId);
      owedCollectibleIdRef.current = collectibleId;
      queuedRewardCountRef.current = Math.max(0, queuedRewardCountRef.current - 1);

      return {
        asset: collectible.bubbleAsset,
        bottomPx: stageMetrics.height - emitterY,
        collectibleId,
        driftPx: randomBetween(-16, 16),
        durationMs: prefersReducedMotion ? 4_600 : 5_700 + randomBetween(0, 500),
        id: bubbleId,
        kind,
        label: `${collectible.label} bubble`,
        leftPx: emitterX,
        risePx,
        scale: 0.98 + randomBetween(0, 0.08),
        sizePx: bubbleSize,
        swayDurationMs: prefersReducedMotion ? 3_600 : 2_400 + randomBetween(0, 900),
        swayPx: prefersReducedMotion ? 4 : 8 + randomBetween(0, 6),
      } satisfies BubbleEntity;
    }

    const regularBubble = chooseRegularBubble();

    return {
      asset: regularBubble.asset,
      bottomPx: stageMetrics.height - emitterY,
      collectibleId: null,
      driftPx: randomBetween(-21, 21),
      durationMs: prefersReducedMotion ? 4_200 : 5_000 + randomBetween(0, 900),
      id: bubbleId,
      kind,
      label: regularBubble.label,
      leftPx: emitterX,
      risePx,
      scale: 0.92 + randomBetween(0, 0.14),
      sizePx: bubbleSize,
      swayDurationMs: prefersReducedMotion ? 3_200 : 2_000 + randomBetween(0, 1_000),
      swayPx: prefersReducedMotion ? 4 : 10 + randomBetween(0, 8),
    } satisfies BubbleEntity;
  }

  function handleShipTap(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !assetsReady ||
      !isDocumentVisible ||
      stageMetrics.shipWidth <= 0 ||
      stageMetrics.shipHeight <= 0 ||
      activeBubblesRef.current.length >= MAX_ACTIVE_BUBBLES
    ) {
      return;
    }

    const now = getNowMs();

    if (now - lastLaunchAtRef.current < SHIP_TAP_THROTTLE_MS) {
      return;
    }

    lastLaunchAtRef.current = now;

    const shouldLaunchCollectible =
      queuedRewardCountRef.current > 0 && owedCollectibleIdRef.current === null;
    const bubble = spawnBubble(shouldLaunchCollectible ? "collectible" : "regular");

    setActiveBubbles((current) =>
      current.length >= MAX_ACTIVE_BUBBLES ? current : [...current, bubble],
    );
  }

  function handleBubbleEscape(bubbleId: number) {
    const bubble = activeBubblesRef.current.find((entry) => entry.id === bubbleId);

    if (!bubble) {
      return;
    }

    if (bubble.kind === "collectible" && bubble.collectibleId) {
      owedCollectibleIdRef.current = bubble.collectibleId;
      queuedRewardCountRef.current += 1;
    }

    setActiveBubbles((current) => current.filter((entry) => entry.id !== bubbleId));
  }

  function handleBubblePop(
    bubbleId: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const bubble = activeBubblesRef.current.find((entry) => entry.id === bubbleId);

    if (!bubble) {
      return;
    }

    const center = getBubbleCenter(bubbleId);
    setActiveBubbles((current) => current.filter((entry) => entry.id !== bubbleId));

    if (center) {
      queueTransientEffect(
        {
          kind: "pop",
          xPx: center.xPx,
          yPx: center.yPx,
        },
        POP_EFFECT_MS,
      );
    }

    setPopCount((current) => current + 1);

    if (bubble.kind === "regular") {
      regularPopCountRef.current += 1;

      if (regularPopCountRef.current % 50 === 0) {
        armMilestoneRewardIfNeeded();
      }

      return;
    }

    if (!center || !bubble.collectibleId) {
      owedCollectibleIdRef.current = null;
      return;
    }

    owedCollectibleIdRef.current = null;

    const collectibleId = bubble.collectibleId;
    const collectible = getBoopPopPiratesCollectibleById(collectibleId);
    const landingPadding = Math.max(stageMetrics.shipWidth * 0.24, 54);
    const landingX = clamp(
      center.xPx + randomBetween(-1, 1) * stageMetrics.width * 0.14,
      landingPadding,
      stageMetrics.width - landingPadding,
    );
    const fallingCollectibleId = nextCollectibleIdRef.current;
    nextCollectibleIdRef.current += 1;

    setFallingCollectibles((current) => [
      ...current,
      {
        asset: collectible.itemAsset,
        durationMs: prefersReducedMotion ? 460 : 700 + randomBetween(0, 180),
        id: fallingCollectibleId,
        itemId: collectibleId,
        landingX,
        landingY: waterlineYPx,
        label: collectible.label,
        startX: center.xPx,
        startY: center.yPx,
      } satisfies FallingCollectibleEntity,
    ]);
  }

  function handleCollectibleLanding(collectibleId: number) {
    setFallingCollectibles((current) => {
      const nextCollectible = current.find((entry) => entry.id === collectibleId);

      if (!nextCollectible) {
        return current;
      }

      queueTransientEffect(
        {
          kind: "landing",
          xPx: nextCollectible.landingX,
          yPx: nextCollectible.landingY,
        },
        LANDING_EFFECT_MS,
      );

      setWaitingCollectibles((waiting) => [
        ...waiting,
        {
          asset: nextCollectible.asset,
          collectDx: 0,
          collectDy: 0,
          id: nextCollectible.id,
          itemId: nextCollectible.itemId,
          label: nextCollectible.label,
          status: "waiting",
          xPx: nextCollectible.landingX,
          yPx: nextCollectible.landingY,
        },
      ]);

      return current.filter((entry) => entry.id !== collectibleId);
    });
  }

  return (
    <div
      className="boop-pop-pirates-shell"
      data-child-id={childId}
      data-hidden={isDocumentVisible ? "false" : "true"}
      data-ready={assetsReady ? "true" : "false"}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <section className="boop-pop-pirates-stage" ref={stageRef}>
        <Image
          alt=""
          aria-hidden="true"
          className="boop-pop-pirates-stage__background"
          fill
          preload
          sizes="100vw"
          src={BOOP_POP_PIRATES_ASSETS.background}
          unoptimized
        />

        <div aria-hidden="true" className="boop-pop-pirates-stage__decor">
          <div className="boop-pop-pirates-seagull-track">
            <Image
              alt=""
              className="boop-pop-pirates-seagull"
              height={220}
              sizes="(max-width: 640px) 18vw, 120px"
              src={BOOP_POP_PIRATES_ASSETS.seaGull}
              unoptimized
              width={220}
            />
          </div>
        </div>

        <div className="boop-pop-pirates-counter" role="status" aria-live="polite">
          <span className="boop-pop-pirates-counter__label">Pops</span>
          <span
            aria-label={`${popCount} pops`}
            className="boop-pop-pirates-counter__value"
          >
            {popCount}
          </span>
        </div>

        <div className="boop-pop-pirates-bubble-layer">
          {activeBubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="boop-pop-pirates-bubble-track"
              onAnimationEnd={() => {
                handleBubbleEscape(bubble.id);
              }}
              style={
                {
                  "--bubble-bottom": `${bubble.bottomPx}px`,
                  "--bubble-drift": `${bubble.driftPx}px`,
                  "--bubble-duration": `${bubble.durationMs}ms`,
                  "--bubble-left": `${bubble.leftPx}px`,
                  "--bubble-rise": `${bubble.risePx}px`,
                  "--bubble-scale": bubble.scale,
                  "--bubble-size": `${bubble.sizePx}px`,
                  "--bubble-sway": `${bubble.swayPx}px`,
                  "--bubble-sway-duration": `${bubble.swayDurationMs}ms`,
                } as CSSProperties
              }
            >
              <button
                aria-label={
                  bubble.kind === "collectible"
                    ? `Pop ${bubble.label}`
                    : `Pop ${bubble.label.toLowerCase()}`
                }
                className="boop-pop-pirates-bubble-button"
                onPointerDown={(event) => {
                  handleBubblePop(bubble.id, event);
                }}
                ref={(node) => {
                  if (node) {
                    bubbleNodesRef.current.set(bubble.id, node);
                    return;
                  }

                  bubbleNodesRef.current.delete(bubble.id);
                }}
                type="button"
              >
                <span className="boop-pop-pirates-bubble-button__visual">
                  <Image
                    alt=""
                    className="boop-pop-pirates-bubble-button__image"
                    height={160}
                    sizes="88px"
                    src={bubble.asset}
                    unoptimized
                    width={160}
                  />
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="boop-pop-pirates-collectible-layer" aria-hidden="true">
          {fallingCollectibles.map((collectible) => (
            <div
              key={collectible.id}
              className="boop-pop-pirates-falling-collectible"
              onAnimationEnd={() => {
                handleCollectibleLanding(collectible.id);
              }}
              style={
                {
                  "--collectible-duration": `${collectible.durationMs}ms`,
                  "--collectible-end-x": `${collectible.landingX}px`,
                  "--collectible-end-y": `${collectible.landingY}px`,
                  "--collectible-start-x": `${collectible.startX}px`,
                  "--collectible-start-y": `${collectible.startY}px`,
                } as CSSProperties
              }
            >
              <Image
                alt=""
                className="boop-pop-pirates-collectible-image"
                height={180}
                sizes="72px"
                src={collectible.asset}
                unoptimized
                width={180}
              />
            </div>
          ))}

          {waitingCollectibles.map((collectible) => (
            <div
              key={collectible.id}
              className="boop-pop-pirates-waiting-collectible"
              data-status={collectible.status}
              style={
                {
                  "--collectible-collect-dx": `${collectible.collectDx}px`,
                  "--collectible-collect-dy": `${collectible.collectDy}px`,
                  "--collectible-x": `${collectible.xPx}px`,
                  "--collectible-y": `${collectible.yPx}px`,
                } as CSSProperties
              }
            >
              <Image
                alt={collectible.label}
                className="boop-pop-pirates-collectible-image"
                height={180}
                sizes="74px"
                src={collectible.asset}
                unoptimized
                width={180}
              />
            </div>
          ))}
        </div>

        <div className="boop-pop-pirates-ship-layer">
          <button
            aria-label={`Launch a bubble from ${childName}'s pirate ship`}
            className="boop-pop-pirates-ship-button"
            disabled={!assetsReady}
            onPointerDown={handleShipTap}
            ref={shipRef}
            style={
              {
                "--ship-bottom": `${shipBottomOffsetPx}px`,
              } as CSSProperties
            }
            type="button"
          >
            <Image
              alt=""
              className="boop-pop-pirates-ship-button__image"
              height={420}
              preload
              sizes="(max-width: 640px) 42vw, 220px"
              src={BOOP_POP_PIRATES_ASSETS.ship}
              unoptimized
              width={420}
            />
          </button>
        </div>

        <div className="boop-pop-pirates-effect-layer" aria-hidden="true">
          {activeEffects.map((effect) => (
            <div
              key={effect.id}
              className={`boop-pop-pirates-effect boop-pop-pirates-effect--${effect.kind}`}
              style={
                {
                  "--effect-left": `${effect.xPx}px`,
                  "--effect-top": `${effect.yPx}px`,
                } as CSSProperties
              }
            >
              <Image
                alt=""
                className="boop-pop-pirates-effect__image"
                height={220}
                sizes={effect.kind === "pop" ? "84px" : "120px"}
                src={
                  effect.kind === "pop"
                    ? BOOP_POP_PIRATES_ASSETS.popSplat
                    : BOOP_POP_PIRATES_ASSETS.collectibleLanding
                }
                unoptimized
                width={220}
              />
            </div>
          ))}
        </div>

        {!assetsReady ? (
          <div className="boop-pop-pirates-stage__loading" aria-live="polite">
            <div className="boop-pop-pirates-stage__loading-spinner" />
            <p className="boop-pop-pirates-stage__loading-copy">
              Loading the pirate bubbles...
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
