import { ChildProfileScene } from "@/components/child-profile-scene";
import { getChildModeData } from "@/lib/data";

export default async function ChildProfilePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [childMode, searchParams] = await Promise.all([
    getChildModeData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  return <ChildProfileScene bannerCode={bannerCode} childMode={childMode} />;
}
