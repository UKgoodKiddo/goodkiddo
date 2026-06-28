import Link from "next/link";
import { InstallCard } from "@/components/install-card";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";

export default function Home() {
  const supabaseReady = isSupabaseConfigured();
  const childModeReady = isChildModeConfigured();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <section className="hero-burst shell-card overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone="sun">NFC-first family rewards</StatusPill>
              <StatusPill tone={supabaseReady ? "mint" : "rose"}>
                {supabaseReady ? "Supabase ready" : "Demo mode until env is set"}
              </StatusPill>
            </div>
            <div className="space-y-4">
              <p className="eyebrow">goodKiddo framework</p>
              <h1 className="max-w-3xl font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Parents award boops. Kids tap in with Boopers and see their wins.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--ink-soft)]">
                This starter wires together a tenant-style family model,
                Supabase parent auth, a child-mode session pattern, and the
                first dashboard shells for both sides of the app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="btn btn-primary" href="/auth/login">
                Parent sign in
              </Link>
              <Link className="btn btn-ghost" href="/parent">
                Open parent dashboard
              </Link>
              <Link className="btn btn-secondary" href="/child">
                Open child mode
              </Link>
            </div>
          </div>

          <ShellCard className="rounded-[1.6rem] p-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Framework status</p>
                  <h2 className="mt-2 text-2xl font-extrabold">Base rails are in place</h2>
                </div>
                <div className="rounded-full bg-[color:var(--sun)] px-4 py-2 text-sm font-extrabold text-[color:var(--foreground)]">
                  Phase 1
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="metric-tile rounded-[1.4rem] p-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                    Auth model
                  </p>
                  <p className="mt-2 text-2xl font-extrabold">Parent only</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Children stay as profiles under a family account.
                  </p>
                </div>
                <div className="metric-tile rounded-[1.4rem] p-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                    Tenant key
                  </p>
                  <p className="mt-2 text-2xl font-extrabold">Family scoped</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Every core table carries the family boundary.
                  </p>
                </div>
                <div className="metric-tile rounded-[1.4rem] p-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                    Child mode
                  </p>
                  <p className="mt-2 text-2xl font-extrabold">
                    {childModeReady ? "Secure cookie session" : "Needs service role + secret"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Designed for no child accounts and device-bound sessions.
                  </p>
                </div>
                <div className="metric-tile rounded-[1.4rem] p-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                    PWA shell
                  </p>
                  <p className="mt-2 text-2xl font-extrabold">Installable</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Manifest, generated icons, and a starter service worker are included.
                  </p>
                </div>
              </div>
            </div>
          </ShellCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Product roles</p>
          <h2 className="mt-3 text-3xl font-extrabold">Two clear experiences</h2>
          <div className="mt-6 grid gap-4">
            <div className="list-row rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold">Parent/Admin</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Email/password auth through Supabase. Manages families,
                    child profiles, Boopers, rewards, and boop awards.
                  </p>
                </div>
                <StatusPill tone="mint">Authenticated</StatusPill>
              </div>
            </div>
            <div className="list-row rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold">Child Mode</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    No login account. Device session is launched by a parent
                    and loads a simplified balance and rewards view.
                  </p>
                </div>
                <StatusPill tone="sky">Profile-based</StatusPill>
              </div>
            </div>
          </div>
        </ShellCard>

        <InstallCard />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ShellCard className="rounded-[1.8rem] p-6 xl:col-span-2">
          <p className="eyebrow">Database foundation</p>
          <h2 className="mt-3 text-3xl font-extrabold">
            The first migration covers the full family model
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "families",
              "child_profiles",
              "boopers",
              "boop_transactions",
              "rewards",
              "redemptions",
              "device_child_mode",
            ].map((tableName) => (
              <div
                key={tableName}
                className="list-row rounded-[1.2rem] px-4 py-3 font-[family-name:var(--font-space-grotesk)] text-sm font-bold"
              >
                {tableName}
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Next steps</p>
          <h2 className="mt-3 text-2xl font-extrabold">Ready for the next layer</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            <li>Set the Supabase environment variables from `.env.example`.</li>
            <li>Run the SQL migration in `supabase/migrations`.</li>
            <li>Create a parent user in Supabase Auth.</li>
            <li>Sign in and create a family plus child profiles from `/parent`.</li>
            <li>Use the child-mode launcher to bind the browser into kid view.</li>
          </ul>
        </ShellCard>
      </section>
    </main>
  );
}
