import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Chuỗi `yyyy-MM-ddTHH:mm` (local) cho submit form. */
function toDatetimeLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function endOfToday() {
  const t = new Date();
  t.setHours(23, 59, 59, 999);
  return t;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type ScheduleDateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Chặn chọn ngày/giờ trước hôm nay. Mặc định true. */
  disablePast?: boolean;
  /** Chặn chọn ngày/giờ sau hiện tại (thu/chi). */
  disableFuture?: boolean;
  /** Hiện nút «Xóa» để để trống. Mặc định true. */
  allowClear?: boolean;
};

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
  formatLabel,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatLabel: (v: number) => string;
}) {
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="flex flex-col gap-1">
      <p className="px-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="scrollbar-none flex max-h-[13.5rem] w-11 flex-col gap-0.5 overflow-y-auto rounded-lg border-2 border-neutral-900 bg-neutral-50 py-1 pr-0.5">
        {values.map((v) => (
          <button
            key={v}
            ref={selected === v ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              "mx-0.5 min-h-8 shrink-0 rounded-md px-1 py-1 text-center text-xs tabular-nums transition-colors",
              selected === v
                ? "bg-[#a8e087] font-medium text-neutral-900 shadow-sm"
                : "text-slate-700 hover:bg-neutral-200",
            )}
          >
            {formatLabel(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScheduleDateTimePicker({
  id,
  value,
  onChange,
  className,
  disablePast = true,
  disableFuture = false,
  allowClear = true,
}: ScheduleDateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = React.useMemo(() => fromDatetimeLocalValue(value), [value]);

  const selectedDate = parsed ? new Date(parsed) : undefined;
  const nowHour = new Date().getHours();
  const nowMinute = new Date().getMinutes();
  const hour = parsed?.getHours() ?? nowHour;
  const minute = parsed?.getMinutes() ?? nowMinute;
  const effectiveMinute = MINUTES.includes(minute) ? minute : 0;

  const isTodaySelected =
    selectedDate != null && isSameCalendarDay(selectedDate, startOfToday());

  let allowedHours = [...HOURS];
  if (disablePast && isTodaySelected) {
    allowedHours = allowedHours.filter((h) => h >= nowHour);
  }
  if (disableFuture && isTodaySelected) {
    allowedHours = allowedHours.filter((h) => h <= nowHour);
  }
  if (allowedHours.length === 0) {
    allowedHours = [nowHour];
  }

  let allowedMinutes = [...MINUTES];
  if (disablePast && isTodaySelected && hour === nowHour) {
    allowedMinutes = allowedMinutes.filter((m) => m >= nowMinute);
  }
  if (disableFuture && isTodaySelected && hour === nowHour) {
    allowedMinutes = allowedMinutes.filter((m) => m <= nowMinute);
  }
  if (allowedMinutes.length === 0) {
    allowedMinutes = [0];
  }

  const effectiveHour = allowedHours.includes(hour)
    ? hour
    : allowedHours[0] ?? 0;
  const effectiveMinuteClamped = allowedMinutes.includes(effectiveMinute)
    ? effectiveMinute
    : allowedMinutes[allowedMinutes.length - 1] ?? 0;

  function applyDateTime(next: { date?: Date; h?: number; m?: number }) {
    const base = next.date ?? selectedDate ?? new Date();
    const h = next.h ?? effectiveHour;
    const m = next.m ?? effectiveMinuteClamped;
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    onChange(toDatetimeLocalValue(d));
  }

  const calendarDisabled = React.useMemo(() => {
    if (disablePast && disableFuture) {
      return { before: startOfToday(), after: endOfToday() };
    }
    if (disablePast) return { before: startOfToday() };
    if (disableFuture) return { after: endOfToday() };
    return undefined;
  }, [disablePast, disableFuture]);

  const displayLabel = parsed
    ? format(parsed, "dd/MM/yyyy HH:mm", { locale: vi })
    : "Chọn ngày giờ…";

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "brutal-btn-outline h-10 w-full max-w-md justify-start gap-2 font-normal",
            !parsed && "text-neutral-500",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-neutral-900" />
          {displayLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col sm:flex-row sm:divide-x-2 sm:divide-[#0a0a0a]">
          <div className="p-2">
            <Calendar
              key={value || "empty"}
              mode="single"
              defaultMonth={parsed ?? new Date()}
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                applyDateTime({ date: d });
              }}
              disabled={calendarDisabled}
              initialFocus
            />
            <div
              className={cn(
                "mt-1 flex items-center gap-2 border-t border-neutral-200 px-1 pt-2",
                allowClear ? "justify-between" : "justify-end",
              )}
            >
              {allowClear ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-neutral-900 hover:underline"
                  onClick={() => onChange("")}
                >
                  Xóa
                </button>
              ) : null}
              <button
                type="button"
                className="text-xs font-semibold text-neutral-900 hover:underline"
                onClick={() => {
                  const n = new Date();
                  applyDateTime({ date: n, h: n.getHours(), m: n.getMinutes() });
                }}
              >
                {disableFuture ? "Bây giờ" : "Hôm nay"}
              </button>
            </div>
          </div>
          <div className="flex gap-2 border-t-2 border-[#0a0a0a] p-3 sm:border-t-0 sm:pt-4">
            <TimeColumn
              label="Giờ"
              values={allowedHours}
              selected={effectiveHour}
              onSelect={(h) => applyDateTime({ h })}
              formatLabel={(v) => pad2(v)}
            />
            <TimeColumn
              label="Phút"
              values={allowedMinutes}
              selected={effectiveMinuteClamped}
              onSelect={(m) => applyDateTime({ m })}
              formatLabel={(v) => pad2(v)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
