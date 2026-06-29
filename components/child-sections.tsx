import Image from "next/image";
import Link from "next/link";
import {
  submitTaskCompletionAction,
  updateChildAvatarPresetAction,
} from "@/app/actions";
import { ChildRewardRequestButton } from "@/components/child-reward-request-button";
import { StatusPill } from "@/components/status-pill";
import { CHILD_AVATAR_PRESETS, type ChildPageRoute } from "@/lib/child-ui";
import {
  GOODKIDDO_ASSETS,
  getRewardIconPath,
  getTaskIconPath,
} from "@/lib/goodkiddo-assets";
import {
  KiddoRouteImage,
  type KiddoImageDebugMode,
} from "@/components/kiddo-route-image";
import type { ChildModeData } from "@/lib/types";
import { formatBoops, formatDateTime } from "@/lib/utils";

export function ChildSummaryCard({
  childMode,
  imageDebugMode = "off",
}: {
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
}) {
  if (!childMode.child) {
    return null;
  }

  const boopBalance = childMode.child.boop_balance;

  return (
    <div className="child-panel rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {childMode.child.avatar_url ? (
            <KiddoRouteImage
              alt={`${childMode.child.display_name} avatar`}
              className="h-[102px] w-[102px] rounded-[1.7rem] object-cover shadow-[0_18px_28px_rgba(7,26,85,0.34)]"
              debugLabel="child-summary-avatar"
              height={102}
              imageDebugMode={imageDebugMode}
              src={childMode.child.avatar_url}
              width={102}
            />
          ) : (
            <div className="rounded-[1.7rem] bg-[linear-gradient(180deg,#144ed4,#0b3aa9)] p-3 shadow-[0_18px_28px_rgba(7,26,85,0.34)]">
              <KiddoRouteImage
                alt=""
                debugLabel="child-summary-fallback-avatar"
                height={78}
                imageDebugMode={imageDebugMode}
                src={boopBalance >= 25 ? GOODKIDDO_ASSETS.boopCool : GOODKIDDO_ASSETS.boopHappy}
                width={78}
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">
              {childMode.familyName ?? "Family profile"}
            </p>
            <h2 className="mt-2 text-4xl font-black sm:text-5xl">
              {childMode.child.display_name}
            </h2>
            <p className="mt-2 text-lg font-bold text-white/80">
              {formatBoops(boopBalance)}
            </p>
            <p className="mt-1 text-sm font-bold text-white/65">
              {childMode.pendingBoopTotal > 0
                ? `${formatBoops(childMode.pendingBoopTotal)} waiting to collect`
                : "No boops waiting right now"}
            </p>
            <p className="mt-2 text-sm font-bold text-[#ffe37f]">
              Ask a grown-up to scan your Booper.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white/10 px-4 py-3 text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
            Level
          </p>
          <p className="mt-2 text-4xl font-black">
            {Math.max(1, Math.floor(boopBalance / 25) + 1)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm font-black text-white/72">
          <span>Progress to next level</span>
          <span>{Math.max(0, 25 - (boopBalance % 25))} boops to go</span>
        </div>
        <div className="progress-rail mt-3 bg-white/12">
          <div className="progress-fill" style={{ width: `${(boopBalance % 25) * 4}%` }} />
        </div>
      </div>
    </div>
  );
}

export function ChildWaitingBoopsCard({
  childMode,
}: {
  childMode: ChildModeData;
}) {
  return (
    <div className="child-panel rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-black">Waiting Boops</p>
          <p className="mt-1 text-sm text-white/70">
            Your grown-up can scan your Booper on their phone to move these into your spendable balance.
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/80">
          {formatBoops(childMode.pendingBoopTotal)} waiting
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4">
        <p className="text-lg font-black">How collection works</p>
        <p className="mt-2 text-sm leading-6 text-white/76">
          1. Finish a task. 2. Wait for parent approval. 3. Ask a grown-up to scan your Booper on their NFC phone.
        </p>
      </div>

      {childMode.pendingBoopAwards.length ? (
        <div className="mt-5 space-y-3">
          {childMode.pendingBoopAwards.slice(0, 8).map((award) => (
            <div
              key={award.id}
              className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">{award.reason}</p>
                  <p className="mt-1 text-sm text-white/65">
                    Waiting since {formatDateTime(award.created_at)}
                  </p>
                </div>
                <p className="font-black text-[#ffd53f]">+{award.amount}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/75">
          No waiting boops right now. Finish a task, then wait for a grown-up to approve it.
        </div>
      )}
    </div>
  );
}

export function ChildTasksCard({
  childMode,
  imageDebugMode = "off",
  showHeader = true,
}: {
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
  showHeader?: boolean;
}) {
  const approvedTasks = childMode.tasks.filter((task) => task.currentStatus === "approved").length;
  const totalTasks = childMode.tasks.length;
  const showSuccessBanner =
    totalTasks > 0 && childMode.tasks.every((task) => task.currentStatus === "approved");
  const checkedInDays = childMode.dailyCheckInWeek.filter((day) => day.checkedIn).length;

  return (
    <div className="child-panel rounded-[2rem] p-5 sm:p-6">
      {showHeader ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-black">Today&apos;s Tasks</p>
            <p className="mt-1 text-sm text-white/70">
              Complete jobs and send them for parent approval.
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/80">
            {approvedTasks}/{totalTasks || 0}
          </div>
        </div>
      ) : null}

      <div className={showHeader ? "mt-5 space-y-3" : "space-y-3"}>
        {childMode.tasks.length ? (
          childMode.tasks.map((task) => (
            <div
              key={task.id}
              className="child-task-row rounded-[1.4rem] px-4 py-3 text-[color:var(--foreground)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="task-icon-frame h-14 w-14">
                    <KiddoRouteImage
                      alt=""
                      className="task-icon-art"
                      debugLabel={`child-task-icon:${task.title}`}
                      height={46}
                      imageDebugMode={imageDebugMode}
                      src={getTaskIconPath(task.title)}
                      width={46}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold">{task.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {task.description || "Complete this task to earn boops."}
                    </p>
                  </div>
                </div>
                <div className="child-task-reward-badge mr-[15px] shrink-0 flex-nowrap">
                  <span className="whitespace-nowrap leading-none">+{task.boop_reward}</span>
                  <span
                    aria-hidden="true"
                    className="child-task-reward-star ml-1 shrink-0"
                    style={{ backgroundImage: `url(${GOODKIDDO_ASSETS.starIcon})` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <StatusPill
                  tone={
                    task.currentStatus === "approved"
                      ? "mint"
                      : task.currentStatus === "pending"
                        ? "sun"
                        : task.currentStatus === "rejected"
                          ? "rose"
                          : "sky"
                  }
                >
                  {task.currentStatus === "ready" ? "Ready" : task.currentStatus}
                </StatusPill>

                <form action={submitTaskCompletionAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <button
                    className="btn btn-secondary px-4 py-2 text-sm"
                    disabled={!task.canMarkComplete}
                    type="submit"
                  >
                    Mark Complete
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="child-panel rounded-[1.4rem] p-4 text-sm leading-6 text-white/76">
            Tasks will show up here once your parent adds them.
          </div>
        )}
      </div>

      {showSuccessBanner ? (
        <div className="child-status-banner mt-5 flex items-center gap-4 rounded-[1.6rem] px-4 py-4">
          <KiddoRouteImage
            alt=""
            debugLabel="child-success-banner-avatar"
            height={72}
            imageDebugMode={imageDebugMode}
            src={GOODKIDDO_ASSETS.boopWink}
            width={72}
          />
          <div>
            <p className="text-2xl font-black">All tasks done!</p>
            <p className="mt-1 text-sm font-bold text-white/85">
              Amazing work. Everything for today has been approved.
            </p>
          </div>
        </div>
      ) : null}

      <div className="child-panel mt-5 rounded-[1.6rem] px-4 py-4">
        <div className="flex items-center gap-3">
          <KiddoRouteImage
            alt=""
            className="h-auto w-[30px]"
            debugLabel="child-daily-bonus-icon"
            height={30}
            imageDebugMode={imageDebugMode}
            src={GOODKIDDO_ASSETS.dailyBonusIcon}
            width={30}
          />
          <div>
            <p className="text-lg font-black">Daily bonus</p>
            <p className="text-sm text-white/70">
              {checkedInDays >= 7
                ? "Perfect week reached. 10 bonus boops are now waiting to collect."
                : checkedInDays >= 5
                  ? "5-day bonus reached. Keep going for the full 10-boop week."
                  : "Open child mode across the week to light the stars and earn bonus boops."}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {childMode.dailyCheckInWeek.map((day) => {
            return (
              <div key={day.date} className="text-center">
                <div className="flex justify-center">
                  <KiddoRouteImage
                    alt=""
                    className={day.checkedIn ? "" : "opacity-35 grayscale"}
                    debugLabel={`child-daily-star:${day.label}`}
                    height={28}
                    imageDebugMode={imageDebugMode}
                    src={GOODKIDDO_ASSETS.starIcon}
                    width={28}
                  />
                </div>
                <p className="mt-1 text-[0.68rem] font-black text-white/72">{day.label}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white/58">
          {checkedInDays}/7 days this week
        </p>
      </div>
    </div>
  );
}

export function ChildRewardsCard({
  childMode,
  imageDebugMode = "off",
  returnTo,
  showHeader = true,
}: {
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
  returnTo: ChildPageRoute;
  showHeader?: boolean;
}) {
  const boopBalance = childMode.child?.boop_balance ?? 0;
  const progressPercent = childMode.tasks.length
    ? Math.round(
        (childMode.tasks.filter((task) => task.currentStatus === "approved").length /
          childMode.tasks.length) *
          100,
      )
    : 0;

  return (
    <div className="child-panel rounded-[2rem] p-5">
      {showHeader ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black">Rewards</p>
            <p className="mt-1 text-sm text-white/70">Save up and request something fun.</p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/80">
            {progressPercent}% done
          </div>
        </div>
      ) : null}
      <div className={showHeader ? "mt-5 grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
        {childMode.rewards.length ? (
          childMode.rewards.map((reward) => (
            <div
              key={reward.id}
              className="child-task-row rounded-[1.4rem] p-4 text-[color:var(--foreground)]"
            >
              <KiddoRouteImage
                alt=""
                className="mx-auto"
                debugLabel={`child-reward-icon:${reward.title}`}
                height={56}
                imageDebugMode={imageDebugMode}
                src={getRewardIconPath(reward.title)}
                width={56}
              />
              <p className="mt-3 text-center text-base font-extrabold">{reward.title}</p>
              <p className="mt-1 text-center text-sm text-[color:var(--ink-soft)]">
                {reward.description || "A special reward waiting for you."}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-black text-[color:var(--primary)]">
                  <span>{reward.cost}</span>
                  <KiddoRouteImage
                    alt=""
                    debugLabel="child-reward-star"
                    height={18}
                    imageDebugMode={imageDebugMode}
                    src={GOODKIDDO_ASSETS.starIcon}
                    width={18}
                  />
                </div>
                <ChildRewardRequestButton
                  disabled={boopBalance < reward.cost}
                  returnTo={returnTo}
                  rewardId={reward.id}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="child-panel rounded-[1.4rem] p-4 text-sm leading-6 text-white/76 sm:col-span-2">
            Rewards will show up here once your parent adds them.
          </div>
        )}
      </div>
    </div>
  );
}

export function ChildActivityCard({
  childMode,
  imageDebugMode = "off",
  showHeader = true,
}: {
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
  showHeader?: boolean;
}) {
  return (
    <div className="child-panel rounded-[2rem] p-5">
      {showHeader ? <p className="text-2xl font-black">Recent Activity</p> : null}
      <div className={showHeader ? "mt-4 space-y-3" : "space-y-3"}>
        {childMode.recentTransactions.length ? (
          childMode.recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="child-task-row rounded-[1.3rem] px-4 py-3 text-[color:var(--foreground)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">{transaction.reason}</p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {formatDateTime(transaction.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-black text-[color:var(--primary)]">
                  <span>
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </span>
                  <KiddoRouteImage
                    alt=""
                    debugLabel="child-activity-star"
                    height={18}
                    imageDebugMode={imageDebugMode}
                    src={GOODKIDDO_ASSETS.starIcon}
                    width={18}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="child-panel rounded-[1.4rem] p-4 text-sm leading-6 text-white/76">
            Recent boop activity will show up here.
          </div>
        )}
      </div>
    </div>
  );
}

export function ChildRewardQueueCard({
  childMode,
  imageDebugMode = "off",
  showHeader = true,
}: {
  childMode: ChildModeData;
  imageDebugMode?: KiddoImageDebugMode;
  showHeader?: boolean;
}) {
  return (
    <div className="child-panel rounded-[2rem] p-5">
      {showHeader ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xl font-black">Reward Queue</p>
          <KiddoRouteImage
            alt=""
            debugLabel="child-reward-queue-avatar"
            height={40}
            imageDebugMode={imageDebugMode}
            src={GOODKIDDO_ASSETS.boopSleepy}
            width={40}
          />
        </div>
      ) : null}
      <div className={showHeader ? "mt-4 space-y-3" : "space-y-3"}>
        {childMode.redemptions.length ? (
          childMode.redemptions.map((redemption) => (
            <div
              key={redemption.id}
              className="child-task-row rounded-[1.3rem] px-4 py-3 text-[color:var(--foreground)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">{redemption.rewardTitle ?? "Reward"}</p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {redemption.cost_at_redemption} boops
                  </p>
                </div>
                <StatusPill
                  tone={
                    redemption.status === "approved" || redemption.status === "completed"
                      ? "mint"
                      : redemption.status === "rejected"
                        ? "rose"
                        : "sun"
                  }
                >
                  {redemption.status}
                </StatusPill>
              </div>
            </div>
          ))
        ) : (
          <div className="child-panel rounded-[1.4rem] p-4 text-sm leading-6 text-white/76">
            No reward requests yet.
          </div>
        )}
      </div>
    </div>
  );
}

export function ChildProfileStudio({
  childMode,
}: {
  childMode: ChildModeData;
}) {
  if (!childMode.child) {
    return null;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="child-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          {childMode.child.avatar_url ? (
            <Image
              alt={`${childMode.child.display_name} avatar`}
              className="h-24 w-24 rounded-[1.7rem] object-cover shadow-[0_18px_28px_rgba(7,26,85,0.34)]"
              height={96}
              src={childMode.child.avatar_url}
              width={96}
            />
          ) : (
            <div className="rounded-[1.7rem] bg-[linear-gradient(180deg,#144ed4,#0b3aa9)] p-3 shadow-[0_18px_28px_rgba(7,26,85,0.34)]">
              <Image alt="" height={72} src={GOODKIDDO_ASSETS.boopHappy} width={72} />
            </div>
          )}
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">
              Profile
            </p>
            <h2 className="mt-2 text-4xl font-black">{childMode.child.display_name}</h2>
            <p className="mt-2 text-sm text-white/75">
              Pick a fun avatar for child mode. Parent uploads still work too, but this page
              gives the child friendly presets.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white/60">
            Coming soon
          </p>
          <h3 className="mt-2 text-xl font-black">Dress-up room</h3>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Later we can add outfits, accessories, and unlockable profile items here.
          </p>
        </div>
      </div>

      <div className="child-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-black">Choose an avatar</p>
            <p className="mt-1 text-sm text-white/70">
              Tap one to make it the child-mode profile picture.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CHILD_AVATAR_PRESETS.map((preset) => {
            const isSelected = childMode.child?.avatar_url === preset.value;

            return (
              <form key={preset.value} action={updateChildAvatarPresetAction}>
                <input type="hidden" name="avatarUrl" value={preset.value} />
                <input type="hidden" name="returnTo" value="/child/profile" />
                <button
                  className="child-avatar-option w-full rounded-[1.5rem] border px-4 py-4 text-center"
                  data-selected={isSelected}
                  type="submit"
                >
                  <Image
                    alt={preset.label}
                    className="mx-auto"
                    height={72}
                    src={preset.value}
                    width={72}
                  />
                  <p className="mt-3 text-sm font-extrabold text-[color:var(--foreground)]">
                    {preset.label}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                    {isSelected ? "Selected" : "Use avatar"}
                  </p>
                </button>
              </form>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black">More child pages</p>
              <p className="mt-1 text-sm text-white/70">
                Jump straight to what you want to do next.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn btn-secondary px-4 py-2 text-sm" href="/child">
              Home
            </Link>
            <Link className="btn btn-secondary px-4 py-2 text-sm" href="/child/rewards">
              Rewards
            </Link>
            <Link className="btn btn-secondary px-4 py-2 text-sm" href="/child/activity">
              Activity
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
