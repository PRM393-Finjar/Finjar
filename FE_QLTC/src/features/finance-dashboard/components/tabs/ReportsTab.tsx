import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportSummaries } from "../../mockData";
import { useFinanceDashboard } from "../../context/FinanceDashboardContext";
import type { TranslationKey } from "../../i18n";
import { SectionCard } from "../shared";

const REPORT_TITLE_KEYS: Record<string, TranslationKey> = {
  "Profit & Loss": "reportPnl",
  "Balance Sheet": "reportBalance",
  "Cash Flow Statement": "reportCashFlow",
  "Tax Summary": "reportTax",
};

export function ReportsTab() {
  const { tr } = useFinanceDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{tr("reports")}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {tr("reportsDesc")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reportSummaries.map((report) => (
          <SectionCard key={report.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  report.status === "Ready"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                )}
              >
                {tr(report.status === "Ready" ? "statusReady" : "statusDraft")}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">
                {tr(REPORT_TITLE_KEYS[report.title] ?? "reports")}
              </h3>
              <p className="text-sm text-neutral-500">{report.period}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {tr("updated")} {report.updated}
              </p>
            </div>
            <button
              type="button"
              disabled={report.status !== "Ready"}
              className="mt-auto inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              {tr("downloadPdf")}
            </button>
          </SectionCard>
        ))}
      </div>

      <SectionCard>
        <h3 className="font-semibold">{tr("customReport")}</h3>
        <p className="mt-1 text-sm text-neutral-500">{tr("customReportDesc")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="date"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
          <input
            type="date"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="button"
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            {tr("generate")}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
