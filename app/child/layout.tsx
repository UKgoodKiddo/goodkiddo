import { ChildDailyCheckIn } from "@/components/child-daily-check-in";
import { ChildBottomNav } from "@/components/child-bottom-nav";
import { ChildModePersistence } from "@/components/child-mode-persistence";
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
        <ChildSelectionGuard childProfileId={childMode.child?.id ?? null}>
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                Child mode
              </p>
              <h1 className="mt-1 truncate text-3xl font-black">goodKiddo</h1>
              <p className="mt-1 text-sm font-bold text-white/72">
                Earn boops, finish tasks, and save up for rewards.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/85">
                No ads. No chat.
              </div>
              <ExitChildModeButton />
            </div>
          </header>

          {childMode.child ? (
            <>
              <ChildModePersistence
                childProfileId={childMode.child.id}
                familyId={childMode.child.family_id}
              />
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
