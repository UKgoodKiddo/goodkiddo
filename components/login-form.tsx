"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
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
          autoComplete="current-password"
          className="field"
          minLength={8}
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </label>

      {state.status === "error" && state.message ? (
        <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">
          {state.message}
        </div>
      ) : null}

      <LoadingSubmitButton
        className="btn btn-primary w-full"
        pendingLabel="Signing in..."
        pendingOverride={pending}
      >
        Sign in
      </LoadingSubmitButton>
    </form>
  );
}
