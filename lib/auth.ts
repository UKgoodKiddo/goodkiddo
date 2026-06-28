import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function getParentViewer() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      user: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    configured: true,
    user,
  };
}
