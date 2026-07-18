"use client";

import dynamic from "next/dynamic";

const CreativeCoveCanvas = dynamic(
  () =>
    import("@/components/creative-cove-canvas").then(
      (module) => module.CreativeCoveCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="creative-cove-loading">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1f56d8]" />
        <p className="mt-4 text-sm font-bold">Opening Creative Cove...</p>
      </div>
    ),
  },
);

export function CreativeCoveShell() {
  return <CreativeCoveCanvas />;
}
