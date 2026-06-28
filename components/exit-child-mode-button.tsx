"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ExitChildModeButton() {
  const pathname = usePathname();

  if (pathname === "/child/unlock") {
    return null;
  }

  return (
    <Link
      className="btn btn-ghost border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/16"
      href="/child/unlock"
    >
      Exit child mode
    </Link>
  );
}
