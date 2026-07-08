import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function getParentViewer() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      familyName: null,
      user: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let familyName: string | null = null;

  if (user?.id) {
    const { data: family } = await supabase
      .from("families")
      .select("family_name")
      .eq("parent_user_id", user.id)
      .single();

    familyName = family?.family_name ?? null;
  }

  return {
    configured: true,
    familyName,
    user,
  };
}
