"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "";

  return (
    <form action={formAction} className="grid gap-4">
      <input name="returnTo" type="hidden" value={returnTo} />
      <label className="grid gap-2">
        <span className="text-sm font-bold">Email</span>
        <input
          autoComplete="email"
          className="field"
          name="email"
          placeholder="parent@example.com"
          required
          type="email"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold">Password</span>
        <input
          autoComplete="new-password"
          className="field"
          minLength={8}
          name="password"
          placeholder="Choose a secure password"
          required
          type="password"
        />
      </label>

      {state.status !== "idle" && state.message ? (
        <div
          className={
            state.status === "error"
              ? "rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950"
              : "rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950"
          }
        >
          {state.message}
        </div>
      ) : null}

      <LoadingSubmitButton
        className="btn btn-primary w-full"
        pendingLabel="Creating account..."
        pendingOverride={pending}
      >
        Create parent account
      </LoadingSubmitButton>

      <p className="text-center text-sm text-[color:var(--ink-soft)]">
        Already have a parent account?{" "}
        <Link
          className="font-bold text-[color:var(--secondary)]"
          href={returnTo ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : "/auth/login"}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
