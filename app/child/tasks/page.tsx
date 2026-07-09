import { ChildPageScaffold } from "@/components/child-page-scaffold";
import { ChildSummaryCard, ChildTasksCard } from "@/components/child-sections";
import { getChildModeData } from "@/lib/data";

export default async function ChildTasksPage(props: {
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
        <ChildTasksCard childMode={childMode} />
      </section>
    </ChildPageScaffold>
  );
}
