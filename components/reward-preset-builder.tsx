"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createRewardAction } from "@/app/actions";
import { getRewardIconPath } from "@/lib/goodkiddo-assets";

type RewardPreset = {
  title: string;
  description: string;
  cost: number;
};

const REWARD_PRESETS: RewardPreset[] = [
  {
    title: "Extra Screen Time",
    description: "Earn an extra 20 minutes of screen time today.",
    cost: 80,
  },
  {
    title: "Ice Cream",
    description: "Choose an ice cream treat on the next outing.",
    cost: 100,
  },
  {
    title: "Sweet Treat",
    description: "Pick a little sweet treat after dinner.",
    cost: 90,
  },
  {
    title: "Movie Night",
    description: "Choose a movie for a cosy family movie night.",
    cost: 140,
  },
  {
    title: "Popcorn and Film",
    description: "A film night with popcorn and a comfy blanket pile.",
    cost: 130,
  },
  {
    title: "Choose Dinner",
    description: "Pick what is for dinner one night this week.",
    cost: 150,
  },
  {
    title: "Choose Today's Activity",
    description: "Be the boss of one family activity for the day.",
    cost: 160,
  },
  {
    title: "Trip to the Park",
    description: "Plan a special park trip with snacks and play time.",
    cost: 180,
  },
  {
    title: "Family Bike Ride",
    description: "Head out together for a family bike ride adventure.",
    cost: 220,
  },
  {
    title: "Family Game Night",
    description: "Pick the games for a family games night.",
    cost: 200,
  },
  {
    title: "Pocket Money",
    description: "Swap boops for a little pocket money reward.",
    cost: 250,
  },
  {
    title: "Surprise Reward",
    description: "Let your grown-up choose a fun surprise reward.",
    cost: 175,
  },
];

export function RewardPresetBuilder() {
  const [selectedPreset, setSelectedPreset] = useState<RewardPreset | null>(
    REWARD_PRESETS[0],
  );
  const [title, setTitle] = useState<string>(REWARD_PRESETS[0].title);
  const [description, setDescription] = useState<string>(REWARD_PRESETS[0].description);
  const [cost, setCost] = useState<number>(REWARD_PRESETS[0].cost);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const debugWindow = window as Window & {
      __goodKiddoPresetDebugInstalled?: boolean;
      __goodKiddoOriginalFocus?: typeof HTMLElement.prototype.focus;
      __goodKiddoOriginalScrollIntoView?: typeof HTMLElement.prototype.scrollIntoView;
    };

    if (!debugWindow.__goodKiddoOriginalFocus) {
      debugWindow.__goodKiddoOriginalFocus = HTMLElement.prototype.focus;
    }

    if (!debugWindow.__goodKiddoOriginalScrollIntoView) {
      debugWindow.__goodKiddoOriginalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    }

    if (debugWindow.__goodKiddoPresetDebugInstalled) {
      return;
    }

    HTMLElement.prototype.focus = function patchedFocus(...args) {
      console.debug("[goodKiddo][focus()]", {
        className: this.className,
        id: this.id,
        name: this.getAttribute("name"),
        tagName: this.tagName,
        type: this.getAttribute("type"),
      });

      return debugWindow.__goodKiddoOriginalFocus!.apply(this, args);
    };

    HTMLElement.prototype.scrollIntoView = function patchedScrollIntoView(...args) {
      console.debug("[goodKiddo][scrollIntoView()]", {
        className: this.className,
        id: this.id,
        name: this.getAttribute("name"),
        scrollY: window.scrollY,
        tagName: this.tagName,
        type: this.getAttribute("type"),
      });

      return debugWindow.__goodKiddoOriginalScrollIntoView!.apply(this, args);
    };

    debugWindow.__goodKiddoPresetDebugInstalled = true;
  }, []);

  function applyPreset(preset: RewardPreset) {
    console.debug("[goodKiddo][reward-preset][before]", {
      activeElement:
        document.activeElement instanceof HTMLElement
          ? {
              className: document.activeElement.className,
              id: document.activeElement.id,
              name: document.activeElement.getAttribute("name"),
              tagName: document.activeElement.tagName,
              type: document.activeElement.getAttribute("type"),
            }
          : null,
      preset: preset.title,
      scrollY: window.scrollY,
    });

    setSelectedPreset(preset);
    setTitle(preset.title);
    setDescription(preset.description);
    setCost(preset.cost);

    requestAnimationFrame(() => {
      console.debug("[goodKiddo][reward-preset][after-raf]", {
        activeElement:
          document.activeElement instanceof HTMLElement
            ? {
                className: document.activeElement.className,
                id: document.activeElement.id,
                name: document.activeElement.getAttribute("name"),
                tagName: document.activeElement.tagName,
                type: document.activeElement.getAttribute("type"),
              }
            : null,
        preset: preset.title,
        scrollY: window.scrollY,
      });
    });

    window.setTimeout(() => {
      console.debug("[goodKiddo][reward-preset][after-timeout]", {
        activeElement:
          document.activeElement instanceof HTMLElement
            ? {
                className: document.activeElement.className,
                id: document.activeElement.id,
                name: document.activeElement.getAttribute("name"),
                tagName: document.activeElement.tagName,
                type: document.activeElement.getAttribute("type"),
              }
            : null,
        preset: preset.title,
        scrollY: window.scrollY,
      });
    }, 0);
  }

  return (
    <div className="grid gap-5">
      <div className="parent-soft-panel rounded-[1.6rem] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Reward presets</p>
            <h3 className="mt-2 text-2xl font-extrabold">Tap a ready-made reward</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              Start with one of your icon rewards, then tweak the title, cost, or wording before saving.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[color:var(--primary)] shadow-[0_10px_25px_rgba(20,86,216,0.08)]">
            {REWARD_PRESETS.length} presets
          </div>
        </div>

        <div className="mt-5 rounded-[1.45rem] border border-[color:var(--line)] bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-black text-[color:var(--foreground)]">
              Quick-pick reward ideas
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
              Scroll to browse
            </p>
          </div>

          <div className="kiddo-scrollbar grid max-h-[13.5rem] gap-3 overflow-y-auto pr-1 sm:max-h-[15.5rem]">
            {REWARD_PRESETS.map((preset) => {
              const isSelected = selectedPreset?.title === preset.title;

              return (
                <button
                  key={preset.title}
                  className="block w-full text-left"
                  onClick={() => applyPreset(preset)}
                  style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                  type="button"
                >
                  <span
                    className={`block rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? "border-[color:var(--primary)] bg-[rgba(20,86,216,0.08)] shadow-[0_14px_30px_rgba(20,86,216,0.12)]"
                        : "border-[color:var(--line)] bg-white/92 hover:bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <span className="task-icon-frame -ml-1 h-20 w-20">
                        <Image
                          alt=""
                          className="task-icon-art"
                          height={68}
                          src={getRewardIconPath(preset.title)}
                          width={68}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-extrabold">{preset.title}</span>
                        <span className="mt-1 block text-sm text-[color:var(--ink-soft)]">
                          {preset.cost} boops
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`text-xl font-black ${
                          isSelected ? "text-[color:var(--primary)]" : "text-[color:var(--ink-soft)]"
                        }`}
                      >
                        +
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form action={createRewardAction} className="grid gap-3">
        <input
          className="field"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Reward title"
          required
          value={title}
        />
        <input
          className="field"
          min={1}
          name="cost"
          onChange={(event) => setCost(Number(event.target.value) || 0)}
          placeholder="Cost in boops"
          required
          type="number"
          value={cost}
        />
        <textarea
          className="field min-h-28"
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          value={description}
        />
        <label className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-4 py-3 text-sm font-bold">
          <input
            checked={active}
            name="active"
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
            value="on"
          />
          Reward is active
        </label>
        <button className="btn btn-primary" type="submit">
          Add reward
        </button>
      </form>
    </div>
  );
}
