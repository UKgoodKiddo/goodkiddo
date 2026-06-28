import Link from "next/link";

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.5 10V7.75C8.5 5.68 10.18 4 12.25 4C14.32 4 16 5.68 16 7.75V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
        width="13"
        x="5.5"
        y="10"
      />
      <circle cx="12" cy="15" fill="currentColor" r="1.1" />
    </svg>
  );
}

export function ParentUnlock() {
  return (
    <Link
      aria-label="Parent unlock"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-[0_12px_30px_rgba(6,23,80,0.22)] transition hover:bg-white/18"
      href="/child/unlock"
      style={{
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
      }}
    >
      <LockIcon />
    </Link>
  );
}
