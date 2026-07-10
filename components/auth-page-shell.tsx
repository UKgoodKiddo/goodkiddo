import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShellCard } from "@/components/shell-card";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

type AuthPageShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthPageShell({
  children,
  description,
  title,
}: AuthPageShellProps) {
  return (
    <main className="flex flex-1 bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_18%,#7fa6ff_34%,#1b43b7_58%,#0d36a8_100%)]">
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid w-full gap-5">
          <Link
            aria-label="Go to goodKiddo home"
            className="mx-auto block w-full max-w-[34rem]"
            href="/"
          >
            <Image
              alt="goodKiddo"
              className="h-auto w-full"
              height={260}
              priority
              src={GOODKIDDO_ASSETS.headerLogo}
              width={860}
            />
          </Link>

          <ShellCard className="rounded-[2rem] p-6 sm:p-8">
            <div className="space-y-2 text-center sm:space-y-3">
              <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
              <p className="mx-auto max-w-xl text-sm leading-6 text-[color:var(--ink-soft)] sm:text-base">
                {description}
              </p>
            </div>

            <div className="mt-6">{children}</div>
          </ShellCard>
        </div>
      </div>
    </main>
  );
}
