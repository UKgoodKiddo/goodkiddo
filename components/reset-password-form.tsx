"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoveryState =
  | { message: string; status: "checking" }
  | { message: string; status: "error" }
  | { message: string; status: "ready" }
  | { message: string; status: "success" };

const initialRecoveryState: RecoveryState = {
  status: "checking",
  message: "Checking your reset link...",
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [recoveryState, setRecoveryState] =
    useState<RecoveryState>(initialRecoveryState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken && hashType === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
          window.history.replaceState({}, document.title, "/auth/reset-password");
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (/code verifier/i.test(error.message)) {
              throw new Error(
                "This reset link came from an older same-browser flow. Request a fresh reset email and open the newest link.",
              );
            }

            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error("This reset link is missing or has expired. Request a new one.");
        }

        if (!cancelled) {
          setRecoveryState({
            status: "ready",
            message: "Choose a new password for your parent account.",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setRecoveryState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "This reset link could not be used. Request a new one.",
          });
        }
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setRecoveryState({
        status: "error",
        message: "Use at least 8 characters for the new password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setRecoveryState({
        status: "error",
        message: "The new passwords do not match yet.",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitting(false);
      setRecoveryState({
        status: "error",
        message: error.message,
      });
      return;
    }

    setRecoveryState({
      status: "success",
      message: "Password updated. Taking you back to sign in...",
    });

    setTimeout(() => {
      router.push("/auth/login?status=password-reset");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="grid gap-4">
      <div
        className={
          recoveryState.status === "error"
            ? "rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950"
            : recoveryState.status === "success"
              ? "rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950"
              : "rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-950"
        }
      >
        {recoveryState.message}
      </div>

      {recoveryState.status === "ready" ? (
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold">New password</span>
            <input
              autoComplete="new-password"
              className="field"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choose a secure password"
              required
              type="password"
              value={password}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold">Confirm new password</span>
            <input
              autoComplete="new-password"
              className="field"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Type it again"
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          <LoadingSubmitButton
            className="btn btn-primary w-full"
            pendingLabel="Saving password..."
            pendingOverride={submitting}
          >
            Save new password
          </LoadingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}
