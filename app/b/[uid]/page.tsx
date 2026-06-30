import { notFound, redirect } from "next/navigation";
import { getParentViewer } from "@/lib/auth";
import { readChildModeSelection } from "@/lib/child-mode";

function normalizeBooperUid(value: string) {
  return value.trim().toUpperCase();
}

function isValidBooperUid(value: string) {
  return /^[A-Z0-9:_-]{4,120}$/.test(value);
}

export default async function BooperTapPage(props: {
  params: Promise<{ uid: string }>;
}) {
  const [{ uid }, viewer, childModeSelection] = await Promise.all([
    props.params,
    getParentViewer(),
    readChildModeSelection(),
  ]);

  const normalizedUid = normalizeBooperUid(uid);

  if (!isValidBooperUid(normalizedUid)) {
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
