import { ChildHomeScene } from "@/components/child-home-scene";
import type { KiddoImageDebugMode } from "@/components/kiddo-route-image";
import { PullToRefreshShell } from "@/components/pull-to-refresh-shell";
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
    <PullToRefreshShell variant="child">
      <ChildHomeScene
        bannerCode={bannerCode}
        childMode={childMode}
        imageDebugMode={imageDebugMode}
      />
    </PullToRefreshShell>
  );
}
