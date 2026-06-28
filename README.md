# goodKiddo framework

Starter framework for a Next.js PWA backed by Supabase.

## What is included

- Parent auth with Supabase email/password.
- A family-scoped tenant model for `families`, `child_profiles`, `boopers`,
  `boop_transactions`, `rewards`, `redemptions`, and `device_child_mode`.
- Parent dashboard shell with forms for family creation, child creation, and
  awarding boops.
- Child mode shell that avoids child login accounts by using a signed device
  cookie and server-side reads.
- PWA basics: manifest, generated icons, and a starter service worker.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` into `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   CHILD_MODE_COOKIE_SECRET=
   ```

   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the current Supabase naming.
   The starter also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` for compatibility.

3. Run the initial migration from [supabase/migrations/20260616193000_initial_goodkiddo.sql](/C:/Users/Letit/Documents/Codex/2026-06-16/we-are-building-the-first-framework/supabase/migrations/20260616193000_initial_goodkiddo.sql).

4. Create a parent user in Supabase Auth.

5. Start the app:

   ```bash
   npm run dev
   ```

   For installability testing, use:

   ```bash
   npm run dev:https
   ```

## Route map

- `/` marketing and framework overview
- `/auth/login` parent sign-in
- `/parent` parent/admin dashboard
- `/child` child-mode shell

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` is intentionally used only on the server for
  child-mode reads, since children do not have Supabase auth accounts.
- `child_profiles.boop_balance` is maintained by SQL triggers based on awarded
  boops and reward redemptions.
- The current child-mode launch flow is intentionally simple: a parent launches
  child mode on the same browser, which creates a signed device session and a
  `device_child_mode` row.
