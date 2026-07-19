"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const ORIENTATION_MESSAGE = "Portrait orientation is required. Please rotate your device to continue.";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ROTATE_SCREEN_PROMPT_SRC = "/rotate-screen-prompt.webm";
const ROTATE_SCREEN_PROMPT_POSTER = "/goodkiddo/main-logo.webp";

function isLandscapeViewport() {
  return window.innerWidth > window.innerHeight;
}

export function PortraitOrientationGuard({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncReducedMotion);
      return () => {
        mediaQuery.removeEventListener("change", syncReducedMotion);
      };
    }

    mediaQuery.addListener(syncReducedMotion);
    return () => {
      mediaQuery.removeListener(syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    const syncOrientation = () => {
      setIsLandscape(isLandscapeViewport());
    };
    let animationFrameId = 0;
    const scheduleSync = () => {
      syncOrientation();

      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        syncOrientation();
      });
    };

    scheduleSync();

    window.addEventListener("resize", scheduleSync, { passive: true });
    window.addEventListener("orientationchange", scheduleSync);

    const visualViewport = window.visualViewport;
    const screenOrientation = window.screen?.orientation;
    if (typeof visualViewport?.addEventListener === "function") {
      visualViewport.addEventListener("resize", scheduleSync);
    }

    if (typeof screenOrientation?.addEventListener === "function") {
      screenOrientation.addEventListener("change", scheduleSync);
    }

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", scheduleSync);

      if (typeof visualViewport?.removeEventListener === "function") {
        visualViewport.removeEventListener("resize", scheduleSync);
      }

      if (typeof screenOrientation?.removeEventListener === "function") {
        screenOrientation.removeEventListener("change", scheduleSync);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLandscape) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousBodyTouchAction = body.style.touchAction;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousDocumentOverscrollBehavior = documentElement.style.overscrollBehavior;

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "none";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("wheel", preventScroll);
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousDocumentOverflow;
      documentElement.style.overscrollBehavior = previousDocumentOverscrollBehavior;
    };
  }, [isLandscape]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!isLandscape) {
      video.pause();
      return;
    }

    if (prefersReducedMotion) {
      const freezeFrame = () => {
        video.pause();

        try {
          video.currentTime = 0.01;
        } catch {
          // Keep the poster visible when the browser does not allow seeking yet.
        }
      };

      freezeFrame();
      video.addEventListener("loadeddata", freezeFrame);

      return () => {
        video.removeEventListener("loadeddata", freezeFrame);
      };
    }

    const playPromise = video.play();
    if (playPromise) {
      void playPromise.catch(() => {
        // Ignore autoplay failures and leave the poster in place.
      });
    }
  }, [isLandscape, prefersReducedMotion]);

  return (
    <>
      {children}
      {isLandscape ? (
        <div
          aria-label={ORIENTATION_MESSAGE}
          className="portrait-orientation-guard-overlay"
          role="dialog"
        >
          <div className="portrait-orientation-guard-media-frame">
            <video
              aria-hidden="true"
              autoPlay={!prefersReducedMotion}
              className="portrait-orientation-guard-video"
              controls={false}
              disablePictureInPicture
              loop={!prefersReducedMotion}
              muted
              playsInline
              poster={ROTATE_SCREEN_PROMPT_POSTER}
              preload="auto"
              ref={videoRef}
              tabIndex={-1}
            >
              <source src={ROTATE_SCREEN_PROMPT_SRC} type="video/webm" />
            </video>
          </div>
          <p className="sr-only">{ORIENTATION_MESSAGE}</p>
        </div>
      ) : null}
    </>
  );
}
