export interface DashboardStat {
  label: string;
  value: string;
  hint?: string;
}

export interface DashboardTransaction {
  id: string;
  type: "Income" | "Expense";
  amount: number;
  note: string;
  transactionDate: string;
}

export interface DashboardTrendPoint {
  label: string;
  amount: number;
  count: number;
}

export interface DashboardRecentUser {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface DashboardSpendingCategory {
  label: string;
  value: number;
}

export interface DashboardRetentionPoint {
  periodLabel: string;
  cohortA: number;
  cohortB: number;
  cohortC: number;
  cohortD: number;
}

export interface DashboardSummary {
  stats: DashboardStat[];
  recentTransactions: DashboardTransaction[];
  transactionVolumeTrend: DashboardTrendPoint[];
  recentUsers: DashboardRecentUser[];
  topSpendingCategories: DashboardSpendingCategory[];
  retentionTrend: DashboardRetentionPoint[];
}
