import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="brutal-auth flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="brutal-card border-0 p-6 sm:p-8">
          <Link
            to={ROUTES.ROOT}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#0a0a0a] bg-[#a8e087] text-lg font-extrabold shadow-[3px_3px_0_0_#0a0a0a]"
          >
            F
          </Link>
          <h1 className="text-center text-2xl font-extrabold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-neutral-600">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="pt-4 text-center text-sm font-medium text-neutral-600">
          {footer}
        </div>
      </div>
    </div>
  );
}
