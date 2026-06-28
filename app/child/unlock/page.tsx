import { unlockChildModeWithRedirectAction } from "@/app/actions";
import { ChildUnlockForm } from "@/components/child-unlock-form";

function getUnlockErrorMessage(status?: string) {
  switch (status) {
    case "invalid-pin-format":
      return "Enter the 4-digit parent PIN to unlock admin mode.";
    case "invalid-pin":
      return "That PIN did not unlock parent mode.";
    case "family-required":
      return "Create a family before using child mode unlock.";
    case "pin-setup-required":
      return "Run the latest family PIN migration before child unlock can work.";
    case "missing-supabase":
      return "Supabase is not configured.";
    default:
      return undefined;
  }
}

export default async function ChildUnlockPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  return (
    <section className="py-3">
      <ChildUnlockForm
        action={unlockChildModeWithRedirectAction}
        errorMessage={getUnlockErrorMessage(status)}
      />
    </section>
  );
}
