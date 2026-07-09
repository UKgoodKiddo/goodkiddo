import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { SuperAdminNav } from "@/components/super-admin-nav";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { getSuperAdminViewer } from "@/lib/super-admin";

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getSuperAdminViewer();

  if (!viewer.user) {
    redirect("/auth/login");
  }

  if (!viewer.isSuperAdmin) {
    redirect("/parent");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-6 sm:px-8 lg:px-10">
      <header className="shell-card mb-6 flex flex-col gap-5 rounded-[2rem] bg-[linear-gradient(135deg,#fff7f1,#ffffff)] px-5 py-5 shadow-[0_18px_60px_rgba(120,58,19,0.12)] sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#ff9a52,#ff5a30)] p-3 shadow-[0_14px_30px_rgba(255,90,48,0.24)]">
              <Image alt="goodKiddo mascot" height={66} src={GOODKIDDO_ASSETS.boopCool} width={66} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">goodKiddo Super Admin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
                Manage families, subscription records, and wristband inventory without exposing child profiles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="btn btn-ghost px-4 py-2" href="/">
              Home
            </Link>
            <Link className="btn btn-secondary px-4 py-2" href="/parent">
              Parent hub
            </Link>
            <form action={signOutAction}>
              <LoadingSubmitButton
                className="btn btn-primary px-4 py-2"
                pendingLabel="Signing out..."
              >
                Sign out
              </LoadingSubmitButton>
            </form>
          </div>
        </div>

        <div className="parent-soft-panel flex flex-col gap-3 rounded-[1.6rem] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[color:var(--ink-soft)]">
              Signed in as {viewer.user.email ?? "super admin"}
            </p>
          </div>
          <SuperAdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}
