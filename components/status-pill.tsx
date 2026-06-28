import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "mint",
}: {
  children: React.ReactNode;
  tone?: "mint" | "rose" | "sun" | "sky";
}) {
  const toneClasses = {
    mint: "bg-emerald-100 text-emerald-950",
    rose: "bg-rose-100 text-rose-950",
    sun: "bg-amber-100 text-amber-950",
    sky: "bg-cyan-100 text-cyan-950",
  };

  return <span className={cn("pill", toneClasses[tone])}>{children}</span>;
}
