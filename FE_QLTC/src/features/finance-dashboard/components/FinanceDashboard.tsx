import { cn } from "@/lib/utils";
import type { UserDashboardData } from "@/features/dashboard/types";
import "../finance-dashboard.css";
import {
  FinanceDashboardProvider,
} from "../context/FinanceDashboardContext";
import { FinanceTopBar } from "./FinanceTopBar";
import { OverviewTab } from "./tabs/OverviewTab";

type FinanceDashboardInnerProps = {
  embedded?: boolean;
};

function FinanceDashboardInner({ embedded = false }: FinanceDashboardInnerProps) {
  return (
    <div className={cn("brutal-dashboard min-h-full", embedded && "min-h-0")}>
      <FinanceTopBar embedded={embedded} brandName={embedded ? "FinJar" : undefined} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OverviewTab />
      </main>
    </div>
  );
}

type FinanceDashboardProps = {
  embedded?: boolean;
  dashboardData?: UserDashboardData | null;
};

export function FinanceDashboard({
  embedded = false,
  dashboardData = null,
}: FinanceDashboardProps) {
  return (
    <FinanceDashboardProvider dashboardData={dashboardData}>
      <FinanceDashboardInner embedded={embedded} />
    </FinanceDashboardProvider>
  );
}
