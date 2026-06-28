import { ChildPageScaffold } from "@/components/child-page-scaffold";
import { ChildCollectCard, ChildSummaryCard } from "@/components/child-sections";
import { getChildModeData } from "@/lib/data";

export default async function ChildCollectPage(props: {
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
      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ChildSummaryCard childMode={childMode} />
        <ChildCollectCard childMode={childMode} returnTo="/child/collect" />
      </section>
    </ChildPageScaffold>
  );
}
