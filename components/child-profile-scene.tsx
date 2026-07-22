import { updateChildAvatarPresetAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import { KiddoRouteImage } from "@/components/kiddo-route-image";
import { resolveChildBanner, CHILD_AVATAR_PRESETS } from "@/lib/child-ui";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import type { ChildModeData } from "@/lib/types";
import { formatBoops } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";

const PROFILE_TWINKLE_STARS = [
  { delay: "0.1s", duration: "3.05s", left: "8%", size: "0.36rem", top: "8%" },
  { delay: "0.7s", duration: "3.45s", left: "21%", size: "0.62rem", top: "11%" },
  { delay: "1.25s", duration: "2.85s", left: "39%", size: "0.3rem", top: "7%" },
  { delay: "0.55s", duration: "3.2s", left: "58%", size: "0.54rem", top: "10%" },
  { delay: "1.6s", duration: "2.95s", left: "74%", size: "0.34rem", top: "8%" },
  { delay: "0.35s", duration: "3.7s", left: "87%", size: "0.68rem", top: "13%" },
  { delay: "1.15s", duration: "3.1s", left: "13%", size: "0.7rem", top: "24%" },
  { delay: "0.85s", duration: "2.75s", left: "29%", size: "0.4rem", top: "30%" },
  { delay: "1.9s", duration: "3.4s", left: "61%", size: "0.5rem", top: "27%" },
  { delay: "0.45s", duration: "2.9s", left: "81%", size: "0.34rem", top: "33%" },
] as const;

export function ChildProfileScene({
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

  return (
    <section className="child-profile-page">
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
        {PROFILE_TWINKLE_STARS.map((star, index) => (
          <span
            key={`child-profile-star-${index}`}
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
        <div
          aria-hidden="true"
          className="child-home-profile-link child-home-profile-link--icon child-profile-current-icon"
        >
          <Image
            alt=""
            className="child-home-profile-link__icon"
            height={64}
            src={GOODKIDDO_ASSETS.childChangingRoomButton}
            unoptimized
            width={64}
          />
        </div>
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

      <div className="child-profile-content">
        <div className="child-profile-hero">
          <div className="child-profile-hero__avatar">
            <KiddoRouteImage
              alt={`${childMode.child.display_name} avatar`}
              className="child-home-mascot child-home-mascot--avatar object-contain"
              debugLabel="child-profile-hero-avatar"
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
            <h1 className="child-profile-name">{childMode.child.display_name}</h1>
            <p className="child-profile-boops">
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

        <div className="child-profile-viewport-shell">
          <div className="child-profile-viewport kiddo-scrollbar">
            {CHILD_AVATAR_PRESETS.map((preset) => {
              const isSelected = childMode.child?.avatar_url === preset.value;

              return (
                <article className="child-profile-slide" key={preset.value}>
                  <form action={updateChildAvatarPresetAction}>
                    <input type="hidden" name="avatarUrl" value={preset.value} />
                    <input type="hidden" name="returnTo" value="/child/profile" />
                    <button
                      className="child-avatar-option child-profile-slide__card w-full rounded-[1.7rem] border text-center"
                      data-selected={isSelected ? "true" : "false"}
                      type="submit"
                    >
                      <div className="child-profile-slide__art">
                        <Image
                          alt={preset.label}
                          className="mx-auto h-auto w-full object-contain"
                          height={120}
                          src={preset.value}
                          width={120}
                        />
                      </div>
                      <p className="child-profile-slide__label">{preset.label}</p>
                      <p className="child-profile-slide__status">
                        {isSelected ? "Selected" : "Use avatar"}
                      </p>
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </div>

        <div className="child-profile-footer">
          <div className="child-profile-footer__card">
            <p className="child-profile-footer__eyebrow">Coming soon</p>
            <p className="child-profile-footer__title">Dress-up room</p>
            <p className="child-profile-footer__copy">
              Later we can add outfits, accessories, and unlockable profile items here.
            </p>
          </div>
          <div className="child-profile-footer__card">
            <p className="child-profile-footer__eyebrow">Current avatar</p>
            <div className="child-profile-footer__current">
              <KiddoRouteImage
                alt={`${childMode.child.display_name} current avatar`}
                className="child-profile-footer__current-avatar object-contain"
                debugLabel="child-profile-current-avatar"
                height={72}
                imageDebugMode="off"
                src={profilePreview}
                width={72}
              />
              <div>
                <p className="child-profile-footer__current-name">{childMode.child.display_name}</p>
                <p className="child-profile-footer__current-copy">Choose a look that feels most like you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
