import { ChildDailyCheckIn } from "@/components/child-daily-check-in";
import { ChildLayoutShell } from "@/components/child-layout-shell";
import { ChildModeSplashOverlay } from "@/components/child-mode-splash-overlay";
import { ChildSelectionGuard } from "@/components/child-selection-guard";
import { PortraitOrientationGuard } from "@/components/portrait-orientation-guard";
import { getChildModeData } from "@/lib/data";

export default async function ChildLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const childMode = await getChildModeData();

  return (
    <PortraitOrientationGuard>
      <ChildLayoutShell childMode={childMode}>
        <ChildSelectionGuard
          childProfileId={childMode.child?.id ?? null}
          familyId={childMode.child?.family_id ?? null}
        >
          <ChildModeSplashOverlay childProfileId={childMode.child?.id ?? null} />
          {childMode.child ? <ChildDailyCheckIn /> : null}
          {children}
        </ChildSelectionGuard>
      </ChildLayoutShell>
    </PortraitOrientationGuard>
  );
}
