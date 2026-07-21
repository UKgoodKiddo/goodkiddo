"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ACHIEVEMENT_BADGE_POSITIONS,
  ACHIEVEMENT_DEFINITION_MAP,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_PROGRESS_LAYOUT,
  FINAL_ACHIEVEMENT_ID,
  type AchievementId,
} from "@/lib/achievement-definitions";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { cn, formatDateTimeDetailed } from "@/lib/utils";

const ACHIEVEMENTS_ASSETS = {
  background: "/achievements-page.webp",
  lockedBadge: "/locked-badge.webp",
  mapButton: "/kiddo-explorer-asset-handover/ui-assets/map_button.png",
} as const;

type ChildAchievementsBoardProps = {
  childName: string;
  previewMode: string | null;
  unlockedAchievementIds: AchievementId[];
  unlockedAtById: Partial<Record<AchievementId, string>>;
  unlockedStandardBadgeCount: number;
};

type SelectedBadgeState = {
  achievementId: AchievementId;
  locked: boolean;
} | null;

function buildPreviewLabel(previewMode: string | null) {
  if (!previewMode) {
    return null;
  }

  switch (previewMode) {
    case "all-locked":
      return "Preview: all locked";
    case "some-unlocked":
      return "Preview: some unlocked";
    case "all-standard":
      return "Preview: all 8 unlocked";
    case "super-boop":
      return "Preview: Super Boop unlocked";
    default:
      return "Preview mode";
  }
}

export function ChildAchievementsBoard({
  childName,
  previewMode,
  unlockedAchievementIds,
  unlockedAtById,
  unlockedStandardBadgeCount,
}: ChildAchievementsBoardProps) {
  const [selectedBadge, setSelectedBadge] = useState<SelectedBadgeState>(null);
  const unlockedSet = new Set(unlockedAchievementIds);
  const previewLabel = buildPreviewLabel(previewMode);
  const selectedDefinition = selectedBadge
    ? ACHIEVEMENT_DEFINITION_MAP[selectedBadge.achievementId]
    : null;

  useEffect(() => {
    if (!selectedBadge) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBadge(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBadge]);

  return (
    <>
      <main aria-label="Achievements" className="child-achievements-page">
        <div className="child-achievements-page__topbar">
          <Link
            aria-label="Back to Kiddo Explorers map"
            className="child-achievements-map-button"
            href="/child/kiddo_explorers"
          >
            <Image
              alt=""
              className="child-achievements-map-button__image"
              height={168}
              priority
              sizes="56px"
              src={ACHIEVEMENTS_ASSETS.mapButton}
              width={168}
            />
          </Link>

          <div className="child-achievements-progress-pill">
            <span>{unlockedStandardBadgeCount} / 8 badges found</span>
            {previewLabel ? (
              <span className="child-achievements-progress-pill__preview">{previewLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="child-achievements-artwork-shell">
          <div className="child-achievements-artwork-frame">
            <Image
              alt="Achievement board"
              className="child-achievements-artwork-image"
              fill
              priority
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 72vw, 36rem"
              src={ACHIEVEMENTS_ASSETS.background}
            />

            <div aria-hidden="true" className="child-achievements-progress-strip">
              <div
                className="child-achievements-progress-strip__stars"
                style={
                  {
                    "--progress-left": ACHIEVEMENT_PROGRESS_LAYOUT.left,
                    "--progress-top": ACHIEVEMENT_PROGRESS_LAYOUT.top,
                    "--progress-width": ACHIEVEMENT_PROGRESS_LAYOUT.width,
                  } as CSSProperties
                }
              >
                {Array.from({ length: 9 }).map((_, index) => {
                  const isUnlocked =
                    index < 8
                      ? index < unlockedStandardBadgeCount
                      : unlockedSet.has(FINAL_ACHIEVEMENT_ID);

                  return (
                    <span
                      key={`progress-star-${index + 1}`}
                      className="child-achievements-progress-strip__star-shell"
                      data-unlocked={isUnlocked ? "true" : "false"}
                    >
                      <Image
                        alt=""
                        className="child-achievements-progress-strip__star"
                        fill
                        sizes="32px"
                        src={GOODKIDDO_ASSETS.starIcon}
                      />
                    </span>
                  );
                })}
              </div>
            </div>

            {ACHIEVEMENT_DEFINITIONS.map((definition) => {
              const position = ACHIEVEMENT_BADGE_POSITIONS[definition.id];
              const isUnlocked = unlockedSet.has(definition.id);

              return (
                <button
                  key={definition.id}
                  aria-label={
                    isUnlocked
                      ? `Open ${definition.title}`
                      : `${definition.title} is still locked`
                  }
                  className="child-achievements-badge-button"
                  onClick={() => {
                    setSelectedBadge({
                      achievementId: definition.id,
                      locked: !isUnlocked,
                    });
                  }}
                  style={
                    {
                      "--badge-button-height": position.buttonHeight,
                      "--badge-button-width": position.buttonWidth,
                      "--badge-left": position.left,
                      "--badge-lock-delay": `${definition.order * -0.28}s`,
                      "--badge-lock-size": position.lockSize,
                      "--badge-top": position.top,
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span className="sr-only">
                    {isUnlocked ? `${definition.title} unlocked` : `${definition.title} locked`}
                  </span>
                  {!isUnlocked ? (
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="child-achievements-badge-button__lock"
                      height={627}
                      sizes="(max-width: 640px) 20vw, 9rem"
                      src={ACHIEVEMENTS_ASSETS.lockedBadge}
                      width={627}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {selectedDefinition ? (
        <div aria-modal="true" className="parent-task-wizard-backdrop" role="dialog">
          <button
            aria-label="Close achievement details"
            className="parent-task-wizard-scrim"
            onClick={() => {
              setSelectedBadge(null);
            }}
            type="button"
          />
          <div className="child-achievements-modal-card">
            <button
              aria-label="Close achievement details"
              className="child-achievements-modal-card__close"
              onClick={() => {
                setSelectedBadge(null);
              }}
              type="button"
            >
              x
            </button>

            <div
              className={cn(
                "child-achievements-modal-card__badge",
                selectedBadge?.locked
                  ? "child-achievements-modal-card__badge--locked"
                  : "child-achievements-modal-card__badge--unlocked",
              )}
            >
              {selectedDefinition.imageSrc ? (
                <Image
                  alt=""
                  className="object-contain"
                  fill
                  sizes="120px"
                  src={selectedDefinition.imageSrc}
                />
              ) : (
                <Image
                  alt=""
                  className={selectedBadge?.locked ? "opacity-90" : ""}
                  fill
                  sizes="120px"
                  src={
                    selectedBadge?.locked
                      ? ACHIEVEMENTS_ASSETS.lockedBadge
                      : GOODKIDDO_ASSETS.starIcon
                  }
                />
              )}
            </div>

            <p className="child-achievements-modal-card__eyebrow">
              {selectedBadge?.locked ? "Keep exploring" : "Badge unlocked"}
            </p>
            <h2 className="child-achievements-modal-card__title">{selectedDefinition.title}</h2>
            <p className="child-achievements-modal-card__message">
              {selectedBadge?.locked
                ? "Keep exploring to unlock this Boop badge!"
                : selectedDefinition.isFinalBadge
                  ? `${childName}, you found every biome badge and unlocked the Super Boop prize.`
                  : `${childName}, amazing exploring. This Boop badge is all yours.`}
            </p>
            <p className="child-achievements-modal-card__description">
              {selectedDefinition.description}
            </p>
            {!selectedBadge?.locked ? (
              <p className="child-achievements-modal-card__date">
                Unlocked on{" "}
                {formatDateTimeDetailed(
                  unlockedAtById[selectedBadge!.achievementId] ?? new Date().toISOString(),
                )}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
