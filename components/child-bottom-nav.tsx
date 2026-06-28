"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { cn } from "@/lib/utils";

type ChildNavItem = {
  href: string;
  icon: string;
  label: string;
  isPrimary?: boolean;
};

const navItems: ChildNavItem[] = [
  {
    href: "/child",
    icon: GOODKIDDO_ASSETS.starIcon,
    label: "Home",
  },
  {
    href: "/child/rewards",
    icon: GOODKIDDO_ASSETS.rewardIcon,
    label: "Rewards",
  },
  {
    href: "/child/collect",
    icon: GOODKIDDO_ASSETS.plainBoopLogo,
    label: "Collect",
    isPrimary: true,
  },
  {
    href: "/child/activity",
    icon: GOODKIDDO_ASSETS.activityIcon,
    label: "Activity",
  },
  {
    href: "/child/profile",
    icon: GOODKIDDO_ASSETS.profileIcon,
    label: "Profile",
  },
];

export function ChildBottomNav({
  pendingBoopTotal,
}: {
  pendingBoopTotal: number;
}) {
  const pathname = usePathname();

  if (pathname === "/child/unlock") {
    return null;
  }

  return (
    <nav
      aria-label="Child navigation"
      className="mt-6 rounded-[1.8rem] bg-white p-3 text-[color:var(--foreground)] shadow-[0_18px_35px_rgba(7,26,85,0.18)]"
    >
      <div className="grid grid-cols-5 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            className={cn(
              "flex min-h-[4.75rem] flex-col items-center justify-center rounded-[1.2rem] px-2 py-3 text-center text-[0.78rem] font-black transition-colors",
              item.isPrimary
                ? pathname === item.href
                  ? "bg-[linear-gradient(180deg,#1456d8,#0b3db5)] text-white"
                  : "bg-[linear-gradient(180deg,#2a6dff,#1456d8)] text-white"
                : pathname === item.href
                  ? "bg-[#eaf1ff] text-[color:var(--primary)]"
                  : "bg-transparent text-[color:var(--ink-soft)]",
            )}
            href={item.href}
          >
            <div className="relative flex items-center justify-center">
              <Image
                alt=""
                className={item.isPrimary ? "h-[2.15rem] w-[2.15rem]" : "h-7 w-7"}
                height={item.isPrimary ? 34 : 28}
                src={item.icon}
                unoptimized
                width={item.isPrimary ? 34 : 28}
              />
              {item.isPrimary ? (
                <span className="absolute -right-3 -top-3 rounded-full bg-white/18 px-2 py-1 text-[0.72rem] font-black text-white">
                  {pendingBoopTotal}
                </span>
              ) : null}
            </div>
            <span className="mt-2">{item.isPrimary ? "Collect Boops" : item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
