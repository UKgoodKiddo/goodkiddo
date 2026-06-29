import Link from "next/link";
import { ChildPageScaffold } from "@/components/child-page-scaffold";
import { ChildActivityCard, ChildSummaryCard } from "@/components/child-sections";
import { getChildModeData } from "@/lib/data";
import { formatBoops, formatDateTime } from "@/lib/utils";

export default async function ChildActivityPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [childMode, searchParams] = await Promise.all([
    getChildModeData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  return (
    <ChildPageScaffold bannerCode={bannerCode} childMode={childMode}>
      <section className="space-y-5">
        <ChildSummaryCard childMode={childMode} />

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="child-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-black">Waiting activity</p>
                <p className="mt-1 text-sm text-white/70">
                  These boops are ready to move across after a grown-up scans the correct Booper on their phone.
                </p>
              </div>
              <Link className="btn btn-secondary px-4 py-2 text-sm" href="/child/collect">
                View waiting
              </Link>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/60">
                Waiting total
              </p>
              <p className="mt-2 text-3xl font-black">{formatBoops(childMode.pendingBoopTotal)}</p>
            </div>

            <div className="mt-4 space-y-3">
              {childMode.pendingBoopAwards.length ? (
                childMode.pendingBoopAwards.map((award) => (
                  <div
                    key={award.id}
                    className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold">{award.reason}</p>
                        <p className="mt-1 text-sm text-white/65">
                          Waiting since {formatDateTime(award.created_at)}
                        </p>
                      </div>
                      <p className="font-black text-[#ffd53f]">+{award.amount}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/75">
                  No waiting boops right now.
                </div>
              )}
            </div>
          </div>

          <ChildActivityCard childMode={childMode} />
        </section>
      </section>
    </ChildPageScaffold>
  );
}
