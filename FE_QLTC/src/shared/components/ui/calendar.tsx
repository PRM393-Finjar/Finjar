import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex",
        month: "flex flex-col gap-2",
        month_caption:
          "relative mx-10 mb-1 flex h-8 items-center justify-center",
        caption_label: "text-sm font-extrabold text-[#0a0a0a]",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
        button_previous: cn(
          "brutal-nav-btn size-8 shrink-0 p-0",
        ),
        button_next: cn(
          "brutal-nav-btn size-8 shrink-0 p-0",
        ),
        weekdays: "flex",
        weekday:
          "w-9 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-600",
        week: "mt-0.5 flex w-full",
        day: "size-9 p-0 text-center",
        day_button: cn(
          "size-9 rounded-lg border-2 border-transparent p-0 text-sm font-semibold text-[#0a0a0a] transition-colors",
          "hover:border-[#0a0a0a] hover:bg-[#a8e087]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8e087]",
        ),
        selected:
          "relative rounded-lg border-2 border-[#0a0a0a] bg-[#a8e087] font-bold [&_button]:text-[#0a0a0a]",
        today: "rounded-lg border-2 border-[#0a0a0a]/40 bg-white font-bold",
        outside: "text-neutral-300 opacity-55",
        disabled: "text-neutral-300 opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chClass }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return (
            <Icon
              className={cn("size-4 stroke-[2.5]", chClass)}
              aria-hidden
            />
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
