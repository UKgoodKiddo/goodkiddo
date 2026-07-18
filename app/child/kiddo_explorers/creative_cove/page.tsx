import { CreativeCoveBackButton } from "@/components/creative-cove-back-button";
import { CreativeCoveShell } from "@/components/creative-cove-shell";

export default function CreativeCovePage() {
  return (
    <main className="creative-cove-page" aria-label="Creative Cove">
      <CreativeCoveBackButton />
      <CreativeCoveShell />
    </main>
  );
}
