export interface GoalListItem {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  progressPercentage: number;
  dueDate: string;
  status: string;
  suggestedMonthlyContribution: number;
  /** Hũ mà BE dùng để tính savedAmount (số dư hũ). */
  linkedJarId: string | null;
  linkedJarName: string | null;
}

export interface GoalDetail extends GoalListItem {
  daysRemaining: number;
  note?: string | null;
}

export interface CreateGoalPayload {
  title: string;
  targetAmount: number;
  dueDate: string;
  linkedJarId?: string | null;
  note?: string | null;
}

export interface UpdateGoalPayload {
  title?: string | null;
  targetAmount?: number | null;
  dueDate?: string | null;
  linkedJarId?: string | null;
  note?: string | null;
}

export interface CreateGoalResult {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  progressPercentage: number;
  status: string;
  dueDate: string;
}

export interface UpdateGoalResult {
  id: string;
  title: string;
  targetAmount: number;
  dueDate: string;
  status: string;
}
