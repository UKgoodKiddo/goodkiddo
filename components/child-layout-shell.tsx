"use client";

import { ChildBottomNav } from "@/components/child-bottom-nav";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import type { ChildModeData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function ChildLayoutShell({
  childMode,
  children,
}: {
  childMode: ChildModeData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/child";

  return (
    <div
      className={cn(
        "flex w-full flex-1",
        isHomeRoute ? "child-layout-frame child-layout-frame--home" : "mx-auto max-w-5xl px-2 py-4 sm:px-6",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-1 flex-col text-white",
          isHomeRoute
            ? "child-home-shell"
            : "child-app-shell rounded-[2rem] px-3 py-4 shadow-[0_24px_50px_rgba(6,23,80,0.24)] sm:px-5 sm:py-5",
        )}
      >
        {!isHomeRoute ? (
          <header className="mb-3 flex justify-end">
            <div className="flex items-center justify-end">
              <ExitChildModeButton />
            </div>
          </header>
        ) : null}
        <div className={cn("flex flex-1 flex-col", isHomeRoute ? "min-h-0" : "")}>{children}</div>
        {childMode.child && !isHomeRoute ? (
          <ChildBottomNav pendingBoopTotal={childMode.pendingBoopTotal} />
        ) : null}
      </div>
    </div>
  );
}
