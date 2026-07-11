"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBoops } from "@/lib/utils";

type BoopCollectorChildCardProps = {
  activeTaskCount: number;
  avatarUrl: string | null;
  completedTodayCount: number;
  id: string;
  name: string;
  waitingToCollectBoops: number;
};

export function BoopCollectorChildCard({
  activeTaskCount,
  avatarUrl,
  completedTodayCount,
  id,
  name,
  waitingToCollectBoops,
}: BoopCollectorChildCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      aria-busy={isLoading}
      aria-label={`Collect waiting boops for ${name}`}
      className="relative flex min-h-[10.75rem] w-full flex-col rounded-[1.9rem] border border-[rgba(31,71,178,0.12)] bg-white p-4 text-left shadow-[0_18px_38px_rgba(31,71,178,0.08)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-90"
      disabled={isLoading}
      onClick={() => {
        if (isLoading) {
          return;
        }

        setIsLoading(true);
        router.push(`/parent/collect/${id}`);
      }}
      type="button"
    >
      <div className={isLoading ? "opacity-35" : undefined}>
        <div className="grid grid-cols-[2.55rem_minmax(0,1fr)] items-start gap-3">
          {avatarUrl ? (
            <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[#dff3ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <Image
                alt={`${name} avatar`}
                className="h-[2.3rem] w-[2.3rem] rounded-full object-cover"
                height={37}
                src={avatarUrl}
                width={37}
              />
            </div>
          ) : (
            <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffe783,#ffd34d)] text-[1.15rem] font-black text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pt-1">
            <p className="text-[clamp(0.98rem,3.5vw,1.25rem)] font-extrabold leading-[1.05] text-[color:var(--foreground)]">
              {name}
            </p>
            <p className="mt-2 whitespace-nowrap text-[clamp(0.88rem,3.15vw,1.08rem)] font-extrabold leading-none text-[color:var(--primary-strong)]">
              {formatBoops(waitingToCollectBoops)}
            </p>
            <p className="mt-1 text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
              to collect
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-[rgba(31,71,178,0.12)] pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
                Active tasks
              </p>
              <p className="mt-2 text-[1.5rem] font-extrabold leading-none text-[color:var(--primary-strong)]">
                {activeTaskCount}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
                Done today
              </p>
              <p className="mt-2 text-[1.5rem] font-extrabold leading-none text-[#2aa84a]">
                {completedTodayCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-[1.9rem] bg-white/55">
          <span aria-hidden="true" className="btn-spinner h-6 w-6 border-[3px]" />
        </span>
      ) : null}
    </button>
  );
}
