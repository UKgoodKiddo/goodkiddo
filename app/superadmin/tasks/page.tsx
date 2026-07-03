/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { uploadTaskAssetAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { SuperAdminTaskAssetForm } from "@/components/superadmin-task-asset-form";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { getSuperAdminStatusBanner } from "@/lib/super-admin-status";
import { getTaskAssetCoverage } from "@/lib/task-card-assets";
import { TASK_CARD_CATEGORY_ORDER } from "@/lib/task-card-utils";

export default async function SuperAdminTasksPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [searchParams, assetCoverage] = await Promise.all([
    props.searchParams,
    getTaskAssetCoverage(),
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getSuperAdminStatusBanner(bannerCode, searchParams);
  const readyCount = assetCoverage.filter(
    (asset) => asset.parentAssetSrc && asset.childAssetSrc,
  ).length;
  const partialCount = assetCoverage.length - readyCount;

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#ff9a52,#ff5a30)] p-3 shadow-[0_14px_30px_rgba(255,90,48,0.22)]">
              <Image
                alt="Task asset upload"
                height={52}
                src={GOODKIDDO_ASSETS.boopCool}
                width={52}
              />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold">Add Task Asset</h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Upload matching JPG, PNG, or WebP task images once and the task wizard plus child
                task cards will discover them automatically.
              </p>
            </div>
          </div>

          <SuperAdminTaskAssetForm
            action={uploadTaskAssetAction}
            categories={TASK_CARD_CATEGORY_ORDER}
            existingAssets={assetCoverage.map((asset) => ({
              category: asset.category,
              key: asset.key,
              title: asset.title,
            }))}
          />
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="mint">{readyCount} ready tasks</StatusPill>
            <StatusPill tone={partialCount ? "sun" : "sky"}>
              {partialCount} missing a matching pair
            </StatusPill>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            <p>Task name becomes the canonical stored filename, for example `Feed the fish.png`.</p>
            <p>
              Parent and child uploads can come from normal phone image exports and are converted
              into matching PNG task assets automatically.
            </p>
            <p>
              If that task already exists, tick replace to override the current art without touching
              the underlying task logic.
            </p>
            <p>
              Discovery stays automatic. After upload, the task appears in the parent wizard and the
              child UI resolves the matching before/after card from the same filename.
            </p>
          </div>
        </ShellCard>
      </section>

      <ShellCard className="rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">Current task assets</h2>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Every row shows whether the parent wizard icon and child task card are both present.
            </p>
          </div>
          <StatusPill tone="sky">{assetCoverage.length} discovered tasks</StatusPill>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {assetCoverage.length ? (
            assetCoverage.map((asset) => (
              <div key={asset.key} className="list-row rounded-[1.5rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold">{asset.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{asset.category}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StatusPill tone={asset.parentAssetSrc ? "mint" : "sun"}>
                      Parent {asset.parentAssetSrc ? "ready" : "missing"}
                    </StatusPill>
                    <StatusPill tone={asset.childAssetSrc ? "mint" : "sun"}>
                      Child {asset.childAssetSrc ? "ready" : "missing"}
                    </StatusPill>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-white/75 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                      Parent UI
                    </p>
                    <div className="mt-3 flex min-h-28 items-center justify-center rounded-[1rem] bg-[#f9fbff] p-3">
                      {asset.parentAssetSrc ? (
                        <img
                          alt={`${asset.title} parent asset`}
                          className="max-h-24 w-auto rounded-[0.8rem] object-contain"
                          src={asset.parentAssetSrc}
                        />
                      ) : (
                        <span className="text-sm text-[color:var(--ink-soft)]">No parent PNG</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-white/75 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                      Child UI
                    </p>
                    <div className="mt-3 flex min-h-28 items-center justify-center rounded-[1rem] bg-[#f9fbff] p-3">
                      {asset.childAssetSrc ? (
                        <img
                          alt={`${asset.title} child asset`}
                          className="max-h-24 w-auto rounded-[0.8rem] object-contain"
                          src={asset.childAssetSrc}
                        />
                      ) : (
                        <span className="text-sm text-[color:var(--ink-soft)]">No child PNG</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
              No task assets were discovered yet.
            </div>
          )}
        </div>
      </ShellCard>
    </main>
  );
}
