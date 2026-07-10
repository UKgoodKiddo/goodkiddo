import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getParentViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function ForgotPasswordPage() {
  const viewer = await getParentViewer();

  if (viewer.user) {
    redirect("/parent");
  }

  const supabaseReady = isSupabaseConfigured();

  return (
    <AuthPageShell
      description="Enter your parent email and we’ll send a reset link."
      title="Reset password"
    >
      {!supabaseReady ? (
        <div className="rounded-[1.4rem] border border-[color:var(--berry)]/25 bg-[color:var(--berry)]/8 p-4 text-sm leading-6 text-[color:var(--foreground)]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
          to unlock live auth.
        </div>
      ) : null}

      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
