"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const PRESET_REWARDS = [1, 5, 10, 100] as const;

export function BoopRewardPicker({
  initialValue = 1,
  name,
  onChange,
  value,
}: {
  initialValue?: number;
  name: string;
  onChange?: (value: number) => void;
  value?: number;
}) {
  const groupId = useId();
  const [internalValue, setInternalValue] = useState(initialValue);
  const selectedValue = value ?? internalValue;

  function handleSelect(nextValue: number) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESET_REWARDS.map((reward) => {
          const isSelected = selectedValue === reward;
          const optionId = `${groupId}-${reward}`;

          return (
            <label key={reward} className="block" htmlFor={optionId}>
              <input
                checked={isSelected}
                className="sr-only"
                id={optionId}
                name={name}
                onChange={() => handleSelect(reward)}
                type="radio"
                value={reward}
              />
              <span
                className={cn(
                  "block rounded-[1rem] border px-4 py-3 text-center text-sm font-extrabold transition-colors",
                  isSelected
                    ? "border-[color:var(--primary-strong)] bg-[color:var(--primary)] text-white shadow-[0_10px_30px_rgba(239,90,47,0.2)]"
                    : "border-[color:var(--line-strong)] bg-white/75 text-[color:var(--foreground)] hover:bg-white",
                )}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              >
                {reward} {reward === 1 ? "Boop!" : "Boops!"}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
