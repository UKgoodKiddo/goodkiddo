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
