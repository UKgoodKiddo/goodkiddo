import { redirect } from "next/navigation";
import { ParentWorryBoxExperience } from "@/components/parent-worry-box-experience";
import { getParentViewer } from "@/lib/auth";
import { getParentDashboardData } from "@/lib/data";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";

export default async function ParentWorryBoxPage() {
  const [viewer, dashboard] = await Promise.all([
    getParentViewer(),
    getParentDashboardData(),
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  if (dashboard.family && subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  return <ParentWorryBoxExperience parentStorageId={viewer.user?.id ?? null} />;
}
