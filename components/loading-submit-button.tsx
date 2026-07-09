"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type LoadingSubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  pendingOverride?: boolean;
};

export function LoadingSubmitButton({
  children,
  disabled,
  onClick,
  pendingLabel,
  pendingOverride = false,
  ...props
}: LoadingSubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const isLoading = pendingOverride || formPending;

  return (
    <button
      {...props}
      aria-busy={isLoading}
      disabled={disabled || formPending || pendingOverride}
      onClick={(event) => {
        onClick?.(event);
      }}
      type="submit"
    >
      {isLoading ? (
        <>
          <span aria-hidden="true" className="btn-spinner" />
          <span>{pendingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
