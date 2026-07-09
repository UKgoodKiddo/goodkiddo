import { ChildPageScaffold } from "@/components/child-page-scaffold";
import {
  ChildActivityCard,
  ChildRewardQueueCard,
  ChildSectionLaunchButtons,
  ChildSummaryCard,
} from "@/components/child-sections";
import type { KiddoImageDebugMode } from "@/components/kiddo-route-image";
import { getChildModeData } from "@/lib/data";

export default async function ChildPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [childMode, searchParams] = await Promise.all([
    getChildModeData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const imageDebugMode =
    searchParams.imageDebug === "placeholders" || searchParams.imageDebug === "log"
      ? (searchParams.imageDebug as KiddoImageDebugMode)
      : "off";

  return (
    <ChildPageScaffold bannerCode={bannerCode} childMode={childMode}>
      <section className="space-y-5">
        <section className="w-full space-y-5">
          <ChildSummaryCard childMode={childMode} imageDebugMode={imageDebugMode} />
          <ChildSectionLaunchButtons />
        </section>

        <section className="grid w-full gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <details className="child-home-collapsible" open={false}>
            <summary className="child-home-collapsible-summary">
              <div>
                <p className="text-2xl font-black">Recent Activity</p>
                <p className="mt-1 text-sm text-white/70">
                  See your latest earned and spent boops.
                </p>
              </div>
              <div className="child-home-collapsible-meta">
                <span aria-hidden="true" className="child-home-collapsible-chevron">
                  v
                </span>
              </div>
            </summary>
            <div className="mt-4">
              <ChildActivityCard
                childMode={childMode}
                imageDebugMode={imageDebugMode}
                showHeader={false}
              />
            </div>
          </details>
          <details className="child-home-collapsible" open={false}>
            <summary className="child-home-collapsible-summary">
              <div>
                <p className="text-2xl font-black">Reward Queue</p>
                <p className="mt-1 text-sm text-white/70">
                  See which rewards are pending, approved, or completed.
                </p>
              </div>
              <div className="child-home-collapsible-meta">
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white/90">
                  {childMode.redemptions.length}
                </div>
                <span aria-hidden="true" className="child-home-collapsible-chevron">
                  v
                </span>
              </div>
            </summary>
            <div className="mt-4">
              <ChildRewardQueueCard
                childMode={childMode}
                imageDebugMode={imageDebugMode}
                showHeader={false}
              />
            </div>
          </details>
        </section>
      </section>
    </ChildPageScaffold>
  );
}
