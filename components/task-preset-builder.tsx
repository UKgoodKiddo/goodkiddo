"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createTaskAction } from "@/app/actions";
import { BoopRewardPicker } from "@/components/boop-reward-picker";
import { getTaskIconPath } from "@/lib/goodkiddo-assets";

type TaskPreset = {
  title: string;
  description: string;
  boopReward: number;
  recurringType: "none" | "daily" | "weekly";
};

const TASK_PRESETS: TaskPreset[] = [
  {
    title: "Make Bed",
    description: "Straighten the duvet, fluff the pillow, and leave the bed tidy.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Brush Teeth",
    description: "Brush properly and rinse up after.",
    boopReward: 1,
    recurringType: "daily",
  },
  {
    title: "Have a Bath",
    description: "Get washed, dry off, and leave the bathroom neat.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Get Dressed",
    description: "Get ready independently and put pyjamas away.",
    boopReward: 1,
    recurringType: "daily",
  },
  {
    title: "Fold Clothes",
    description: "Fold clean clothes and stack them neatly.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Put Laundry Away",
    description: "Put folded clothes into drawers or wardrobe.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Pack Backpack",
    description: "Pack school things and double-check tomorrow is ready.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Make Lunch",
    description: "Help prepare lunch or snacks for the day.",
    boopReward: 10,
    recurringType: "daily",
  },
  {
    title: "Drink Water",
    description: "Finish a full glass of water.",
    boopReward: 1,
    recurringType: "daily",
  },
  {
    title: "Eat Healthy",
    description: "Choose a healthy snack or finish fruit with your meal.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Read Book",
    description: "Read quietly for 20 minutes.",
    boopReward: 10,
    recurringType: "daily",
  },
  {
    title: "Homework",
    description: "Complete homework and put it back in your bag.",
    boopReward: 10,
    recurringType: "daily",
  },
  {
    title: "Sweep Floor",
    description: "Sweep crumbs or dust from the floor area.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Vacuum",
    description: "Vacuum the room or hallway carefully.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Take Out Trash",
    description: "Take the bin out and put a fresh bag in.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Set the Table",
    description: "Lay out plates, cutlery, and cups ready for dinner.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Wash Dishes",
    description: "Wash up or help stack everything neatly.",
    boopReward: 10,
    recurringType: "daily",
  },
  {
    title: "Wipe Surfaces",
    description: "Wipe the table or kitchen counters clean.",
    boopReward: 10,
    recurringType: "weekly",
  },
  {
    title: "Water Plants",
    description: "Give the plants a careful water top-up.",
    boopReward: 5,
    recurringType: "weekly",
  },
  {
    title: "Feed Pet",
    description: "Feed your pet and refill their water if needed.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Walk the Dog",
    description: "Help with a dog walk or get the lead ready.",
    boopReward: 10,
    recurringType: "daily",
  },
  {
    title: "Tidy Up Toys",
    description: "Put toys back where they belong before the next activity.",
    boopReward: 5,
    recurringType: "daily",
  },
  {
    title: "Screen Time Over",
    description: "Turn screens off straight away when time is up.",
    boopReward: 1,
    recurringType: "daily",
  },
  {
    title: "Be Kind",
    description: "Show kindness to a sibling, friend, or grown-up today.",
    boopReward: 5,
    recurringType: "daily",
  },
];

export function TaskPresetBuilder({
  childOptions,
}: {
  childOptions: Array<{
    id: string;
    name: string;
  }>;
}) {
  const [selectedPreset, setSelectedPreset] = useState<TaskPreset | null>(TASK_PRESETS[0]);
  const [title, setTitle] = useState<string>(TASK_PRESETS[0].title);
  const [description, setDescription] = useState<string>(TASK_PRESETS[0].description);
  const [boopReward, setBoopReward] = useState<number>(TASK_PRESETS[0].boopReward);
  const [recurringType, setRecurringType] = useState<TaskPreset["recurringType"]>(
    TASK_PRESETS[0].recurringType,
  );
  const [childProfileId, setChildProfileId] = useState("");
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

  function applyPreset(preset: TaskPreset) {
    console.debug("[goodKiddo][task-preset][before]", {
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
    setBoopReward(preset.boopReward);
    setRecurringType(preset.recurringType);

    requestAnimationFrame(() => {
      console.debug("[goodKiddo][task-preset][after-raf]", {
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
      console.debug("[goodKiddo][task-preset][after-timeout]", {
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
            <p className="eyebrow">Task presets</p>
            <h3 className="mt-2 text-2xl font-extrabold">Tap a ready-made task</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              Choose a preset from your icon sheet, then tweak anything before saving.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[color:var(--primary)] shadow-[0_10px_25px_rgba(20,86,216,0.08)]">
            {TASK_PRESETS.length} presets
          </div>
        </div>

        <div className="mt-5 rounded-[1.45rem] border border-[color:var(--line)] bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-black text-[color:var(--foreground)]">
              Quick-pick task ideas
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
              Scroll to browse
            </p>
          </div>

          <div className="kiddo-scrollbar grid max-h-[13.5rem] gap-3 overflow-y-auto pr-1 sm:max-h-[15.5rem]">
            {TASK_PRESETS.map((preset) => {
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
                          src={getTaskIconPath(preset.title)}
                          width={68}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-extrabold">{preset.title}</span>
                        <span className="mt-1 block text-sm text-[color:var(--ink-soft)]">
                          {preset.boopReward} {preset.boopReward === 1 ? "Boop" : "Boops"} ·{" "}
                          {preset.recurringType === "daily"
                            ? "Daily"
                            : preset.recurringType === "weekly"
                              ? "Weekly"
                              : "One-time"}
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

      <form action={createTaskAction} className="grid gap-3">
        <input
          className="field"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          required
          value={title}
        />
        <textarea
          className="field min-h-28"
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          value={description}
        />
        <div className="grid gap-2">
          <p className="text-sm font-bold text-[color:var(--ink-soft)]">Boop reward</p>
          <BoopRewardPicker
            initialValue={boopReward}
            name="boopReward"
            onChange={setBoopReward}
            value={boopReward}
          />
        </div>
        <select
          className="field"
          name="recurringType"
          onChange={(event) =>
            setRecurringType(event.target.value as TaskPreset["recurringType"])
          }
          value={recurringType}
        >
          <option value="none">One-time task</option>
          <option value="daily">Daily recurring</option>
          <option value="weekly">Weekly recurring</option>
        </select>
        <select
          className="field"
          name="childProfileId"
          onChange={(event) => setChildProfileId(event.target.value)}
          value={childProfileId}
        >
          <option value="">Assign to all children</option>
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-4 py-3 text-sm font-bold">
          <input
            checked={active}
            name="active"
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
            value="on"
          />
          Task is active
        </label>
        <button className="btn btn-primary" type="submit">
          Add task
        </button>
      </form>
    </div>
  );
}
