"use client";

import { usePathname } from "next/navigation";
import { SpinningNavLink } from "@/components/spinning-nav-link";
import { cn } from "@/lib/utils";

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
        stroke="#0d348d"
        strokeLinecap="round"
        strokeWidth="2.1"
      />
      <rect
        fill="#0d348d"
        height="10"
        rx="2.5"
        width="14"
        x="5"
        y="10"
      />
      <path
        d="M12 13.35C10.9509 13.35 10.1 14.2009 10.1 15.25C10.1 15.9811 10.513 16.6141 11.118 16.9316V18.45C11.118 18.936 11.514 19.332 12 19.332C12.486 19.332 12.882 18.936 12.882 18.45V16.9316C13.487 16.6141 13.9 15.9811 13.9 15.25C13.9 14.2009 13.0491 13.35 12 13.35Z"
        fill="white"
      />
    </svg>
  );
}

export function ExitChildModeButton({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();

  if (pathname === "/child/unlock") {
    return null;
  }

  return (
    <SpinningNavLink
      aria-label="Unlock parent mode"
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_10px_24px_rgba(7,22,66,0.22)] transition-colors duration-150 hover:bg-white/16",
        className,
      )}
      href="/child/unlock"
      title="Unlock parent mode"
    >
      <LockIcon />
    </SpinningNavLink>
  );
}
