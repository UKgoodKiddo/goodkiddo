type ParentStatusBanner = {
  message: string;
  tone: "mint" | "rose" | "sky" | "sun";
};

export function getParentStatusBanner(
  code?: string,
): ParentStatusBanner | null {
  switch (code) {
    case "subscription-cancel-pending":
      return {
        message: "Your Family+ subscription will now end at the close of the current billing period.",
        tone: "sun",
      };
    case "subscription-cancel-removed":
      return {
        message: "Your Family+ subscription will keep renewing as normal again.",
        tone: "mint",
      };
    case "subscription-manage-failed":
      return {
        message: "We could not update that subscription setting just now. Please try again.",
        tone: "rose",
      };
    case "billing-portal-unavailable":
      return {
        message: "Stripe billing details are not available for this family yet.",
        tone: "rose",
      };
    default:
      return null;
  }
}
