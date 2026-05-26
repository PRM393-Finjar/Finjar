import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTransactions } from "../../mockData";
import { useFinanceDashboard } from "../../context/FinanceDashboardContext";
import { DropdownPill, SectionCard } from "../shared";

const FILTER_KEYS = [
  { value: "All", key: "filterAll" as const },
  { value: "Income", key: "filterIncome" as const },
  { value: "Expense", key: "filterExpense" as const },
  { value: "Pending", key: "filterPending" as const },
] as const;

type TransactionsTabProps = {
  searchQuery: string;
};

export function TransactionsTab({ searchQuery }: TransactionsTabProps) {
  const { format, tr } = useFinanceDashboard();
  const [filter, setFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mockTransactions.filter((tx) => {
      const matchesSearch =
        !q ||
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q);
      const matchesFilter =
        filter === "All" ||
        (filter === "Pending" && tx.status === "Pending") ||
        tx.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  const totals = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const filterOptions = FILTER_KEYS.map((f) => f.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{tr("transactions")}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {tr("recentActivity")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownPill
            value={filter}
            onValueChange={setFilter}
            options={filterOptions}
            getLabel={(v) => {
              const item = FILTER_KEYS.find((f) => f.value === v);
              return item ? tr(item.key) : v;
            }}
          />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Filter className="h-4 w-4" />
            {tr("moreFilters")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard>
          <div className="flex items-center gap-2 text-green-600">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{tr("totalIncome")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{format(totals.income)}</p>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-2 text-purple-600">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm font-medium">{tr("totalExpense")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{format(totals.expense)}</p>
        </SectionCard>
        <SectionCard>
          <span className="text-sm font-medium text-neutral-500">{tr("net")}</span>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              totals.net >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {format(totals.net)}
          </p>
        </SectionCard>
      </div>

      <SectionCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
                <th className="px-5 py-3">{tr("date")}</th>
                <th className="px-5 py-3">{tr("description")}</th>
                <th className="px-5 py-3">{tr("category")}</th>
                <th className="px-5 py-3">{tr("status")}</th>
                <th className="px-5 py-3 text-right">{tr("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    {tr("noTransactions")}
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-5 py-4 text-neutral-500">{tx.date}</td>
                    <td className="px-5 py-4 font-medium">{tx.description}</td>
                    <td className="px-5 py-4">{tx.category}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          tx.status === "Completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                        )}
                      >
                        {tr(
                          tx.status === "Completed"
                            ? "statusCompleted"
                            : "statusPending",
                        )}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-5 py-4 text-right font-semibold",
                        tx.type === "Income"
                          ? "text-green-600"
                          : "text-purple-600",
                      )}
                    >
                      {tx.type === "Income" ? "+" : "-"}
                      {format(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
