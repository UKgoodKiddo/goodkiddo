import { Banner } from "@/components/banner";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import {
  KiddoRouteImage,
  type KiddoImageDebugMode,
} from "@/components/kiddo-route-image";
import { SpinningNavLink } from "@/components/spinning-nav-link";
import { resolveChildBanner } from "@/lib/child-ui";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import type { ChildModeData } from "@/lib/types";
import { formatBoops } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";

const HOME_TWINKLE_STARS = [
  { delay: "0s", duration: "2.8s", left: "8%", size: "0.38rem", top: "8%" },
  { delay: "0.6s", duration: "3.4s", left: "19%", size: "0.62rem", top: "12%" },
  { delay: "1.1s", duration: "2.6s", left: "34%", size: "0.3rem", top: "7%" },
  { delay: "0.9s", duration: "3.1s", left: "52%", size: "0.56rem", top: "10%" },
  { delay: "1.7s", duration: "2.9s", left: "69%", size: "0.36rem", top: "6%" },
  { delay: "0.25s", duration: "3.8s", left: "84%", size: "0.7rem", top: "11%" },
  { delay: "1.35s", duration: "3.2s", left: "12%", size: "0.72rem", top: "22%" },
  { delay: "0.8s", duration: "2.7s", left: "28%", size: "0.42rem", top: "28%" },
  { delay: "1.9s", duration: "3.5s", left: "61%", size: "0.6rem", top: "24%" },
  { delay: "0.4s", duration: "2.95s", left: "79%", size: "0.34rem", top: "31%" },
  { delay: "1.5s", duration: "3.6s", left: "16%", size: "0.5rem", top: "43%" },
  { delay: "1.05s", duration: "2.85s", left: "73%", size: "0.52rem", top: "49%" },
] as const;

export function ChildHomeScene({
  bannerCode,
  childMode,
  imageDebugMode = "off",
}: {
  bannerCode?: string;
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
}) {
  if (!childMode.child) {
    return null;
  }

  const boopBalance = childMode.child.boop_balance;
  const currentLevel = Math.max(1, Math.floor(boopBalance / 25) + 1);
  const currentLevelProgress = boopBalance % 25;
  const progressPercent = currentLevelProgress === 0 && boopBalance > 0
    ? 100
    : currentLevelProgress * 4;
  const boopsToNext = currentLevelProgress === 0 ? 25 : 25 - currentLevelProgress;
  const banner = bannerCode === "child-mode-ready" ? null : resolveChildBanner(bannerCode);
  const profilePreview = childMode.child.avatar_url ?? GOODKIDDO_ASSETS.boopHappy;

  return (
    <section className="child-home-page">
      <Image
        alt=""
        className="child-home-background"
        fill
        priority
        sizes="100vw"
        src={GOODKIDDO_ASSETS.childHomeBackground}
        unoptimized
      />
      <div aria-hidden="true" className="child-home-background-glow" />
      <div aria-hidden="true" className="child-home-twinkle-layer">
        {HOME_TWINKLE_STARS.map((star, index) => (
          <span
            key={`child-home-star-${index}`}
            className="child-home-twinkle-star"
            style={
              {
                "--twinkle-delay": star.delay,
                "--twinkle-duration": star.duration,
                "--twinkle-left": star.left,
                "--twinkle-size": star.size,
                "--twinkle-top": star.top,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="child-home-topbar">
        <ExitChildModeButton className="border-white/70 bg-white/96 text-[#0d348d] shadow-[0_14px_32px_rgba(4,25,94,0.28)] hover:bg-white" />
        <SpinningNavLink
          aria-label="Open changing room"
          className="child-home-profile-link child-home-profile-link--icon"
          href="/child/profile"
        >
          <Image
            alt=""
            className="child-home-profile-link__icon"
            height={64}
            src={GOODKIDDO_ASSETS.childChangingRoomButton}
            unoptimized
            width={64}
          />
        </SpinningNavLink>
      </div>

      {banner || childMode.usingDemoMode ? (
        <div className="child-home-banner-stack">
          {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}
          {childMode.usingDemoMode ? (
            <Banner
              message="Showing child preview data because live child mode is not fully configured yet."
              tone="sky"
            />
          ) : null}
        </div>
      ) : null}

      <div className="child-home-content">
        <div className="child-home-hero">
          <div className="child-home-mascot-wrap">
            <KiddoRouteImage
              alt={`${childMode.child.display_name} avatar`}
              className="child-home-mascot child-home-mascot--avatar object-contain"
              debugLabel="child-home-hero-avatar"
              height={220}
              imageDebugMode={imageDebugMode}
              src={profilePreview}
              width={220}
            />
          </div>
          <div className="min-w-0">
            <p className="child-home-eyebrow">
              {childMode.familyName ?? "Family profile"}
            </p>
            <h1 className="child-home-name">{childMode.child.display_name}</h1>
            <p className="child-home-boops">
              <span>{boopBalance}</span> boops
            </p>
            <div className="child-home-waiting-pill">
              <Image
                alt=""
                className="h-4 w-4 object-contain"
                height={16}
                src={GOODKIDDO_ASSETS.starIcon}
                unoptimized
                width={16}
              />
              <span>
                {childMode.pendingBoopTotal > 0
                  ? `${formatBoops(childMode.pendingBoopTotal)} waiting to collect!`
                  : "No boops waiting right now"}
              </span>
            </div>
          </div>
        </div>

        <div className="child-home-level-row">
          <div className="child-home-level-badge">
            <Image
              alt=""
              className="child-home-level-badge__art"
              fill
              sizes="112px"
              src={GOODKIDDO_ASSETS.childHomeLevelBadge}
              unoptimized
            />
            <span className="child-home-level-badge__eyebrow">LEVEL</span>
            <span className="child-home-level-badge__value">{currentLevel}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="child-home-level-copy">{boopsToNext} boops to go</p>
            <p className="child-home-level-subcopy">
              to reach Level {currentLevel + 1}!
            </p>
            <div className="child-home-progress-track">
              <div
                className="child-home-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div
          aria-disabled="true"
          className="child-home-scan-panel child-home-scan-panel--inactive"
        >
          <div className="child-home-scan-panel__badge">
            <p className="child-home-scan-panel__copy">
              <span>Ask a grown-up to</span>
              <span>scan your Booper!</span>
            </p>
            <Image
              alt="Scan your Booper"
              className="h-full w-full object-contain"
              height={260}
              src={GOODKIDDO_ASSETS.childHomeNfcBadge}
              unoptimized
              width={340}
            />
          </div>
        </div>

        <div className="child-home-shortcuts">
          <SpinningNavLink
            aria-label="Open tasks"
            className="child-home-shortcut"
            href="/child/tasks"
          >
            <Image
              alt=""
              className="child-home-shortcut__icon child-home-shortcut__icon--small"
              height={112}
              src={GOODKIDDO_ASSETS.childTasksButton}
              unoptimized
              width={112}
            />
            <span className="child-home-shortcut__label">Tasks</span>
          </SpinningNavLink>
          <SpinningNavLink
            aria-label="Open rewards"
            className="child-home-shortcut"
            href="/child/rewards"
          >
            <Image
              alt=""
              className="child-home-shortcut__icon"
              height={112}
              src={GOODKIDDO_ASSETS.childRewardsButton}
              unoptimized
              width={112}
            />
            <span className="child-home-shortcut__label">Rewards</span>
          </SpinningNavLink>
          <SpinningNavLink
            aria-label="Open Kiddo Explorers"
            className="child-home-shortcut"
            href="/child/kiddo_explorers"
          >
            <Image
              alt=""
              className="child-home-shortcut__icon child-home-shortcut__icon--wide"
              height={112}
              src={GOODKIDDO_ASSETS.childKiddoExplorersButton}
              unoptimized
              width={134}
            />
            <span className="child-home-shortcut__label">Kiddo Explorers</span>
          </SpinningNavLink>
        </div>
      </div>
    </section>
  );
}
