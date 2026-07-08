"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  collectWaitingBoopsForChildInlineAction,
  type CollectWaitingBoopsInlineState,
} from "@/app/actions";
import { NfcUidCapture } from "@/components/nfc-uid-capture";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { formatBoops } from "@/lib/utils";

const INITIAL_STATE: CollectWaitingBoopsInlineState = {
  status: "idle",
};

function CelebrationConfetti({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="parent-collect-confetti"
      data-active={active ? "true" : "false"}
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="parent-collect-confetti-piece"
          style={
            {
              "--collect-confetti-delay": `${(index % 7) * 45}ms`,
              "--collect-confetti-left": `${4 + index * 3.4}%`,
              "--collect-confetti-rotation": `${index * 17}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function ParentCollectBoopsClient({
  childId,
  childName,
  initialPendingBoops,
  prefilledBooperUid = "",
}: {
  childId: string;
  childName: string;
  initialPendingBoops: number;
  prefilledBooperUid?: string;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const autoCollectRef = useRef(false);
  const [pendingBoops, setPendingBoops] = useState(initialPendingBoops);
  const [submitState, setSubmitState] =
    useState<CollectWaitingBoopsInlineState>(INITIAL_STATE);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(async (formData: FormData) => {
    const result = await collectWaitingBoopsForChildInlineAction(INITIAL_STATE, formData);
    setSubmitState(result);

    if (result.status === "submitted") {
      setPendingBoops((currentTotal) =>
        Math.max(0, currentTotal - (result.claimedTotal ?? currentTotal)),
      );
      setShowCelebration(true);
      void audioRef.current?.play().catch(() => undefined);

      redirectTimeoutRef.current = window.setTimeout(() => {
        router.push("/parent");
        router.refresh();
      }, 2200);
    }
  }, [router]);

  useEffect(() => {
    if (!prefilledBooperUid || autoCollectRef.current) {
      return;
    }

    autoCollectRef.current = true;

    const formData = new FormData();
    formData.set("childProfileId", childId);
    formData.set("nfcUid", prefilledBooperUid);

    void handleSubmit(formData);
  }, [childId, handleSubmit, prefilledBooperUid]);

  const feedbackMessage =
    submitState.status === "wrong-booper"
      ? "That Booper belongs to a different child."
      : submitState.status === "no-boops-waiting"
        ? "There are no waiting boops to collect for this child right now."
        : submitState.status === "error"
          ? "That collection could not be completed. Please try again."
          : null;

  return (
    <>
      <audio ref={audioRef} preload="auto" src={GOODKIDDO_ASSETS.collectBoopsAudio} />

      <form action={handleSubmit} className="grid gap-6">
        <input name="childProfileId" type="hidden" value={childId} />

        <div className="rounded-[2rem] border border-[rgba(23,34,70,0.08)] bg-white p-6 shadow-[0_18px_48px_rgba(19,39,91,0.08)]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Collect Boops
          </p>
          <h1 className="mt-2 text-4xl font-black text-[color:var(--foreground)]">
            {childName}
          </h1>
          <p className="mt-5 text-lg font-bold text-[color:var(--ink-soft)]">
            Waiting now
          </p>
          <p className="mt-2 text-5xl font-black text-[color:var(--primary-strong)]">
            {formatBoops(pendingBoops)}
          </p>
        </div>

        <div className="rounded-[2rem] border border-[rgba(23,34,70,0.08)] bg-white p-6 shadow-[0_18px_48px_rgba(19,39,91,0.08)]">
          <NfcUidCapture
            autoSubmit
            buttonChildren={
              <Image
                alt=""
                className="parent-collect-star-image h-auto w-full object-contain"
                height={540}
                priority
                src={GOODKIDDO_ASSETS.collectBoopsButton}
                width={540}
              />
            }
            buttonClassName="parent-collect-star-button !h-auto !w-full !bg-transparent !p-0 !shadow-none hover:!translate-y-0"
            buttonLabel={`Scan ${childName}'s Booper to collect waiting boops`}
            defaultValue={prefilledBooperUid}
            inputName="nfcUid"
            required
            showInput={false}
            showMessage={false}
          />

          {feedbackMessage ? (
            <div className="mt-4 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
              {feedbackMessage}
            </div>
          ) : null}
        </div>
      </form>

      {showCelebration ? (
        <div className="parent-collect-success-overlay fixed inset-0 z-[260] flex items-center justify-center px-6">
          <CelebrationConfetti active />
          <div className="relative z-10 text-center">
            <Image
              alt=""
              className="mx-auto h-[10rem] w-[10rem] object-contain sm:h-[12rem] sm:w-[12rem]"
              height={540}
              priority
              src={GOODKIDDO_ASSETS.collectBoopsButton}
              width={540}
            />
            <p className="mt-8 text-5xl font-black text-[color:var(--foreground)] sm:text-6xl">
              Boops Collected
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
