import type { UserDashboardData } from "@/features/dashboard/types";
import { CASH_FLOW_MONTHS, getCashFlowForMonth } from "../mockData";

/** ISO month key: `2026-05` */
export type MonthKey = string;

export function toMonthKey(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthKeysFromDashboard(data: UserDashboardData): MonthKey[] {
  const keys = new Set<MonthKey>();
  for (const tx of data.recentTransactions) {
    const d = new Date(tx.date);
    if (!Number.isNaN(d.getTime())) {
      keys.add(toMonthKey(d));
    }
  }
  keys.add(toMonthKey(new Date()));
  return Array.from(keys).sort().slice(-7);
}

export function cashFlowFromDashboardMonth(
  data: UserDashboardData,
  monthKey: MonthKey,
) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return getCashFlowForMonth(CASH_FLOW_MONTHS[0]);
  }

  let inflow = 0;
  let outflow = 0;
  for (const tx of data.recentTransactions) {
    const d = new Date(tx.date);
    if (
      Number.isNaN(d.getTime()) ||
      d.getFullYear() !== year ||
      d.getMonth() + 1 !== month
    ) {
      continue;
    }
    const amount = tx.transactionsAmount;
    if (tx.type === "Income") {
      inflow += amount;
    } else {
      outflow += amount;
    }
  }
  return {
    inflow,
    outflow,
    netChanges: inflow - outflow,
  };
}

export function cashFlowSeriesFromDashboard(data: UserDashboardData) {
  return monthKeysFromDashboard(data).map((month) => ({
    month,
    ...cashFlowFromDashboardMonth(data, month),
  }));
}
