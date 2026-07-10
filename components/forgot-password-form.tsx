"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold">Parent email</span>
        <input
          autoComplete="email"
          className="field"
          name="email"
          placeholder="parent@example.com"
          required
          type="email"
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
        pendingLabel="Sending email..."
        pendingOverride={pending}
      >
        Send reset email
      </LoadingSubmitButton>

      <p className="text-center text-sm text-[color:var(--ink-soft)]">
        Remembered it?{" "}
        <Link className="font-bold text-[color:var(--secondary)]" href="/auth/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
