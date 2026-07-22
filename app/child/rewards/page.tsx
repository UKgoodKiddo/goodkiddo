import { ChildRewardsScene } from "@/components/child-rewards-scene";
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

  return <ChildRewardsScene bannerCode={bannerCode} childMode={childMode} />;
}
