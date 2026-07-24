import { ParentLayoutFrame } from "@/components/parent-layout-frame";
import { ParentAtmosphere } from "@/components/parent-theme/parent-atmosphere";
import { PullToRefreshShell } from "@/components/pull-to-refresh-shell";
import { getParentViewer } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getParentViewer();

  return (
    <PullToRefreshShell
      className="parent-atmosphere-shell"
      variant="parent"
    >
      <ParentAtmosphere />
      <ParentLayoutFrame
        familyName={viewer.familyName}
        viewerEmail={viewer.user?.email ?? null}
      >
        {children}
      </ParentLayoutFrame>
    </PullToRefreshShell>
  );
}
