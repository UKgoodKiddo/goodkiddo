import { ChildPageScaffold } from "@/components/child-page-scaffold";
import {
  ChildRewardQueueCard,
  ChildRewardsCard,
  ChildSummaryCard,
} from "@/components/child-sections";
import { getChildModeData } from "@/lib/data";

export default async function ChildRewardsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [childMode, searchParams] = await Promise.all([
    getChildModeData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  return (
    <ChildPageScaffold bannerCode={bannerCode} childMode={childMode}>
      <section className="space-y-5">
        <ChildSummaryCard childMode={childMode} />
        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <ChildRewardsCard childMode={childMode} returnTo="/child/rewards" />
          <ChildRewardQueueCard childMode={childMode} />
        </section>
      </section>
    </ChildPageScaffold>
  );
}
