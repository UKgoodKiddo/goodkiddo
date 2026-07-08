import { notFound, redirect } from "next/navigation";
import { getParentViewer } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { areUidsEqual, isNormalizedUidValid, normalizeUid } from "@/lib/uid";

export default async function BooperTapPage(props: {
  params: Promise<{ uid: string }>;
}) {
  const [{ uid }, viewer] = await Promise.all([props.params, getParentViewer()]);

  const normalizedUid = normalizeUid(uid);

  if (!isNormalizedUidValid(normalizedUid)) {
    notFound();
  }

  if (!viewer.user) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(`/b/${normalizedUid}`)}`);
  }

  const admin = createSupabaseAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("id")
    .eq("parent_user_id", viewer.user.id)
    .maybeSingle();

  if (!family) {
    redirect("/parent");
  }

  const { data: inventoryBoopers } = await admin
    .from("booper_inventory")
    .select("child_profile_id, family_id, uid")
    .eq("family_id", family.id);

  const matchingBooper =
    inventoryBoopers?.find((booper) => areUidsEqual(booper.uid, normalizedUid)) ?? null;

  if (matchingBooper?.child_profile_id) {
    redirect(
      `/parent/collect/${matchingBooper.child_profile_id}?booperUid=${encodeURIComponent(normalizedUid)}`,
    );
  }

  redirect("/parent");
}
