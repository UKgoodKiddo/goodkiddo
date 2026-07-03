"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/superadmin", label: "Overview" },
  { href: "/superadmin/boopers", label: "Boopers" },
  { href: "/superadmin/tasks", label: "Task assets" },
  { href: "/superadmin/hardware", label: "Hardware" },
  { href: "/superadmin/families", label: "Families" },
  { href: "/superadmin/users", label: "Users" },
  { href: "/superadmin/audit", label: "Audit" },
];

export function SuperAdminNav() {
  const currentPath = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const active = currentPath === item.href;

        return (
          <Link
            key={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
              active
                ? "bg-[linear-gradient(180deg,#ff7a45,#ff5a30)] text-white shadow-[0_10px_30px_rgba(255,90,48,0.24)]"
                : "bg-white text-[color:var(--ink-soft)] hover:bg-[#fdf6f0]",
            )}
            href={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
