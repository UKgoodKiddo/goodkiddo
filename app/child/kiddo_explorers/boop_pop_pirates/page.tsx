import { CreativeCoveBackButton } from "@/components/creative-cove-back-button";
import { BoopPopPiratesShell } from "@/components/boop-pop-pirates-shell";
import { getBoopPopPiratesPageData } from "@/lib/boop-pop-pirates-server";

export default async function BoopPopPiratesPage() {
  const pageData = await getBoopPopPiratesPageData();

  if (!pageData.child) {
    return (
      <main className="boop-pop-pirates-page boop-pop-pirates-page--empty" aria-label="Boop Pop Pirates">
        <section className="boop-pop-pirates-empty-state">
          <p className="boop-pop-pirates-empty-state__eyebrow">Boop Pop Pirates</p>
          <h1 className="boop-pop-pirates-empty-state__title">This pirate sea is getting ready</h1>
          <p className="boop-pop-pirates-empty-state__copy">
            {pageData.setupMessage ?? "Choose a child profile to open this biome."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="boop-pop-pirates-page" aria-label="Boop Pop Pirates">
      <CreativeCoveBackButton />
      <BoopPopPiratesShell
        childId={pageData.child.id}
        childName={pageData.child.display_name}
        initialCollectedCollectibleIds={pageData.collectedCollectibleIds}
      />
    </main>
  );
}
