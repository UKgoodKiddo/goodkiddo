import { ChildPageScaffold } from "@/components/child-page-scaffold";
import {
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
        <ChildSummaryCard childMode={childMode} imageDebugMode={imageDebugMode} />
        <ChildSectionLaunchButtons />
      </section>
    </ChildPageScaffold>
  );
}
