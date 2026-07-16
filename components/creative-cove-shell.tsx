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
      <div className="child-panel rounded-[2rem] bg-white p-6 text-center text-slate-700 shadow-[0_24px_60px_rgba(6,24,77,0.22)]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1f56d8]" />
        <p className="mt-4 text-sm font-bold">Opening Creative Cove...</p>
      </div>
    ),
  },
);

export function CreativeCoveShell() {
  return <CreativeCoveCanvas />;
}
