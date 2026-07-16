"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export function CreativeCoveCanvas() {
  return (
    <div className="child-panel rounded-[2rem] bg-white p-3 text-slate-900 shadow-[0_24px_60px_rgba(6,24,77,0.22)]">
      <div className="mb-3 px-2">
        <h2 className="text-2xl font-black text-[color:var(--foreground)]">
          Creative Cove
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Draw anything you like.
        </p>
      </div>
      <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
        <div className="h-[70vh] min-h-[28rem] w-full">
          <Tldraw autoFocus />
        </div>
      </div>
    </div>
  );
}
