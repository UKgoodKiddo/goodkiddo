import { RootSplashScreen } from "@/components/root-splash-screen";
import { getParentViewer } from "@/lib/auth";

export default async function Home() {
  const viewer = await getParentViewer();

  return (
    <RootSplashScreen redirectTo={viewer.user ? "/parent?unlock=1" : "/auth/login"} />
  );
}
