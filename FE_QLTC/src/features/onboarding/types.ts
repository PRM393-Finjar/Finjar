export interface SuggestionRow {
  name: string;
  percentage: number;
  icon: string;
  monthlyAmount: number;
}

/** Response POST `/api/v1/onboarding` (camelCase từ BE). */
export interface OnboardingCompleteResult {
  recommendedMethod: string;
  recommendedCategories: { name: string; icon: string }[];
  recommendedJars: { name: string }[] | null;
  defaultFinancialAccount: { name: string; accountType: string };
}
