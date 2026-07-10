import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";
import { getParentViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const viewer = await getParentViewer();

  if (viewer.user) {
    redirect("/parent");
  }

  const supabaseReady = isSupabaseConfigured();
  const returnTo =
    typeof searchParams.returnTo === "string" ? searchParams.returnTo : "";
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "";
  const authBanner =
    status === "password-reset"
      ? {
          message: "Password updated. Sign in with your new password.",
          tone:
            "mint" as const,
        }
      : null;

  return (
    <AuthPageShell
      description="Sign in with the parent account that owns your family."
      title="Welcome back"
    >
      {!supabaseReady ? (
        <div className="rounded-[1.4rem] border border-[color:var(--berry)]/25 bg-[color:var(--berry)]/8 p-4 text-sm leading-6 text-[color:var(--foreground)]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
          to unlock live auth.
        </div>
      ) : null}

      {authBanner ? (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
          {authBanner.message}
        </div>
      ) : null}

      <LoginForm />
      <p className="mt-4 text-center text-sm text-[color:var(--ink-soft)]">
        Need the first parent account?{" "}
        <Link
          className="font-bold text-[color:var(--secondary)]"
          href={returnTo ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}` : "/auth/signup"}
        >
          Create one
        </Link>
      </p>
    </AuthPageShell>
  );
}
