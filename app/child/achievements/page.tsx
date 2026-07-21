import { ChildAchievementsBoard } from "@/components/child-achievements-board";
import { getChildAchievementsPageData } from "@/lib/child-achievements";

type AchievementsPageProps = {
  searchParams: Promise<{
    preview?: string | string[];
  }>;
};

export default async function ChildAchievementsPage({
  searchParams,
}: AchievementsPageProps) {
  const resolvedSearchParams = await searchParams;
  const preview =
    typeof resolvedSearchParams.preview === "string"
      ? resolvedSearchParams.preview
      : undefined;
  const pageData = await getChildAchievementsPageData({ preview });

  if (!pageData.child) {
    return (
      <main className="flex w-full flex-1 flex-col gap-5 text-white">
        <section className="child-panel rounded-[1.8rem] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
            Achievements
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Achievement board is getting ready</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
            {pageData.setupMessage ?? "Choose a child profile to open the achievement board."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <ChildAchievementsBoard
      childName={pageData.child.display_name}
      unlockedAchievementIds={pageData.unlockedAchievementIds}
      unlockedAtById={pageData.unlockedAtById}
      unlockedStandardBadgeCount={pageData.unlockedStandardBadgeCount}
    />
  );
}
