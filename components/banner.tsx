import { cn } from "@/lib/utils";

export function Banner({
  message,
  tone = "sky",
}: {
  message: string;
  tone?: "mint" | "rose" | "sky" | "sun";
}) {
  const toneClasses = {
    mint: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
    sky: "border-cyan-200 bg-cyan-50 text-cyan-950",
    sun: "border-amber-200 bg-amber-50 text-amber-950",
  };

  return (
    <div
      className={cn(
        "rounded-[1.4rem] border px-4 py-3 text-sm font-semibold shadow-[0_10px_30px_rgba(29,36,51,0.06)]",
        toneClasses[tone],
      )}
    >
      {message}
    </div>
  );
}
