import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrutalPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function BrutalPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: BrutalPageHeaderProps) {
  return (
    <div
      className={cn(
        "brutal-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-neutral-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
