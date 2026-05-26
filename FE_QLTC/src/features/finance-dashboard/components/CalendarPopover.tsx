import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { BrutalIconButton } from "@/shared/components/layout/BrutalIconButton";
import { cn } from "@/lib/utils";
import { CASH_FLOW_MONTHS, calendarEvents } from "../mockData";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";
import { formatCalendarMonthShort } from "../utils/locale";
import { MonthTimeline } from "./MonthTimeline";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function CalendarPopover() {
  const { selectedMonth, setSelectedMonth, tr, language } = useFinanceDashboard();
  const [viewYear, setViewYear] = useState(2021);
  const [open, setOpen] = useState(false);

  const quickSelect = (month: string) => {
    setSelectedMonth(month);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>
          <BrutalIconButton aria-label={tr("calendar")}>
            <CalendarIcon className="h-4 w-4 stroke-[2.5]" />
          </BrutalIconButton>
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] overflow-hidden p-0">
        <div className="brutal-popover-header">
          <p className="brutal-popover-header-title">{tr("calendar")}</p>
          <p className="brutal-popover-header-sub">{tr("selectMonth")}</p>
        </div>

        <div className="brutal-popover-section">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="brutal-nav-btn"
              aria-label="Năm trước"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
            <span className="text-sm font-extrabold">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="brutal-nav-btn"
              aria-label="Năm sau"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((label) => {
              const shortYear = String(viewYear).slice(-2);
              const key = `${label} ${shortYear}` as (typeof CASH_FLOW_MONTHS)[number];
              const exists = CASH_FLOW_MONTHS.includes(key);
              const isActive = selectedMonth === key;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!exists}
                  onClick={() => exists && quickSelect(key)}
                  className={cn(
                    "brutal-month-btn",
                    isActive && exists && "brutal-month-btn-active",
                  )}
                >
                  {formatCalendarMonthShort(label, language)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-3 py-2">
          <MonthTimeline />
        </div>

        <div className="brutal-popover-footer">
          <p className="brutal-popover-header px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-neutral-600">
            {tr("upcomingEvents")}
          </p>
          <ul className="brutal-scroll max-h-40 overflow-y-auto px-2 pb-2">
            {calendarEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="brutal-menu-item"
                >
                  <div>
                    <p className="font-bold">{tr(ev.titleKey)}</p>
                    <p className="text-xs font-medium text-neutral-500">
                      {ev.date} ·{" "}
                      {"timeKey" in ev ? tr(ev.timeKey) : ev.time}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
