"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

type RootSplashScreenProps = {
  redirectTo: string;
};

export function RootSplashScreen({ redirectTo }: RootSplashScreenProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const redirectStartedRef = useRef(false);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const redirectNow = () => {
      if (redirectStartedRef.current) {
        return;
      }

      redirectStartedRef.current = true;
      router.replace(redirectTo);
    };

    const scheduleFallbackRedirect = () => {
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }

      fallbackTimeoutRef.current = window.setTimeout(() => {
        redirectNow();
      }, 1600);
    };

    const video = videoRef.current;

    if (!video) {
      setShowFallback(true);
      scheduleFallbackRedirect();

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
        scheduleFallbackRedirect();
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
      redirectNow();
    };

    const handleError = () => {
      window.clearTimeout(autoplayGuard);
      setShowFallback(true);
      scheduleFallbackRedirect();
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
  }, [redirectTo, router]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10">
      {showFallback ? (
        <Image
          alt="goodKiddo"
          className="h-auto w-full max-w-[22rem] object-contain sm:max-w-[26rem]"
          height={1254}
          priority
          src={GOODKIDDO_ASSETS.mainLogo}
          width={1254}
        />
      ) : (
        <video
          ref={videoRef}
          aria-label="goodKiddo splash"
          autoPlay
          className="h-auto w-full max-w-[24rem] object-contain sm:max-w-[28rem]"
          muted
          playsInline
          preload="auto"
        >
          <source src="/goodkiddo/goodkiddo_splash.mp4" type="video/mp4" />
        </video>
      )}
    </main>
  );
}
