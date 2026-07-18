"use client";

import { useRouter } from "next/navigation";

export function CreativeCoveBackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Go back"
      className="creative-cove-back-button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push("/child/kiddo_explorers");
      }}
      type="button"
    >
      <span aria-hidden="true" className="creative-cove-back-button__arrow">
        ←
      </span>
      <span className="creative-cove-back-button__label">Back</span>
    </button>
  );
}
