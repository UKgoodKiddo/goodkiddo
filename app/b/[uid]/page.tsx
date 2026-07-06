import { notFound, redirect } from "next/navigation";
import { getParentViewer } from "@/lib/auth";
import { readChildModeSelection } from "@/lib/child-mode";
import { isNormalizedUidValid, normalizeUid } from "@/lib/uid";

export default async function BooperTapPage(props: {
  params: Promise<{ uid: string }>;
}) {
  const [{ uid }, viewer, childModeSelection] = await Promise.all([
    props.params,
    getParentViewer(),
    readChildModeSelection(),
  ]);

  const normalizedUid = normalizeUid(uid);

  if (!isNormalizedUidValid(normalizedUid)) {
    notFound();
  }

  if (!viewer.user) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(`/b/${normalizedUid}`)}`);
  }

  if (childModeSelection) {
    redirect("/child?status=child-mode-ready");
  }

  redirect(
    `/parent/boopers?status=booper-tap-ready&booperUid=${encodeURIComponent(normalizedUid)}`,
  );
}
