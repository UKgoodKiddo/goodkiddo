import Image from "next/image";
import Link from "next/link";
import { ChildPageScaffold } from "@/components/child-page-scaffold";
import { ChildSummaryCard } from "@/components/child-sections";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { getChildModeData } from "@/lib/data";

export default async function KiddoExplorersPage(props: {
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
        <div className="child-panel rounded-[2rem] p-5 sm:p-6">
          <Link
            aria-label="Open Creative Cove"
            className="flex items-center justify-center rounded-[2rem] p-4 transition-transform duration-200 hover:-translate-y-1"
            href="/child/kiddo_explorers/creative_cove"
          >
            <Image
              alt="Creative Cove"
              className="h-auto w-full max-w-[14rem] object-contain"
              height={512}
              priority
              src={GOODKIDDO_ASSETS.childCreativeCoveButton}
              width={512}
            />
          </Link>
        </div>
      </section>
    </ChildPageScaffold>
  );
}
