import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from "lucide-react";
import {
  netIncomeRowKeys,
  payableBills,
  payableInvoices,
} from "../../mockData";
import { cn } from "@/lib/utils";
import { getCategoryDisplayName } from "@/shared/constants/userCopy";
import { useFinanceDashboard } from "../../context/FinanceDashboardContext";
import type { TranslationKey } from "../../i18n";
import { CashFlowChart } from "../CashFlowChart";
import { MonthTimeline } from "../MonthTimeline";
import { ProfitLossChart } from "../ProfitLossChart";
import { LegendDot } from "../shared";

export function OverviewTab() {
  const {
    cashFlow,
    profitLoss,
    format,
    tr,
    selectedMonth,
    formatMonth,
    dashboardData,
  } = useFinanceDashboard();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Cash flow */}
      <section className="brutal-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{tr("cashFlow")}</h2>
          <p className="mt-0.5 text-xs font-medium text-neutral-600">
            {formatMonth(selectedMonth)}
          </p>
        </div>

        <p className="text-sm text-neutral-600">{tr("cashFlowDesc")}</p>

        <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-800">
          <span className="flex items-center gap-1.5">
            <LegendDot color="bg-[#a8e087]" />
            {tr("inflow")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot color="bg-[#0a0a0a]" />
            {tr("outflow")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot color="bg-[#a5a6f6]" outline />
            {tr("netChanges")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="brutal-metric-green flex min-h-[148px] flex-col justify-between p-4">
            <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
            <div>
              <p className="text-sm font-semibold">{tr("inflow")}</p>
              <p className="text-xl font-bold">{format(cashFlow.inflow)}</p>
            </div>
          </div>
          <div className="brutal-metric-purple flex min-h-[148px] flex-col justify-between p-4">
            <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
            <div>
              <p className="text-sm font-semibold">{tr("outflow")}</p>
              <p className="text-xl font-bold">{format(cashFlow.outflow)}</p>
            </div>
          </div>
          <div className="brutal-metric-dark flex min-h-[148px] flex-col justify-between p-4">
            <ArrowLeftRight className="h-5 w-5 stroke-[2.5]" />
            <div>
              <p className="text-sm font-medium text-neutral-300">{tr("netChanges")}</p>
              <p className="text-xl font-bold">{format(cashFlow.netChanges)}</p>
            </div>
          </div>
        </div>

        <CashFlowChart />
        <MonthTimeline />
      </section>

      {/* Profit & loss */}
      <section className="brutal-card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">{tr("profitLoss")}</h2>

        <p className="text-sm text-neutral-600">{tr("profitLossDesc")}</p>

        <div className="flex gap-4 text-xs font-medium text-neutral-800">
          <span className="flex items-center gap-1.5">
            <LegendDot color="bg-[#a8e087]" />
            {tr("inflow")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot color="bg-[#a5a6f6]" />
            {tr("outflow")}
          </span>
        </div>

        <div className="brutal-pl-card overflow-hidden p-5">
          <div className="flex items-start justify-end">
            <span className="rounded-full border-2 border-[#a8e087] bg-[#a8e087]/20 px-2.5 py-0.5 text-xs font-bold text-[#a8e087]">
              +{profitLoss.changePercent}%
            </span>
          </div>
          <div className="py-4 text-center">
            <p
              className={cn(
                "font-bold text-[#a8e087]",
                dashboardData ? "text-3xl sm:text-4xl" : "text-5xl",
              )}
            >
              {dashboardData
                ? format(profitLoss.inflowTotal)
                : profitLoss.inflowToday}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {dashboardData ? "Tổng thu kỳ" : tr("inflowToday")}
            </p>
          </div>
          <ProfitLossChart />
          <div className="mt-4 grid grid-cols-2 gap-4 border-t-2 border-neutral-700 pt-4">
            <div>
              <div className="mb-2 flex h-8 items-end gap-0.5">
                {[40, 65, 50, 80, 55, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-[#a8e087]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold">
                {format(profitLoss.inflowTotal)} {tr("inflow")}
              </p>
            </div>
            <div>
              <div className="mb-2 flex h-8 items-end gap-0.5">
                {[20, 35, 25].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-[#a5a6f6]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold">
                {format(profitLoss.outflowTotal)} {tr("outflow")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Net income */}
      <section className="brutal-card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">
          {dashboardData ? "Tóm tắt kỳ" : tr("netIncome")}
        </h2>
        {dashboardData ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-600">
              <span>Hạng mục</span>
              <span className="text-right">Số tiền</span>
            </div>
            {[
              {
                label: tr("rowIncome" as TranslationKey),
                value: dashboardData.balanceSummary.totalIncome,
              },
              {
                label: tr("rowExpense" as TranslationKey),
                value: dashboardData.balanceSummary.totalExpense,
              },
              {
                label: tr("rowFiscalNet" as TranslationKey),
                value: dashboardData.balanceSummary.netChange,
              },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-2 gap-2">
                <span className="brutal-row flex items-center px-4 py-2.5 text-sm font-semibold">
                  {row.label}
                </span>
                <span className="brutal-row flex items-center justify-end px-3 py-2.5 text-sm font-medium">
                  {format(row.value)}
                </span>
              </div>
            ))}
            {dashboardData.categoryBreakdown.length > 0 ? (
              <>
                <h3 className="pt-4 text-sm font-bold">Chi theo danh mục</h3>
                {dashboardData.categoryBreakdown.map((item) => (
                  <div
                    key={item.categoryId}
                    className="grid grid-cols-2 gap-2"
                  >
                    <span className="brutal-row flex items-center px-4 py-2.5 text-sm font-medium">
                      {getCategoryDisplayName(item.categoryName)}
                    </span>
                    <span className="brutal-row flex items-center justify-end px-3 py-2.5 text-sm font-semibold">
                      {format(item.totalAmount)}
                    </span>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-600">
              <span>{tr("fiscalYear")}</span>
              <span className="text-right">{tr("year2020")}</span>
              <span className="text-right">{tr("year2021")}</span>
            </div>
            {netIncomeRowKeys.map((row) => (
              <div
                key={row.labelKey}
                className="grid grid-cols-3 gap-2"
              >
                <span className="brutal-row flex items-center px-4 py-2.5 text-sm font-semibold">
                  {tr(row.labelKey as TranslationKey)}
                </span>
                <span className="brutal-row flex items-center justify-end px-3 py-2.5 text-sm font-medium">
                  {format(row.y2020)}
                </span>
                <span className="brutal-row flex items-center justify-end px-3 py-2.5 text-sm font-medium">
                  {format(row.y2021)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payable & owing */}
      <section className="brutal-card space-y-4 p-5 sm:p-6">
        {dashboardData ? (
          <>
            <h2 className="text-lg font-bold tracking-tight">
              Recent transactions
            </h2>
            <div className="space-y-2">
              {dashboardData.recentTransactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="brutal-row grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{tx.note || tx.type}</p>
                    <p className="text-xs font-semibold text-neutral-500">
                      Source: {tx.source || "Manual"}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-extrabold",
                      tx.type === "Income" ? "text-green-700" : "text-red-600",
                    )}
                  >
                    {tx.type === "Income" ? "+" : "-"}
                    {format(tx.transactionsAmount)}
                  </p>
                </div>
              ))}
              {dashboardData.recentTransactions.length === 0 ? (
                <p className="text-sm font-medium text-neutral-500">
                  No transactions yet.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold tracking-tight">{tr("payableOwing")}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-bold">{tr("invoicesPayable")}</h3>
                <ul className="space-y-2">
                  {payableInvoices.map((item) => (
                    <li
                      key={item.labelKey}
                      className="brutal-row flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">{tr(item.labelKey as TranslationKey)}</span>
                      <span className="font-bold">{format(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold">{tr("billsYouOwe")}</h3>
                <ul className="space-y-2">
                  {payableBills.map((item) => (
                    <li
                      key={item.labelKey}
                      className="brutal-row flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">{tr(item.labelKey as TranslationKey)}</span>
                      <span className="font-bold">{format(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
