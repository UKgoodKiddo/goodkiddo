import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/types";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasChildModeSelection =
    Boolean(request.cookies.get("goodkiddo-child-profile")?.value) ||
    Boolean(request.cookies.get("goodkiddo-child-mode")?.value);
  const shouldRedirectToChild =
    Boolean(user && hasChildModeSelection) &&
    (pathname === "/" || pathname.startsWith("/parent")) &&
    request.nextUrl.searchParams.get("unlock") !== "1";

  if (shouldRedirectToChild) {
    const childUrl = new URL("/child", request.url);
    return NextResponse.redirect(childUrl);
  }

  return response;
}
