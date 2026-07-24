"use client";

import { useEffect } from "react";
import { useLocalDayNightTheme } from "@/hooks/use-local-day-night-theme";
import { CloudLayer } from "@/components/parent-theme/cloud-layer";
import { StarLayer } from "@/components/parent-theme/star-layer";

export function ParentAtmosphere() {
  const themeState = useLocalDayNightTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-parent-theme", themeState.phase);
  }, [themeState.phase]);

  return (
    <div aria-hidden="true" className="parent-atmosphere fixed inset-0 z-0 overflow-hidden">
      <div className="parent-atmosphere__sky" />
      <div className="parent-atmosphere__glow parent-atmosphere__glow--upper" />
      <div className="parent-atmosphere__glow parent-atmosphere__glow--lower" />
      <StarLayer />
      <CloudLayer />
    </div>
  );
}
