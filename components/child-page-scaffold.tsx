import Link from "next/link";
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
  const banner = resolveChildBanner(bannerCode);

  return (
    <main className="flex w-full flex-1 flex-col gap-5 text-white">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      {childMode.usingDemoMode ? (
        <Banner
          message="Showing child preview data because live child mode is not fully configured yet."
          tone="sky"
        />
      ) : null}

      {!childMode.assigned ? (
        <section className="child-panel rounded-[1.8rem] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
            Needs setup
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">No child session is active yet.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
            {childMode.setupMessage ??
              "Choose a child profile in Parent Hub before opening child mode on this device."}
          </p>
          <Link className="btn btn-secondary mt-5" href="/parent/child-mode">
            Back to child picker
          </Link>
        </section>
      ) : (
        children
      )}
    </main>
  );
}
