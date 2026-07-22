import { ChildTasksScene } from "@/components/child-tasks-scene";
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

  return <ChildTasksScene bannerCode={bannerCode} childMode={childMode} />;
}
