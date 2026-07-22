import { Banner } from "@/components/banner";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import { KiddoRouteImage } from "@/components/kiddo-route-image";
import { ChildRewardRequestButton } from "@/components/child-reward-request-button";
import { SpinningNavLink } from "@/components/spinning-nav-link";
import { resolveChildBanner } from "@/lib/child-ui";
import {
  GOODKIDDO_ASSETS,
  getRewardIconPath,
} from "@/lib/goodkiddo-assets";
import type { ChildModeData } from "@/lib/types";
import { formatBoops } from "@/lib/utils";
import Image from "next/image";

export function ChildRewardsScene({
  bannerCode,
  childMode,
}: {
  bannerCode?: string;
  childMode: ChildModeData;
}) {
  if (!childMode.child) {
    return null;
  }

  const boopBalance = childMode.child.boop_balance;
  const banner = bannerCode === "child-mode-ready" ? null : resolveChildBanner(bannerCode);
  const profilePreview = childMode.child.avatar_url ?? GOODKIDDO_ASSETS.boopHappy;
  const queueCount = childMode.redemptions.length;

  return (
    <section className="child-rewards-page">
      <Image
        alt=""
        className="child-home-background"
        fill
        priority
        sizes="100vw"
        src={GOODKIDDO_ASSETS.childRewardsBackground}
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

      <div className="child-rewards-content">
        <div className="child-rewards-hero">
          <div className="child-rewards-hero__avatar">
            <KiddoRouteImage
              alt={`${childMode.child.display_name} avatar`}
              className="child-home-mascot child-home-mascot--avatar object-contain"
              debugLabel="child-rewards-hero-avatar"
              height={180}
              imageDebugMode="off"
              src={profilePreview}
              width={180}
            />
          </div>
          <div className="min-w-0">
            <p className="child-home-eyebrow">
              {childMode.familyName ?? "Family profile"}
            </p>
            <h1 className="child-rewards-name">{childMode.child.display_name}</h1>
            <p className="child-rewards-boops">
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

        <div className="child-rewards-viewport-shell">
          {childMode.rewards.length ? (
            <div className="child-rewards-viewport kiddo-scrollbar">
              {childMode.rewards.map((reward) => {
                const isLocked = boopBalance < reward.cost;

                return (
                  <article
                    className="child-rewards-slide"
                    key={reward.id}
                  >
                    <div
                      className="child-reward-tile child-rewards-slide__card rounded-[1.8rem] p-4 text-[color:var(--foreground)]"
                      data-locked={isLocked ? "true" : "false"}
                    >
                      <div className="child-rewards-slide__card-copy">
                        <p className="child-rewards-slide__title">{reward.title}</p>
                        <p className="child-rewards-slide__subtitle">
                          {isLocked
                            ? `${reward.cost - boopBalance} more boops needed`
                            : "Ready to request"}
                        </p>
                      </div>
                      <ChildRewardRequestButton
                        cost={reward.cost}
                        disabled={isLocked}
                        iconSrc={getRewardIconPath(reward.title)}
                        returnTo="/child/rewards"
                        rewardId={reward.id}
                        rewardTitle={reward.title}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="child-rewards-empty-state">
              <p className="child-rewards-empty-state__title">Rewards will pop up here soon.</p>
              <p className="child-rewards-empty-state__copy">
                Ask a grown-up to add a few treats and this rewards track will light up.
              </p>
            </div>
          )}
        </div>

        <div className="child-rewards-queue">
          <div className="child-rewards-queue__header">
            <p className="child-rewards-queue__title">Reward Queue</p>
            <span className="child-rewards-queue__count">{queueCount}</span>
          </div>
          {queueCount ? (
            <div className="child-rewards-queue__track kiddo-scrollbar">
              {childMode.redemptions.map((redemption) => {
                const statusIcon =
                  redemption.status === "approved" || redemption.status === "completed"
                    ? GOODKIDDO_ASSETS.boopSurprised
                    : GOODKIDDO_ASSETS.boopSleepy;

                return (
                  <div
                    className="child-rewards-queue__item"
                    key={redemption.id}
                  >
                    <KiddoRouteImage
                      alt={redemption.rewardTitle ?? "Reward"}
                      className="child-rewards-queue__reward-art object-contain"
                      debugLabel={`child-reward-scene-reward:${redemption.rewardTitle ?? "reward"}`}
                      height={64}
                      imageDebugMode="off"
                      src={getRewardIconPath(redemption.rewardTitle ?? "Reward")}
                      width={64}
                    />
                    <KiddoRouteImage
                      alt=""
                      className="child-rewards-queue__status-art object-contain"
                      debugLabel={`child-reward-scene-status:${redemption.status}`}
                      height={44}
                      imageDebugMode="off"
                      src={statusIcon}
                      width={44}
                    />
                    <p className="child-rewards-queue__label">
                      {redemption.rewardTitle ?? "Reward"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="child-rewards-queue__empty">
              No reward requests yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
