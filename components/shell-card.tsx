import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ShellCard({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
}) {
  return (
    <section className={cn("shell-card", className)} {...props}>
      {children}
    </section>
  );
}
