import { Banner } from "@/components/banner";
import type { ChildModeData } from "@/lib/types";
import { resolveChildBanner } from "@/lib/child-ui";

export function ChildPageScaffold({
  bannerCode,
  childMode,
  children,
}: {
  bannerCode?: string;
  childMode: ChildModeData;
  children: React.ReactNode;
}) {
  const banner = bannerCode === "child-mode-ready" ? null : resolveChildBanner(bannerCode);

  return (
    <main className="flex w-full flex-1 flex-col gap-5 text-white">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      {childMode.usingDemoMode ? (
        <Banner
          message="Showing child preview data because live child mode is not fully configured yet."
          tone="sky"
        />
      ) : null}
      {children}
    </main>
  );
}
