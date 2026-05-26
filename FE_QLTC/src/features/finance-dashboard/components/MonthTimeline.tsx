import { cn } from "@/lib/utils";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";

export function MonthTimeline() {
  const { selectedMonth, setSelectedMonth, formatMonth, availableMonths } =
    useFinanceDashboard();

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {availableMonths.map((month) => (
        <button
          key={month}
          type="button"
          onClick={() => setSelectedMonth(month)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold transition",
            selectedMonth === month
              ? "brutal-pill-active"
              : "brutal-pill text-neutral-700 hover:translate-x-[-1px] hover:translate-y-[-1px]",
          )}
        >
          {formatMonth(month)}
        </button>
      ))}
    </div>
  );
}
