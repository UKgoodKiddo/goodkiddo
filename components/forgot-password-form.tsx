"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { createSupabaseImplicitBrowserClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

const initialState = {
  status: "idle" as "error" | "idle" | "success",
  message: "",
};

export function ForgotPasswordForm() {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rawEmail = formData.get("email");
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

    if (!email) {
      setState({
        status: "error",
        message: "Enter a valid parent email address.",
      });
      return;
    }

    setPending(true);
    setState(initialState);

    try {
      const supabase = createSupabaseImplicitBrowserClient();
      const redirectTo = `${getSiteUrl().replace(/\/$/, "")}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setState({
          status: "error",
          message: error.message,
        });
        return;
      }

      setState({
        status: "success",
        message: "Password reset email sent. Check your inbox to continue.",
      });
      event.currentTarget.reset();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "The reset email could not be sent right now.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
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
