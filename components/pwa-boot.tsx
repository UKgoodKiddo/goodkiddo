"use client";

import { useEffect } from "react";

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const LOCALHOST_PWA_RESET_KEY = "goodkiddo-localhost-pwa-reset-v1";

export function PwaBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const resetLocalhostPwa = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const cacheKeys = "caches" in window ? await caches.keys() : [];

      if (registrations.length === 0 && cacheKeys.length === 0) {
        sessionStorage.setItem(LOCALHOST_PWA_RESET_KEY, "done");
        return false;
      }

      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }

      sessionStorage.setItem(LOCALHOST_PWA_RESET_KEY, "done");
      return true;
    };

    const bootPwa = async () => {
      const isLocalhost = LOCALHOST_HOSTNAMES.has(window.location.hostname);

      if (isLocalhost && sessionStorage.getItem(LOCALHOST_PWA_RESET_KEY) !== "done") {
        const didReset = await resetLocalhostPwa();

        if (didReset) {
          window.location.reload();
          return;
        }
      }

      if (isLocalhost) {
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
    };

    bootPwa().catch(() => {
      // We silently ignore registration failures so app boot isn't blocked.
    });
  }, []);

  return null;
}
