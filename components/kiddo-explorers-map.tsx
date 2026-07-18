"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState, type CSSProperties } from "react";

const CREATIVE_COVE_ROUTE = "/child/kiddo_explorers/creative_cove";
const CHILD_HOME_ROUTE = "/child";
const ENTER_DURATION_MS = 680;
const REDUCED_ENTER_DURATION_MS = 180;

const KIDDO_EXPLORERS_ASSETS = {
  background: "/kiddo-explorer-asset-handover/kiddo-explorers-ui-background.webp",
  creativeCoveBiome: "/kiddo-explorer-asset-handover/biome-icons/creative-cove-biome.webp",
  homeButton: "/kiddo-explorer-asset-handover/ui-assets/home_button.png",
  whale: "/kiddo-explorer-asset-handover/ui-assets/whale.png",
} as const;

const SPARKLES = [
  { left: "21%", top: "18%", size: "12px", duration: "2.8s", delay: "-0.7s" },
  { left: "67%", top: "21%", size: "10px", duration: "3.7s", delay: "-1.4s" },
  { left: "48%", top: "29%", size: "14px", duration: "3.1s", delay: "-0.9s" },
  { left: "33%", top: "37%", size: "11px", duration: "4.2s", delay: "-2.1s" },
  { left: "74%", top: "42%", size: "13px", duration: "2.6s", delay: "-0.2s" },
  { left: "56%", top: "49%", size: "10px", duration: "3.5s", delay: "-1.8s" },
  { left: "19%", top: "56%", size: "12px", duration: "4.4s", delay: "-2.4s" },
  { left: "69%", top: "60%", size: "14px", duration: "2.9s", delay: "-1.1s" },
  { left: "41%", top: "66%", size: "11px", duration: "3.3s", delay: "-0.5s" },
  { left: "77%", top: "71%", size: "12px", duration: "4.1s", delay: "-2.7s" },
] as const;

function SparkleOverlay() {
  return (
    <div aria-hidden="true" className="kiddo-explorers-sparkle-layer">
      {SPARKLES.map((sparkle, index) => {
        const style = {
          "--sparkle-left": sparkle.left,
          "--sparkle-top": sparkle.top,
          "--sparkle-size": sparkle.size,
          "--sparkle-duration": sparkle.duration,
          "--sparkle-delay": sparkle.delay,
        } as CSSProperties;

        return <span key={`${sparkle.left}-${sparkle.top}-${index}`} className="kiddo-explorers-sparkle" style={style} />;
      })}
    </div>
  );
}

export function KiddoExplorersMap() {
  const router = useRouter();
  const biomeButtonRef = useRef<HTMLButtonElement | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);
  const [isEnteringCreativeCove, setIsEnteringCreativeCove] = useState(false);
  const [isWhaleJumping, setIsWhaleJumping] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [biomeTransitionStyle, setBiomeTransitionStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncPreference);

      if (enterTimeoutRef.current !== null) {
        window.clearTimeout(enterTimeoutRef.current);
      }
    };
  }, []);

  function handleCreativeCoveOpen() {
    if (isEnteringCreativeCove) {
      return;
    }

    const nextDuration = prefersReducedMotion ? REDUCED_ENTER_DURATION_MS : ENTER_DURATION_MS;
    const buttonBounds = biomeButtonRef.current?.getBoundingClientRect();

    if (buttonBounds) {
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      const currentCenterX = buttonBounds.left + buttonBounds.width / 2;
      const currentCenterY = buttonBounds.top + buttonBounds.height / 2;
      const shiftX = viewportCenterX - currentCenterX;
      const shiftY = viewportCenterY - currentCenterY;
      const scale = Math.min(
        3.7,
        Math.max(
          prefersReducedMotion ? 1.06 : 2.8,
          Math.min(
            window.innerWidth / buttonBounds.width,
            window.innerHeight / buttonBounds.height,
          ) * (prefersReducedMotion ? 1 : 1.2),
        ),
      );

      setBiomeTransitionStyle({
        "--explorers-biome-shift-x": `${shiftX}px`,
        "--explorers-biome-shift-y": `${shiftY}px`,
        "--explorers-biome-scale": `${scale}`,
        "--explorers-biome-enter-duration": `${nextDuration}ms`,
      } as CSSProperties);
    }

    setIsEnteringCreativeCove(true);
    enterTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => {
        router.push(CREATIVE_COVE_ROUTE);
      });
    }, nextDuration);
  }

  function handleWhaleJump() {
    if (isWhaleJumping || isEnteringCreativeCove) {
      return;
    }

    setIsWhaleJumping(true);
  }

  return (
    <div
      className={`kiddo-explorers-scene${isEnteringCreativeCove ? " is-entering" : ""}`}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <div
        aria-hidden="true"
        className="kiddo-explorers-background"
        style={{ backgroundImage: `url(${KIDDO_EXPLORERS_ASSETS.background})` }}
      />
      <SparkleOverlay />
      <div aria-hidden="true" className="kiddo-explorers-transition-overlay" />

      <div className="kiddo-explorers-biome-layer">
        <button
          ref={biomeButtonRef}
          aria-label="Open Creative Cove"
          className={`kiddo-explorers-biome-button${isEnteringCreativeCove ? " is-entering" : ""}`}
          disabled={isEnteringCreativeCove}
          onClick={handleCreativeCoveOpen}
          style={biomeTransitionStyle}
          type="button"
        >
          <Image
            alt=""
            className="kiddo-explorers-biome-image"
            height={768}
            priority
            sizes="(max-width: 640px) 40vw, 230px"
            src={KIDDO_EXPLORERS_ASSETS.creativeCoveBiome}
            width={768}
          />
        </button>
      </div>

      <div className="kiddo-explorers-nav-layer">
        <Link
          aria-label="Go to child home"
          className="kiddo-explorers-home-button"
          href={CHILD_HOME_ROUTE}
        >
          <Image
            alt=""
            className="kiddo-explorers-home-button__image"
            height={166}
            priority
            sizes="88px"
            src={KIDDO_EXPLORERS_ASSETS.homeButton}
            width={177}
          />
        </Link>
      </div>

      <div className="kiddo-explorers-whale-layer">
        <div className={`kiddo-explorers-whale-track${isWhaleJumping ? " is-paused" : ""}`}>
          <button
            aria-label="Make the whale jump"
            className={`kiddo-explorers-whale-button${isWhaleJumping ? " is-jumping" : ""}`}
            onAnimationEnd={() => {
              if (isWhaleJumping) {
                setIsWhaleJumping(false);
              }
            }}
            onClick={handleWhaleJump}
            type="button"
          >
            <span className="kiddo-explorers-whale-direction">
              <span className="kiddo-explorers-whale-bob">
                <Image
                  alt=""
                  className="kiddo-explorers-whale-image"
                  height={222}
                  priority
                  sizes="(max-width: 640px) 22vw, 145px"
                  src={KIDDO_EXPLORERS_ASSETS.whale}
                  width={332}
                />
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
