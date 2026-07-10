import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

function ResetPasswordFallback() {
  return (
    <div className="rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-950">
      Checking your reset link...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      description="Use the reset link from your email, then choose a new parent password."
      title="Choose a new password"
    >
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
