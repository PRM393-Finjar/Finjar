import { BUDGET_METHOD } from "@/constants/onboarding";
import type { BudgetMethodId } from "@/constants/onboarding";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants";
import type { OnboardingForm } from "./schema";
import type { OnboardingCompleteResult, SuggestionRow } from "./types";

/**
 * Tên hũ khớp `Personal_Finance_Management.Service.Onboarding.Service`
 * (preview bước cuối; danh sách thật sau khi submit lấy từ GET /api/v1/jars).
 */
const PREVIEW_SIX_JAR_NAMES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Savings",
  "Essentials",
  "Entertainment",
] as const;

const PREVIEW_503020: readonly { name: string; percentage: number }[] = [
  { name: "Needs", percentage: 50 },
  { name: "Wants", percentage: 30 },
  { name: "Savings/Investments", percentage: 20 },
];

function toRequestBody(form: OnboardingForm) {
  const income = Number(form.monthlyIncome);
  return {
    monthlyIncome: Number.isFinite(income) ? Math.round(income) : 0,
    occupationType: form.occupation?.trim() ? form.occupation : null,
    financialGoalTypes: [...form.financialGoals],
    budgetMethodPreference: form.budgetingMethod ?? null,
    ageRange: form.ageRange?.trim() ? form.ageRange : null,
    spendingChallenges: [...form.spendingChallenges],
  };
}

/** Gợi ý trên form — tên & tỷ lệ khớp BE sẽ tạo (Custom: rỗng). */
export function getSuggestionRows(
  method: BudgetMethodId | null,
  monthlyIncomeVnd: number,
): SuggestionRow[] {
  if (!method || method === BUDGET_METHOD.CUSTOM) return [];

  const base = Number.isFinite(monthlyIncomeVnd) ? monthlyIncomeVnd : 0;

  if (method === BUDGET_METHOD.SIX_JARS) {
    const n = PREVIEW_SIX_JAR_NAMES.length;
    const pct = Math.round(100 / n);
    return PREVIEW_SIX_JAR_NAMES.map((name) => ({
      name,
      percentage: pct,
      icon: "•",
      monthlyAmount: Math.round((base * pct) / 100),
    }));
  }

  if (method === BUDGET_METHOD.RULE_503020) {
    return PREVIEW_503020.map((j) => ({
      name: j.name,
      percentage: j.percentage,
      icon: "•",
      monthlyAmount: Math.round((base * j.percentage) / 100),
    }));
  }

  return [];
}

export const onboardingService = {
  /** POST `/api/v1/onboarding` — BE tạo hũ (trừ Custom), categories, tài khoản Cash. */
  async complete(form: OnboardingForm): Promise<OnboardingCompleteResult> {
    const body = toRequestBody(form);
    const data = (await apiClient.post(
      API_ENDPOINT.ONBOARDING,
      body,
    )) as OnboardingCompleteResult;
    return data;
  },
};
