"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoopCollectorChildCard } from "@/components/boop-collector-child-card";
import { ParentRewardWizardLauncher } from "@/components/parent-reward-wizard-launcher";
import { ParentSurpriseBoopsWizardLauncher } from "@/components/parent-surprise-boops-wizard-launcher";
import { ParentTaskWizardLauncher } from "@/components/parent-task-wizard-launcher";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import type { TaskCardCategoryName } from "@/lib/task-card-utils";
import { formatBoops } from "@/lib/utils";

type ChildOption = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

type TaskAssetOption = {
  category: TaskCardCategoryName;
  childAssetSrc: string | null;
  key: string;
  looseTitle: string;
  normalizedTitle: string;
  parentAssetSrc: string;
  title: string;
};

type TaskAssetCategory = {
  name: TaskCardCategoryName;
  tasks: TaskAssetOption[];
};

type ChildSnapshotCard = {
  activeTaskCount: number;
  avatarUrl: string | null;
  completedTodayCount: number;
  id: string;
  name: string;
  waitingToCollectBoops: number;
};

type ChildBalanceCard = {
  avatarUrl: string | null;
  boopBalance: number;
  createdAtLabel: string;
  id: string;
  name: string;
};

type DashboardSectionKey =
  | "approvals"
  | "tasks"
  | "rewards"
  | "surprise"
  | "collector"
  | "balances";

type DashboardSection = {
  description: string;
  eyebrow: string;
  iconAlt?: string;
  iconSrc?: string;
  key: DashboardSectionKey;
  label: string;
  meta: string;
  title: string;
};

const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    description:
      "Review task completions and reward requests from one place so nothing sits waiting too long.",
    eyebrow: "Pending approvals",
    key: "approvals",
    label: "Pending approvals",
    meta: "Open now",
    title: "Parent to do list",
  },
  {
    description:
      "Set a child, choose a task card, pick the boop reward, and send it straight into the family flow.",
    eyebrow: "Create task",
    iconAlt: "Tasks",
    iconSrc: GOODKIDDO_ASSETS.childTasksButton,
    key: "tasks",
    label: "Create task",
    meta: "Open builder",
    title: "Add a new task",
  },
  {
    description:
      "Pick from the reward set, choose the boop cost, and make it available for the family right away.",
    eyebrow: "Create reward",
    iconAlt: "Rewards",
    iconSrc: GOODKIDDO_ASSETS.childRewardsButton,
    key: "rewards",
    label: "Create reward",
    meta: "Open builder",
    title: "Add a new reward",
  },
  {
    description:
      "Send a surprise boost to one child or the whole family when you want to celebrate kindness, effort, or a brilliant moment.",
    eyebrow: "Extra boops",
    iconAlt: "Extra boops",
    iconSrc: GOODKIDDO_ASSETS.boopHappy,
    key: "surprise",
    label: "Give extra boops",
    meta: "Open builder",
    title: "Give extra boops",
  },
  {
    description:
      "Open a child card to collect what is waiting and keep tabs on active tasks and what has already been completed today.",
    eyebrow: "Boop collector",
    iconAlt: "Boop collector",
    iconSrc: GOODKIDDO_ASSETS.boopPopPiratesTreasureChestCollectible,
    key: "collector",
    label: "Boop collector",
    meta: "Open collector",
    title: "Collect waiting boops",
  },
  {
    description:
      "Keep a quick read on how many boops each child has ready to spend.",
    eyebrow: "Boop balances",
    iconAlt: "Boop balances",
    iconSrc: GOODKIDDO_ASSETS.starIcon,
    key: "balances",
    label: "Boop balances",
    meta: "Open balances",
    title: "Family balance snapshot",
  },
];

function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.50),rgba(232,241,255,0.50))] shadow-[0_24px_56px_rgba(12,25,72,0.18),inset_0_1px_0_rgba(255,255,255,0.54)] backdrop-blur-[22px] ${className}`}
    >
      {children}
    </div>
  );
}

export function ParentDashboardExperience({
  balances,
  childOptions,
  childSnapshotCards,
  pendingApprovals,
  pendingRewardRequestCount,
  pendingTaskCompletionCount,
  taskCatalog,
}: {
  balances: ChildBalanceCard[];
  childOptions: ChildOption[];
  childSnapshotCards: ChildSnapshotCard[];
  pendingApprovals: number;
  pendingRewardRequestCount: number;
  pendingTaskCompletionCount: number;
  taskCatalog: TaskAssetCategory[];
}) {
  const contentViewportRef = useRef<HTMLDivElement | null>(null);
  const topButtonRefs = useRef<Record<DashboardSectionKey, HTMLButtonElement | null>>({
    approvals: null,
    balances: null,
    collector: null,
    rewards: null,
    surprise: null,
    tasks: null,
  });
  const [activeSection, setActiveSection] = useState<DashboardSectionKey>("approvals");

  const sectionIndexLookup = useMemo(
    () =>
      DASHBOARD_SECTIONS.reduce<Record<DashboardSectionKey, number>>((accumulator, section, index) => {
        accumulator[section.key] = index;
        return accumulator;
      }, {} as Record<DashboardSectionKey, number>),
    [],
  );

  useEffect(() => {
    topButtonRefs.current[activeSection]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSection]);

  function scrollToSection(nextSection: DashboardSectionKey) {
    const viewport = contentViewportRef.current;
    const sectionIndex = sectionIndexLookup[nextSection];

    setActiveSection(nextSection);

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      behavior: "smooth",
      left: viewport.clientWidth * sectionIndex,
      top: 0,
    });
  }

  function handleViewportScroll() {
    const viewport = contentViewportRef.current;

    if (!viewport) {
      return;
    }

    const nextIndex = Math.round(viewport.scrollLeft / Math.max(viewport.clientWidth, 1));
    const nextSection = DASHBOARD_SECTIONS[nextIndex]?.key;

    if (nextSection && nextSection !== activeSection) {
      setActiveSection(nextSection);
    }
  }

  function renderSlideContent(section: DashboardSection) {
    switch (section.key) {
      case "approvals":
        return (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <SurfaceCard className="rounded-[1.8rem] p-5 sm:p-6">
              <p className="parent-eyebrow">Outstanding approvals</p>
              <p className="mt-4 text-5xl font-extrabold leading-none text-[color:var(--primary-strong)] sm:text-6xl">
                {pendingApprovals}
              </p>
              <p className="mt-3 text-sm font-bold text-[color:var(--ink-soft)]">
                Waiting for a parent decision right now
              </p>
              <Link className="btn btn-primary mt-6 inline-flex text-center" href="/parent/approvals">
                Open approvals
              </Link>
            </SurfaceCard>

            <div className="grid content-start gap-3">
              <p className="parent-detail-badge">
                {pendingTaskCompletionCount} task completions waiting.
              </p>
              <p className="parent-detail-badge">
                {pendingRewardRequestCount} reward requests waiting.
              </p>
            </div>
          </div>
        );
      case "tasks":
        return (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] lg:items-center">
            <SurfaceCard className="rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(234,244,255,0.3))] shadow-[0_16px_28px_rgba(18,39,96,0.12)]">
                  <Image
                    alt="Tasks"
                    className="h-auto w-[4.2rem] object-contain"
                    height={82}
                    src={GOODKIDDO_ASSETS.childTasksButton}
                    unoptimized
                    width={82}
                  />
                </div>
                <div className="min-w-0">
                  <p className="parent-eyebrow">Task builder</p>
                  <p className="mt-2 text-lg font-extrabold">Create a task card for one child or everyone.</p>
                </div>
              </div>
            </SurfaceCard>

            <div className="flex justify-start lg:justify-end">
              <ParentTaskWizardLauncher
                childOptions={childOptions}
                returnTo="/parent"
                taskCatalog={taskCatalog}
                triggerLabel="Create task"
              />
            </div>
          </div>
        );
      case "rewards":
        return (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] lg:items-center">
            <SurfaceCard className="rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(234,244,255,0.3))] shadow-[0_16px_28px_rgba(18,39,96,0.12)]">
                  <Image
                    alt="Rewards"
                    className="h-auto w-[4.2rem] object-contain"
                    height={82}
                    src={GOODKIDDO_ASSETS.childRewardsButton}
                    unoptimized
                    width={82}
                  />
                </div>
                <div className="min-w-0">
                  <p className="parent-eyebrow">Reward builder</p>
                  <p className="mt-2 text-lg font-extrabold">Create a reward and set the boop cost in one flow.</p>
                </div>
              </div>
            </SurfaceCard>

            <div className="flex justify-start lg:justify-end">
              <ParentRewardWizardLauncher
                childOptions={childOptions}
                triggerLabel="Create reward"
              />
            </div>
          </div>
        );
      case "surprise":
        return (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] lg:items-center">
            <SurfaceCard className="rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(234,244,255,0.3))] shadow-[0_16px_28px_rgba(18,39,96,0.12)]">
                  <Image
                    alt="Extra boops"
                    className="h-auto w-[4.4rem] object-contain"
                    height={86}
                    src={GOODKIDDO_ASSETS.boopHappy}
                    unoptimized
                    width={86}
                  />
                </div>
                <div className="min-w-0">
                  <p className="parent-eyebrow">Boop boost</p>
                  <p className="mt-2 text-lg font-extrabold">Celebrate effort, kindness, or a brilliant moment with extra boops.</p>
                </div>
              </div>
            </SurfaceCard>

            <div className="flex justify-start lg:justify-end">
              <ParentSurpriseBoopsWizardLauncher
                childOptions={childOptions}
                triggerLabel="Award surprise boops"
              />
            </div>
          </div>
        );
      case "collector":
        return childSnapshotCards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {childSnapshotCards.map((child) => (
              <BoopCollectorChildCard
                activeTaskCount={child.activeTaskCount}
                avatarUrl={child.avatarUrl}
                completedTodayCount={child.completedTodayCount}
                key={child.id}
                id={child.id}
                name={child.name}
                waitingToCollectBoops={child.waitingToCollectBoops}
              />
            ))}
          </div>
        ) : (
          <SurfaceCard className="rounded-[1.8rem] p-5 text-sm font-bold text-[color:var(--ink-soft)]">
            Child cards will appear here once profiles exist.
          </SurfaceCard>
        );
      case "balances":
        return balances.length ? (
          <div className="grid gap-3">
            {balances.map((child) => (
              <div
                key={child.id}
                className="list-row flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {child.avatarUrl ? (
                    <Image
                      alt={`${child.name} avatar`}
                      className="h-12 w-12 rounded-[1rem] object-cover"
                      height={48}
                      src={child.avatarUrl}
                      width={48}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[color:var(--sun)] text-lg font-black text-[color:var(--foreground)]">
                      {child.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold">{child.name}</p>
                    <p className="text-sm text-[color:var(--ink-soft)]">
                      Created {child.createdAtLabel}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-xl font-extrabold text-[color:var(--primary-strong)]">
                  {formatBoops(child.boopBalance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <SurfaceCard className="rounded-[1.8rem] p-5 text-sm font-bold text-[color:var(--ink-soft)]">
            Add your first child profile to start tracking boops.
          </SurfaceCard>
        );
      default:
        return null;
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
      <div className="kiddo-scrollbar overflow-x-auto overflow-y-hidden px-4 sm:px-6 lg:px-8">
        <div className="flex w-max gap-4 pb-1">
          {DASHBOARD_SECTIONS.map((section) => {
            const isActive = section.key === activeSection;
            const meta =
              section.key === "approvals"
                ? `${pendingApprovals} waiting`
                : section.key === "collector"
                  ? `${childSnapshotCards.length || "No"} child cards`
                  : section.key === "balances"
                    ? `${balances.length || "No"} balances`
                    : section.meta;

            return (
              <button
                aria-pressed={isActive}
                className={`flex w-[10.75rem] shrink-0 flex-col items-center justify-center gap-2 rounded-[2rem] border px-4 py-5 text-center transition sm:w-[11.5rem] ${
                  isActive
                    ? "border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(230,241,255,0.18))] shadow-[0_22px_48px_rgba(7,17,49,0.24),inset_0_1px_0_rgba(255,255,255,0.18)]"
                    : "border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(224,236,255,0.08))] shadow-[0_18px_42px_rgba(7,17,49,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]"
                } backdrop-blur-[18px]`}
                key={section.key}
                onClick={() => scrollToSection(section.key)}
                ref={(node) => {
                  topButtonRefs.current[section.key] = node;
                }}
                type="button"
              >
                {section.iconSrc ? (
                  <div className="flex min-h-[5rem] items-center justify-center">
                    <Image
                      alt={section.iconAlt ?? ""}
                      className="h-auto max-h-20 w-auto max-w-20 object-contain drop-shadow-[0_12px_22px_rgba(5,13,41,0.26)]"
                      height={84}
                      src={section.iconSrc}
                      unoptimized
                      width={84}
                    />
                  </div>
                ) : (
                  <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(9,25,69,0.82),rgba(13,37,99,0.76))] text-[1.65rem] font-black text-white shadow-[0_12px_28px_rgba(7,17,49,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]">
                    {pendingApprovals}
                  </div>
                )}
                <span className="text-[1.02rem] font-black leading-tight text-white">
                  {section.label}
                </span>
                <span className="text-[0.72rem] font-black uppercase tracking-[0.12em] text-white/76">
                  {meta}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="kiddo-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        onScroll={handleViewportScroll}
        ref={contentViewportRef}
      >
        {DASHBOARD_SECTIONS.map((section) => (
          <section className="min-w-full snap-center px-4 sm:px-6 lg:px-8" key={section.key}>
            <SurfaceCard className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[2rem]">
              <div className="border-b border-white/20 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="parent-eyebrow">{section.eyebrow}</p>
                    <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                      {section.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--ink-soft)] sm:text-base">
                      {section.description}
                    </p>
                  </div>
                  {section.iconSrc ? (
                    <div className="hidden shrink-0 sm:flex h-18 w-18 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(236,244,255,0.2))] shadow-[0_14px_30px_rgba(18,39,96,0.10)]">
                      <Image
                        alt={section.iconAlt ?? ""}
                        className="h-auto max-h-14 w-auto max-w-14 object-contain"
                        height={56}
                        src={section.iconSrc}
                        unoptimized
                        width={56}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="kiddo-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {renderSlideContent(section)}
              </div>
            </SurfaceCard>
          </section>
        ))}
      </div>
    </section>
  );
}
