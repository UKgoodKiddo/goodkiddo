import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { ShellCard } from "@/components/shell-card";
import { getParentViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SignupPage() {
  const viewer = await getParentViewer();

  if (viewer.user) {
    redirect("/parent");
  }

  const supabaseReady = isSupabaseConfigured();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-10 sm:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ShellCard className="hero-burst rounded-[2rem] p-8">
          <p className="eyebrow">Create parent account</p>
          <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight">
            Start the first family account for goodKiddo.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--ink-soft)]">
            This creates the parent login through Supabase Auth. After that,
            you can sign in, create a family, add child profiles, and start
            launching child mode.
          </p>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Parent sign up</p>
            <h2 className="text-3xl font-extrabold">Create account</h2>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Use a parent/admin email. Children do not get login accounts.
            </p>
          </div>

          {!supabaseReady ? (
            <div className="mt-6 rounded-[1.4rem] border border-[color:var(--berry)]/25 bg-[color:var(--berry)]/8 p-4 text-sm leading-6 text-[color:var(--foreground)]">
              Add `NEXT_PUBLIC_SUPABASE_URL` and
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` to unlock live auth.
            </div>
          ) : null}

          <div className="mt-6">
            <SignupForm />
          </div>
        </ShellCard>
      </div>
    </main>
  );
}
