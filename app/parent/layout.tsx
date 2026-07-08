import Image from "next/image";
import Link from "next/link";
import { ParentNav } from "@/components/parent-nav";
import { getParentViewer } from "@/lib/auth";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" fill="white" r="22" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="18" fill="currentColor" r="7" />
      <path
        d="M12 38C13.7 30.9 18.2 27.5 24 27.5C29.8 27.5 34.3 30.9 36 38"
        fill="currentColor"
      />
    </svg>
  );
}

export default async function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getParentViewer();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6">
      <header className="parent-hero shell-card relative z-20 mb-6 overflow-hidden rounded-[2rem] px-5 py-6 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(141,255,217,0.18),transparent_26%),radial-gradient(circle_at_right_center,rgba(20,86,216,0.08),transparent_30%)]"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="-mt-1 min-w-0 flex-1 pt-0">
            <Image
              alt="goodKiddo Child Behaviour Support App"
              className="h-auto w-full max-w-[15.1rem] sm:max-w-[18.25rem]"
              height={584}
              priority
              src={GOODKIDDO_ASSETS.headerLogo}
              width={1039}
            />
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3">
            <ParentNav viewerEmail={viewer.user?.email ?? null} />
            <Link
              aria-label="Open child mode child picker"
              className="relative z-30 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(18,39,96,0.08)] bg-white text-[rgba(60,60,60,0.94)] shadow-[0_16px_32px_rgba(20,36,82,0.14)] transition-transform duration-150 hover:scale-[1.02]"
              href="/parent/child-mode"
              style={{
                WebkitTapHighlightColor: "transparent",
                WebkitTouchCallout: "none",
                touchAction: "manipulation",
              }}
            >
              <AccountIcon />
            </Link>
          </div>
        </div>

        <div className="relative mt-4 flex justify-center text-center">
          <p className="text-sm font-bold text-[color:var(--ink-soft)] sm:text-base">
            {viewer.familyName
              ? `Welcome back ${viewer.familyName}`
              : "Welcome back"}
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}
