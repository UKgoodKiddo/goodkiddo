import { ChildPageScaffold } from "@/components/child-page-scaffold";
import { CreativeCoveShell } from "@/components/creative-cove-shell";
import { ChildSummaryCard } from "@/components/child-sections";
import { getChildModeData } from "@/lib/data";

export default async function CreativeCovePage(props: {
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
        <CreativeCoveShell />
      </section>
    </ChildPageScaffold>
  );
}
