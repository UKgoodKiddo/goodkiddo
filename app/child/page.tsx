import { ChildPageScaffold } from "@/components/child-page-scaffold";
import {
  ChildActivityCard,
  ChildRewardQueueCard,
  ChildRewardsCard,
  ChildSummaryCard,
  ChildTasksCard,
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
      <section className="grid w-full gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="w-full space-y-5">
          <ChildSummaryCard childMode={childMode} imageDebugMode={imageDebugMode} />
          <ChildTasksCard childMode={childMode} imageDebugMode={imageDebugMode} />
        </section>

        <section className="w-full space-y-5">
          <ChildRewardsCard
            childMode={childMode}
            imageDebugMode={imageDebugMode}
            returnTo="/child"
          />
          <ChildActivityCard childMode={childMode} imageDebugMode={imageDebugMode} />
          <ChildRewardQueueCard childMode={childMode} imageDebugMode={imageDebugMode} />
        </section>
      </section>
    </ChildPageScaffold>
  );
}
