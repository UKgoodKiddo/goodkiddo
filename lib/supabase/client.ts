"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { env, isSupabaseConfigured } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let implicitBrowserClient: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase browser client requested before env was configured.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return browserClient;
}

export function createSupabaseImplicitBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase browser client requested before env was configured.");
  }

  if (!implicitBrowserClient) {
    implicitBrowserClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "implicit",
          persistSession: true,
        },
      },
    );
  }

  return implicitBrowserClient;
}
