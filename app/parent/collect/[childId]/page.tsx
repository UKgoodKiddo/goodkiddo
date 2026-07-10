import { redirect } from "next/navigation";
import { ParentCollectBoopsClient } from "@/components/parent-collect-boops-client";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";

export default async function ParentCollectChildBoopsPage(props: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ childId }, searchParams, dashboard] = await Promise.all([
    props.params,
    props.searchParams,
    getParentDashboardData(),
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  if (dashboard.family && subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  const child = dashboard.children.find((entry) => entry.id === childId);

  if (!dashboard.family || !child) {
    redirect("/parent");
  }

  const prefilledBooperUid =
    typeof searchParams.booperUid === "string"
      ? searchParams.booperUid.trim()
      : "";

  const pendingBoops = dashboard.pendingBoopAwards
    .filter((award) => award.child_profile_id === child.id)
    .reduce((runningTotal, award) => runningTotal + award.amount, 0);

  return (
    <main className="flex flex-1 flex-col">
      <ShellCard className="rounded-[2.2rem] bg-white p-6 sm:p-8">
        <ParentCollectBoopsClient
          childId={child.id}
          childName={child.display_name}
          initialPendingBoops={pendingBoops}
          prefilledBooperUid={prefilledBooperUid}
        />
      </ShellCard>
    </main>
  );
}
