import { redirect } from "next/navigation";
import { syncStripeCheckoutSession } from "@/lib/stripe";

export default async function ParentPlanSuccessPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const sessionId =
    typeof searchParams.session_id === "string" ? searchParams.session_id : null;

  if (sessionId) {
    try {
      await syncStripeCheckoutSession(sessionId);
    } catch {
      redirect("/parent/plan?status=checkout-processing");
    }
  }

  redirect("/parent");
}
