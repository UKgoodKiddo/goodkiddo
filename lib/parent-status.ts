export function getParentStatusBanner(code?: string) {
  switch (code) {
    case "family-created":
      return { tone: "mint" as const, message: "Family created." };
    case "child-created":
      return { tone: "mint" as const, message: "Child profile created." };
    case "child-created-booper-assigned":
      return {
        tone: "mint" as const,
        message: "Child profile created and a Booper was assigned.",
      };
    case "child-created-booper-failed":
      return {
        tone: "rose" as const,
        message:
          "Child profile created, but the Booper could not be assigned. Check that the UID was imported and still available.",
      };
    case "child-updated":
      return { tone: "mint" as const, message: "Child profile updated." };
    case "child-deleted":
      return { tone: "mint" as const, message: "Child profile deleted." };
    case "child-delete-confirm-required":
      return {
        tone: "rose" as const,
        message: "Type the child's exact name before deleting that profile.",
      };
    case "child-delete-name-mismatch":
      return {
        tone: "rose" as const,
        message: "The typed name did not match, so the child profile was not deleted.",
      };
    case "reward-created":
      return { tone: "mint" as const, message: "Reward created." };
    case "reward-updated":
      return { tone: "mint" as const, message: "Reward updated." };
    case "task-created":
      return { tone: "mint" as const, message: "Task created." };
    case "task-updated":
      return { tone: "mint" as const, message: "Task updated." };
    case "task-deleted":
      return { tone: "mint" as const, message: "Task deleted." };
    case "task-approved":
      return {
        tone: "mint" as const,
        message: "Task completion approved. The boops are now waiting for the child to collect.",
      };
    case "task-rejected":
      return { tone: "mint" as const, message: "Task completion rejected." };
    case "booper-paired":
      return { tone: "mint" as const, message: "Booper paired to a child." };
    case "booper-assigned":
      return {
        tone: "mint" as const,
        message: "New Booper assigned to the selected child.",
      };
    case "booper-status-updated":
      return { tone: "mint" as const, message: "Booper status updated." };
    case "booper-origin-required":
      return {
        tone: "rose" as const,
        message:
          "Only Boopers imported into super admin inventory can be used here.",
      };
    case "booper-conflict":
      return {
        tone: "rose" as const,
        message:
          "That Booper is not currently in an assigned state for this family.",
      };
    case "booper-not-imported":
      return {
        tone: "rose" as const,
        message:
          "That UID is not in Booper inventory yet. Ask super admin to import it first.",
      };
    case "booper-not-available":
      return {
        tone: "rose" as const,
        message:
          "That Booper exists, but it is not currently available for assignment.",
      };
    case "boops-awarded":
      return {
        tone: "mint" as const,
        message: "Boops sent to the child's waiting-to-collect stack.",
      };
    case "boops-collected-parent":
      return {
        tone: "mint" as const,
        message: "Waiting boops collected successfully on this parent device.",
      };
    case "booper-tap-ready":
      return {
        tone: "sky" as const,
        message:
          "Booper link opened. The wristband UID has been prefilled below for parent collection or assignment.",
      };
    case "pin-updated":
      return {
        tone: "mint" as const,
        message: "Parent PIN updated.",
      };
    case "child-mode-required":
      return {
        tone: "sun" as const,
        message: "Choose a child profile before opening child mode on this device.",
      };
    case "child-mode-exited":
      return {
        tone: "mint" as const,
        message: "Child mode exited for this device.",
      };
    case "redemption-approved":
      return {
        tone: "mint" as const,
        message: "Reward redemption approved and boops deducted.",
      };
    case "redemption-rejected":
      return {
        tone: "mint" as const,
        message: "Reward redemption rejected.",
      };
    case "nfc-boop-awarded":
      return {
        tone: "mint" as const,
        message: "Manual NFC test award sent to the child's waiting stack.",
      };
    case "missing-supabase":
      return {
        tone: "rose" as const,
        message: "Supabase environment variables are still missing.",
      };
    case "family-required":
      return {
        tone: "rose" as const,
        message: "Create a family before adding children or managing data.",
      };
    case "nfc-award-failed":
      return {
        tone: "rose" as const,
        message:
          "That UID is not an assigned imported Booper paired to a child yet, so no boop was awarded.",
      };
    case "wrong-booper":
      return {
        tone: "rose" as const,
        message:
          "That Booper does not belong to the selected child, or it is lost, disabled, or no longer assigned.",
      };
    case "no-boops-waiting":
      return {
        tone: "sun" as const,
        message: "That child has no waiting boops to collect right now.",
      };
    case "action-failed":
      return {
        tone: "rose" as const,
        message: "The last action could not be completed. Check the form and try again.",
      };
    case "avatar-upload-failed":
      return {
        tone: "rose" as const,
        message:
          "Avatar upload failed. Use an image under 5MB and try again.",
      };
    case "pin-invalid":
      return {
        tone: "rose" as const,
        message: "Use matching 4-digit PIN values to save the parent unlock code.",
      };
    case "pin-setup-required":
      return {
        tone: "rose" as const,
        message:
          "The parent PIN column is not in Supabase yet. Run the latest families migration, then try again.",
      };
    default:
      return null;
  }
}
