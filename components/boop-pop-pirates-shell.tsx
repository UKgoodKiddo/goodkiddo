"use client";

import dynamic from "next/dynamic";
import type { BoopPopPiratesCollectibleId } from "@/lib/boop-pop-pirates";

const BoopPopPiratesGame = dynamic(
  () =>
    import("@/components/boop-pop-pirates-game").then(
      (module) => module.BoopPopPiratesGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="boop-pop-pirates-loading">
        <div className="boop-pop-pirates-loading__spinner" />
        <p className="boop-pop-pirates-loading__label">Hoisting the bubbles...</p>
      </div>
    ),
  },
);

export function BoopPopPiratesShell({
  childId,
  childName,
  initialCollectedCollectibleIds,
}: {
  childId: string;
  childName: string;
  initialCollectedCollectibleIds: BoopPopPiratesCollectibleId[];
}) {
  return (
    <BoopPopPiratesGame
      childId={childId}
      childName={childName}
      initialCollectedCollectibleIds={initialCollectedCollectibleIds}
    />
  );
}
