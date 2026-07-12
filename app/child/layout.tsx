import { ChildDailyCheckIn } from "@/components/child-daily-check-in";
import { ChildBottomNav } from "@/components/child-bottom-nav";
import { ChildModeSplashOverlay } from "@/components/child-mode-splash-overlay";
import { ChildSelectionGuard } from "@/components/child-selection-guard";
import { ExitChildModeButton } from "@/components/exit-child-mode-button";
import { getChildModeData } from "@/lib/data";

export default async function ChildLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const childMode = await getChildModeData();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-2 py-4 sm:px-6">
      <div className="child-app-shell rounded-[2rem] px-3 py-4 text-white shadow-[0_24px_50px_rgba(6,23,80,0.24)] sm:px-5 sm:py-5">
        <ChildSelectionGuard
          childProfileId={childMode.child?.id ?? null}
          familyId={childMode.child?.family_id ?? null}
        >
          <ChildModeSplashOverlay childProfileId={childMode.child?.id ?? null} />
          <header className="mb-3 flex justify-end">
            <div className="flex items-center justify-end">
              <ExitChildModeButton />
            </div>
          </header>

          {childMode.child ? (
            <>
              <ChildDailyCheckIn />
            </>
          ) : null}
          {children}
          {childMode.child ? (
            <ChildBottomNav pendingBoopTotal={childMode.pendingBoopTotal} />
          ) : null}
        </ChildSelectionGuard>
      </div>
    </div>
  );
}
