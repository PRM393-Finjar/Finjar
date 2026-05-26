export interface BalanceSummary {
  totalBalance: number;
  allocatedBalance: number;
  unallocatedBalance: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
}

export interface DashboardFinancialAccount {
  id: string;
  name: string;
  currentBalance: number;
  isDefault: boolean;
}

export interface DashboardJarSummary {
  jarId: string;
  jarName: string;
  balance: number;
  spent: number;
  spentPercentage: number;
}

export interface DashboardCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface DashboardRecentTransaction {
  id: string;
  type: string;
  transactionsAmount: number;
  note: string | null;
  date: string;
}

export interface DashboardGoalProgress {
  goalId: string;
  title: string;
  progressPercentage: number;
  daysRemaining: number;
}

export interface UserDashboardData {
  balanceSummary: BalanceSummary;
  financialAccounts: DashboardFinancialAccount[];
  jarSummary: DashboardJarSummary[];
  categoryBreakdown: DashboardCategoryBreakdown[];
  recentTransactions: DashboardRecentTransaction[];
  goalProgress: DashboardGoalProgress[];
}
