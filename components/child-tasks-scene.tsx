import { Banner } from "@/components/banner";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import {
  ChildTaskBoopButton,
  ChildVisualTaskCard,
} from "@/components/child-visual-task-card";
import {
  KiddoRouteImage,
  type KiddoImageDebugMode,
} from "@/components/kiddo-route-image";
import { SpinningNavLink } from "@/components/spinning-nav-link";
import { resolveChildBanner } from "@/lib/child-ui";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { getTaskCardCatalog, findTaskCardAssetInCatalog } from "@/lib/task-card-catalog";
import type { ChildModeData } from "@/lib/types";
import { formatBoops } from "@/lib/utils";
import Image from "next/image";

function renderFallbackTaskCard(
  task: ChildModeData["tasks"][number],
  taskAsset: ReturnType<typeof findTaskCardAssetInCatalog>,
  imageDebugMode: KiddoImageDebugMode,
) {
  const isCompleted = task.currentStatus === "approved" || task.currentStatus === "pending";

  return (
    <div
      className="child-task-row child-tasks-scene-fallback-card relative min-h-[16.25rem] rounded-[2rem] px-5 py-5 pr-[6.15rem] text-[color:var(--foreground)]"
      data-completed={isCompleted ? "true" : "false"}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="task-icon-frame h-[5.25rem] w-[5.25rem] shrink-0">
            {taskAsset?.parentAssetSrc ? (
              <KiddoRouteImage
                alt={task.title}
                className="task-icon-art object-contain"
                debugLabel={`child-task-fallback:${task.title}`}
                height={84}
                imageDebugMode={imageDebugMode}
                src={taskAsset.parentAssetSrc}
                width={84}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[1.25rem] bg-[linear-gradient(180deg,#ffd85f,#ffc93f)] text-[2rem] font-black text-[color:var(--foreground)]">
                {task.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[1.35rem] font-black leading-tight">{task.title}</p>
            <p className="mt-2 text-sm font-bold text-[color:var(--ink-soft)]">
              Complete this job and send it off for approval.
            </p>
          </div>
        </div>
      </div>
      <div className="child-task-reward-badge absolute right-5 top-5 shrink-0 flex-nowrap">
        <span className="whitespace-nowrap leading-none">+{task.boop_reward}</span>
        <span
          aria-hidden="true"
          className="child-task-reward-star ml-1 shrink-0"
          style={{ backgroundImage: `url(${GOODKIDDO_ASSETS.starIcon})` }}
        />
      </div>
      <div className="absolute bottom-5 right-5">
        <ChildTaskBoopButton imageDebugMode={imageDebugMode} size="compact" task={task} />
      </div>
    </div>
  );
}

export async function ChildTasksScene({
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

  const taskCatalog = await getTaskCardCatalog();
  const boopBalance = childMode.child.boop_balance;
  const banner = bannerCode === "child-mode-ready" ? null : resolveChildBanner(bannerCode);
  const profilePreview = childMode.child.avatar_url ?? GOODKIDDO_ASSETS.boopHappy;
  const completedTasks = childMode.tasks.filter(
    (task) => task.currentStatus === "approved" || task.currentStatus === "pending",
  );
  const activeTasks = childMode.tasks.filter(
    (task) => task.currentStatus !== "approved" && task.currentStatus !== "pending",
  );
  const sceneTasks = [...activeTasks, ...completedTasks];
  const checkedInDays = childMode.dailyCheckInWeek.filter((day) => day.checkedIn).length;
  const showSuccessBanner =
    childMode.tasks.length > 0 &&
    childMode.tasks.every((task) => task.currentStatus === "approved");

  return (
    <section className="child-tasks-page">
      <Image
        alt=""
        className="child-home-background"
        fill
        priority
        sizes="100vw"
        src={GOODKIDDO_ASSETS.childTasksBackground}
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

      <div className="child-tasks-content">
        <div className="child-tasks-hero">
          <div className="child-tasks-hero__avatar">
            <KiddoRouteImage
              alt={`${childMode.child.display_name} avatar`}
              className="child-home-mascot child-home-mascot--avatar object-contain"
              debugLabel="child-tasks-hero-avatar"
              height={180}
              imageDebugMode={imageDebugMode}
              src={profilePreview}
              width={180}
            />
          </div>
          <div className="min-w-0">
            <p className="child-home-eyebrow">
              {childMode.familyName ?? "Family profile"}
            </p>
            <h1 className="child-tasks-name">{childMode.child.display_name}</h1>
            <p className="child-tasks-boops">
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

        <div className="child-tasks-viewport-shell">
          {sceneTasks.length ? (
            <>
              <div className="child-tasks-viewport-meta">
                <span>{activeTasks.length} ready now</span>
                <span>{completedTasks.length} completed</span>
              </div>
              <div className="child-tasks-viewport kiddo-scrollbar">
                {sceneTasks.map((task) => {
                  const taskAsset = findTaskCardAssetInCatalog(task.title, taskCatalog.tasks);

                  return (
                    <article
                      className="child-tasks-slide"
                      key={task.id}
                    >
                      <div className="child-tasks-slide__card">
                        {taskAsset?.childAssetSrc ? (
                          <ChildVisualTaskCard
                            cardSrc={taskAsset.childAssetSrc}
                            imageDebugMode={imageDebugMode}
                            task={task}
                          />
                        ) : (
                          renderFallbackTaskCard(task, taskAsset, imageDebugMode)
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="child-tasks-empty-state">
              <p className="child-tasks-empty-state__title">Tasks will pop up here soon.</p>
              <p className="child-tasks-empty-state__copy">
                Ask a grown-up to add a few jobs and this track will light up with new cards.
              </p>
            </div>
          )}
        </div>

        <div className="child-tasks-footer">
          <div className="child-tasks-footer__message">
            <p className="child-tasks-footer__title">
              {showSuccessBanner ? "All tasks done!" : "Daily bonus"}
            </p>
            <p className="child-tasks-footer__copy">
              {showSuccessBanner
                ? "Amazing work. Everything for today has been approved."
                : checkedInDays >= 7
                  ? "Perfect week reached. 10 bonus boops are waiting to collect."
                  : checkedInDays >= 5
                    ? "5-day bonus reached. Keep going for the full 10-boop week."
                    : "Open child mode across the week to light the stars and earn bonus boops."}
            </p>
          </div>
          <div className="child-tasks-footer__week">
            {childMode.dailyCheckInWeek.map((day) => {
              return (
                <div key={day.date} className="child-tasks-footer__day">
                  <KiddoRouteImage
                    alt=""
                    className={day.checkedIn ? "" : "opacity-35 grayscale"}
                    debugLabel={`child-task-scene-star:${day.label}`}
                    height={26}
                    imageDebugMode={imageDebugMode}
                    src={GOODKIDDO_ASSETS.starIcon}
                    width={26}
                  />
                  <span>{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
