export interface BudgetLimit {
  id: string;
  targetType: "Jar" | "Category";
  targetId: string;
  targetName: string;
  limitAmount: number;
  period: string;
  alertAtPercentage: number;
  currentSpent: number;
  currentPercentage: number;
  status: string;
}

export interface CreateBudgetLimitPayload {
  targetType: "Jar" | "Category";
  targetId: string;
  limitAmount: number;
  period: "Daily" | "Monthly";
  alertAtPercentage: number;
}

export interface UpdateBudgetLimitPayload {
  limitAmount?: number;
  alertAtPercentage?: number;
}
