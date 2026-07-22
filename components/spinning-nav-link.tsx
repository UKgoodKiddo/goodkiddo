"use client";

import Link, { type LinkProps } from "next/link";
import {
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { cn } from "@/lib/utils";

type SpinningNavLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    spinClassName?: string;
  };

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey
  );
}

export function SpinningNavLink({
  children,
  className,
  onClick,
  onTouchStart,
  spinClassName,
  ...props
}: SpinningNavLinkProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const startSpinning = () => {
    setIsSpinning(true);
  };

  const handleTouchStart = (event: TouchEvent<HTMLAnchorElement>) => {
    onTouchStart?.(event);

    if (event.defaultPrevented) {
      return;
    }

    startSpinning();
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || !isPlainLeftClick(event)) {
      return;
    }

    startSpinning();
  };

  return (
    <Link
      {...props}
      className={cn(className, isSpinning ? spinClassName ?? "child-nav-link--spinning" : "")}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
    >
      {children}
    </Link>
  );
}
