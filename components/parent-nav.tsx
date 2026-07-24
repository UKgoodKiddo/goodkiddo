"use client";

import Link from "next/link";
import { useLayoutEffect, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/children", label: "Children" },
  { href: "/parent/tasks", label: "Tasks" },
  { href: "/parent/approvals", label: "Approvals" },
  { href: "/parent/rewards", label: "Rewards" },
  { href: "/parent/activity", label: "Activity" },
  { href: "/parent/worry-box", label: "Worry Box" },
  { href: "/parent/child-mode", label: "Child mode" },
  { href: "/parent/settings", label: "Settings" },
] as const;

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 6L18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

export function ParentNav({
  viewerEmail,
}: {
  viewerEmail?: string | null;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    return () => {
      setIsOpen(false);
    };
  }, [pathname]);

  const portalTarget = typeof document === "undefined" ? null : document.body;

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? "Close parent menu" : "Open parent menu"}
        className="relative z-30 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(18,39,96,0.08)] bg-white text-[color:var(--foreground)] shadow-[0_16px_32px_rgba(20,36,82,0.14)]"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          touchAction: "manipulation",
        }}
        type="button"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      {isOpen && portalTarget
        ? createPortal(
            <div className="fixed inset-0 z-[220]">
              <button
                aria-label="Close parent menu"
                className="parent-menu-backdrop absolute inset-0 bg-[rgba(7,22,66,0.34)] backdrop-blur-[2px]"
                onClick={() => setIsOpen(false)}
                type="button"
              />

              <div className="pointer-events-none fixed right-4 top-24 w-[min(21rem,calc(100vw-2rem))] sm:right-6 sm:top-28">
                <div className="parent-menu-panel pointer-events-auto max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[1.8rem] border border-[rgba(18,39,96,0.1)] bg-white p-4 shadow-[0_28px_60px_rgba(8,24,72,0.24)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                        Parent Hub
                      </p>
                      <p className="mt-2 break-words text-sm font-bold text-[color:var(--foreground)]">
                        {viewerEmail ?? "Parent menu"}
                      </p>
                    </div>

                    <button
                      aria-label="Close parent menu"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[#f6f8ff] text-[color:var(--foreground)]"
                      onClick={() => setIsOpen(false)}
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <nav className="mt-4 grid gap-2">
                    {navItems.map((item) => {
                      const active = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          className={cn(
                            "rounded-[1.3rem] px-4 py-3 text-base font-extrabold transition-all duration-150",
                            active
                              ? "bg-[linear-gradient(180deg,#1456d8,#0b3db5)] text-white shadow-[0_12px_24px_rgba(11,61,181,0.22)]"
                              : "bg-[#f6f9ff] text-[color:var(--foreground)] hover:bg-[#ebf2ff]",
                          )}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-4">
                    <form action={signOutAction}>
                      <LoadingSubmitButton
                        className="btn btn-primary w-full"
                        pendingLabel="Signing out..."
                      >
                        Sign out
                      </LoadingSubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
