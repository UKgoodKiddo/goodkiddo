import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ShellCard } from "@/components/shell-card";
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-10 sm:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ShellCard className="hero-burst rounded-[2rem] p-8">
          <p className="eyebrow">Parent access</p>
          <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight">
            Supabase auth for parents, profile-only access for kids.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--ink-soft)]">
            Sign in with email and password to manage the family account,
            create children, award boops, and launch a device into child mode.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/70 bg-white/75 p-5">
            <p className="text-sm font-bold text-[color:var(--secondary)]">
              Framework note
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              If Supabase isn&apos;t configured yet, the login form stays visible
              but will explain what is missing instead of silently failing.
            </p>
          </div>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Parent sign in</p>
            <h2 className="text-3xl font-extrabold">Welcome back</h2>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Use the parent account that owns the family record.
            </p>
          </div>

          {!supabaseReady ? (
            <div className="mt-6 rounded-[1.4rem] border border-[color:var(--berry)]/25 bg-[color:var(--berry)]/8 p-4 text-sm leading-6 text-[color:var(--foreground)]">
              Add `NEXT_PUBLIC_SUPABASE_URL` and
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` to unlock live auth.
            </div>
          ) : null}

          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-sm text-[color:var(--ink-soft)]">
            Need the first parent account?{" "}
            <Link
              className="font-bold text-[color:var(--secondary)]"
              href={returnTo ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}` : "/auth/signup"}
            >
              Create one
            </Link>
          </p>
        </ShellCard>
      </div>
    </main>
  );
}
