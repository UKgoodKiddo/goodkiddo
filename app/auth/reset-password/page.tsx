import { AuthPageShell } from "@/components/auth-page-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      description="Use the reset link from your email, then choose a new parent password."
      title="Choose a new password"
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
