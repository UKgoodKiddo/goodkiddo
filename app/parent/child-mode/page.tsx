import Link from "next/link";
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import {
  KiddoRouteImage,
  type KiddoImageDebugMode,
} from "@/components/kiddo-route-image";
import { ParentChildModeLauncher } from "@/components/parent-child-mode-launcher";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
import { formatBoops } from "@/lib/utils";

export default async function ParentChildModePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getParentDashboardData(),
    props.searchParams,
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getParentStatusBanner(bannerCode);
  const imageDebugMode =
    searchParams.imageDebug === "placeholders" || searchParams.imageDebug === "log"
      ? (searchParams.imageDebug as KiddoImageDebugMode)
      : "off";

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <ShellCard className="rounded-[1.8rem] p-6">
        <p className="eyebrow">Child mode</p>
        <h2 className="mt-3 text-3xl font-extrabold">Choose a child profile</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          Pick the child for this device first. That keeps child mode tied to a real profile instead of opening an empty session.
        </p>
      </ShellCard>

      {dashboard.children.length ? (
        <section className="grid grid-cols-2 gap-4">
          {dashboard.children.map((child) => (
            <ShellCard key={child.id} className="rounded-[1.8rem] p-5">
              <div className="flex flex-col items-start gap-4">
                {child.avatar_url ? (
                  <KiddoRouteImage
                    alt={`${child.display_name} avatar`}
                    className="h-16 w-16 rounded-[1.2rem] object-cover"
                    debugLabel="parent-child-mode-avatar"
                    height={64}
                    imageDebugMode={imageDebugMode}
                    src={child.avatar_url}
                    width={64}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-[color:var(--sun)] text-2xl font-black text-[color:var(--foreground)]">
                    {child.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="w-full">
                  <h3 className="text-xl font-extrabold">{child.display_name}</h3>
                  <p className="mt-1 text-sm font-bold text-[color:var(--ink-soft)]">
                    {formatBoops(child.boop_balance)}
                  </p>
                </div>
                <div className="w-full text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                  Launch child mode
                </div>
                <ParentChildModeLauncher
                  childProfileId={child.id}
                  deviceLabel={`${child.display_name}'s device`}
                  familyId={dashboard.family?.id ?? ""}
                />
              </div>
            </ShellCard>
          ))}
        </section>
      ) : (
        <ShellCard className="rounded-[1.8rem] p-6 text-center">
          <p className="text-2xl font-extrabold">Add a child profile first</p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Child mode only works after you have a real child profile to choose from.
          </p>
          <Link className="btn btn-primary mt-5" href="/parent/children">
            Go to children
          </Link>
        </ShellCard>
      )}
    </main>
  );
}
