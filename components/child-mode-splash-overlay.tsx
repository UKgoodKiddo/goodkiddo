"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { CHILD_MODE_SPLASH_PENDING_STORAGE_KEY } from "@/lib/app-constants";

export function ChildModeSplashOverlay({
  childProfileId,
}: {
  childProfileId: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!childProfileId) {
      return;
    }

    const pendingChildProfileId = window.sessionStorage.getItem(
      CHILD_MODE_SPLASH_PENDING_STORAGE_KEY,
    );

    if (pendingChildProfileId !== childProfileId) {
      return;
    }

    window.sessionStorage.removeItem(CHILD_MODE_SPLASH_PENDING_STORAGE_KEY);

    const frame = window.requestAnimationFrame(() => {
      setShowFallback(false);
      setVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [childProfileId]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const hideOverlay = () => {
      setVisible(false);
    };

    const scheduleFallbackHide = () => {
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }

      fallbackTimeoutRef.current = window.setTimeout(() => {
        hideOverlay();
      }, 1600);
    };

    const video = videoRef.current;

    if (!video) {
      setShowFallback(true);
      scheduleFallbackHide();

      return () => {
        if (fallbackTimeoutRef.current !== null) {
          window.clearTimeout(fallbackTimeoutRef.current);
        }
      };
    }

    const autoplayGuard = window.setTimeout(() => {
      const neverStarted = video.paused && video.currentTime === 0;

      if (neverStarted) {
        setShowFallback(true);
        scheduleFallbackHide();
      }
    }, 900);

    const handlePlay = () => {
      window.clearTimeout(autoplayGuard);
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };

    const handleEnded = () => {
      hideOverlay();
    };

    const handleError = () => {
      window.clearTimeout(autoplayGuard);
      setShowFallback(true);
      scheduleFallbackHide();
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    void video.play().catch(() => {
      handleError();
    });

    return () => {
      window.clearTimeout(autoplayGuard);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
      {showFallback ? (
        <div className="flex min-h-screen w-full items-center justify-center px-6 py-10">
          <Image
            alt="goodKiddo"
            className="h-auto w-full max-w-[22rem] object-contain sm:max-w-[26rem]"
            height={1254}
            priority
            src={GOODKIDDO_ASSETS.mainLogo}
            width={1254}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          aria-label="goodKiddo child splash"
          autoPlay
          className="h-screen w-screen object-cover"
          muted
          playsInline
          preload="auto"
        >
          <source src={GOODKIDDO_ASSETS.splashVideoPrimary} type="video/webm" />
          <source src={GOODKIDDO_ASSETS.splashVideoFallbackMp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
