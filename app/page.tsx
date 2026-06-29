import { RootSplashScreen } from "@/components/root-splash-screen";
import { getParentViewer } from "@/lib/auth";
import { readChildModeSelection } from "@/lib/child-mode";

export default async function Home() {
  const [viewer, childModeSelection] = await Promise.all([
    getParentViewer(),
    readChildModeSelection(),
  ]);

  const redirectTo = viewer.user
    ? childModeSelection
      ? "/child"
      : "/parent"
    : "/auth/login";

  return <RootSplashScreen redirectTo={redirectTo} />;
}
