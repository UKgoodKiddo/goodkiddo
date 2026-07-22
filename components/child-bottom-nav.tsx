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
};

const navItems: ChildNavItem[] = [
  {
    href: "/child",
    icon: GOODKIDDO_ASSETS.starIcon,
    label: "Home",
  },
  {
    href: "/child/tasks",
    icon: GOODKIDDO_ASSETS.childTasksButton,
    label: "Tasks",
  },
  {
    href: "/child/rewards",
    icon: GOODKIDDO_ASSETS.childRewardsButton,
    label: "Rewards",
  },
  {
    href: "/child/profile",
    icon: GOODKIDDO_ASSETS.childChangingRoomButton,
    label: "Changing Room",
  },
];

export function ChildBottomNav({
  pendingBoopTotal: _pendingBoopTotal,
}: {
  pendingBoopTotal: number;
}) {
  const pathname = usePathname();
  void _pendingBoopTotal;

  if (pathname === "/child/unlock") {
    return null;
  }

  return (
    <nav
      aria-label="Child navigation"
      className={cn(
        "rounded-[1.8rem] bg-white p-3 text-[color:var(--foreground)] shadow-[0_18px_35px_rgba(7,26,85,0.18)]",
        pathname === "/child"
          ? "child-bottom-nav child-bottom-nav--home"
          : "mt-6",
      )}
    >
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            className={cn(
              "flex min-h-[4.75rem] flex-col items-center justify-center rounded-[1.2rem] px-2 py-3 text-center text-[0.74rem] font-black transition-colors",
              pathname === item.href
                ? "bg-[#eaf1ff] text-[color:var(--primary)]"
                : "bg-transparent text-[color:var(--ink-soft)]",
            )}
            href={item.href}
          >
            <div className="flex items-center justify-center">
              <Image
                alt=""
                className={item.href === "/child" ? "h-7 w-7" : "h-8 w-8"}
                height={item.href === "/child" ? 28 : 32}
                src={item.icon}
                unoptimized
                width={item.href === "/child" ? 28 : 32}
              />
            </div>
            <span className="mt-2 leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
