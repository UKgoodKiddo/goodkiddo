"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 10V7.5C8 5.01472 10.0147 3 12.5 3C14.9853 3 17 5.01472 17 7.5V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <rect
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
        width="14"
        x="5"
        y="10"
      />
    </svg>
  );
}

export function ExitChildModeButton() {
  const pathname = usePathname();

  if (pathname === "/child/unlock") {
    return null;
  }

  return (
    <Link
      aria-label="Unlock parent mode"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_10px_24px_rgba(7,22,66,0.22)] transition-colors duration-150 hover:bg-white/16"
      href="/child/unlock"
      title="Unlock parent mode"
    >
      <LockIcon />
    </Link>
  );
}
