import { mockData } from "@/lib/mockData";
import type { UserDashboardData } from "./types";

export function buildMockUserDashboard(): UserDashboardData {
  const accounts = mockData.tables.financial_accounts;
  const jars = mockData.tables.jars;
  const categories = mockData.tables.categories;
  const transactions = mockData.tables.transactions.filter((t) => !t.is_deleted);
  const goals = mockData.tables.goals;

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const allocatedBalance = jars.reduce((sum, j) => sum + j.balance, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "Expense" || !tx.category_id) continue;
    expenseByCategory.set(
      tx.category_id,
      (expenseByCategory.get(tx.category_id) ?? 0) + tx.amount,
    );
  }
  const totalCategorySpend = Array.from(expenseByCategory.values()).reduce(
    (a, b) => a + b,
    0,
  );

  return {
    balanceSummary: {
      totalBalance,
      allocatedBalance,
      unallocatedBalance: Math.max(0, totalBalance - allocatedBalance),
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
    },
    financialAccounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currentBalance: a.current_balance,
      isDefault: a.is_default,
    })),
    jarSummary: jars.map((j) => {
      const spent = transactions
        .filter((t) => t.jar_id === j.id && t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const limit = mockData.tables.spending_limits.find(
        (l) => l.jar_id === j.id,
      )?.limit_amount;
      const spentPercentage =
        limit && limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        jarId: j.id,
        jarName: j.name,
        balance: j.balance,
        spent,
        spentPercentage,
      };
    }),
    categoryBreakdown: Array.from(expenseByCategory.entries()).map(
      ([categoryId, totalAmount]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          categoryName: cat?.name ?? "Khác",
          totalAmount,
          percentage:
            totalCategorySpend > 0
              ? Math.round((totalAmount / totalCategorySpend) * 100)
              : 0,
        };
      },
    ),
    recentTransactions: [...transactions]
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime(),
      )
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        type: t.type,
        transactionsAmount: t.amount,
        note: t.note,
        source: "Manual",
        date: t.transaction_date,
      })),
    goalProgress: goals.map((g) => {
      const progress =
        g.target_amount > 0
          ? Math.round((g.saved_amount / g.target_amount) * 100)
          : 0;
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(g.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      );
      return {
        goalId: g.id,
        title: g.title,
        progressPercentage: progress,
        daysRemaining,
      };
    }),
  };
}
