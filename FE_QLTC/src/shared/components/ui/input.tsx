import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm shadow-[2px_2px_0_0_#0a0a0a] transition-colors outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#a8e087] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
