/**
 * Ambient types for the JS-implemented onboarding constants module.
 * Keeps TS happy without touching the runtime .js file.
 */

export type BudgetMethodId = "SixJars" | "Rule503020" | "Custom";

export const BUDGET_METHOD: {
  readonly SIX_JARS: "SixJars";
  readonly RULE_503020: "Rule503020";
  readonly CUSTOM: "Custom";
};

export interface Option<V extends string = string> {
  value: V;
  label: string;
}

export const OCCUPATION_OPTIONS: Option[];
export const AGE_RANGE_OPTIONS: Option[];
export const FINANCIAL_GOAL_OPTIONS: Option[];
export const SPENDING_CHALLENGE_OPTIONS: Option[];

export interface MethodCard {
  id: BudgetMethodId;
  title: string;
  short: string;
  description: string;
}
export const METHOD_CARDS: MethodCard[];

export const BUDGET_METHOD_LABEL: Record<BudgetMethodId, string>;
export const BUDGET_METHOD_DESC: Record<BudgetMethodId, string>;

export const ONBOARDING_UI: {
  pageTitle: string;
  stepLabel: (n: number, total: number) => string;
  back: string;
  next: string;
  reviewSubmit: string;
  submitError: string;
  reviewTitle: string;
  monthlyIncome: string;
  occupation: string;
  ageRange: string;
  financialGoals: string;
  challenges: string;
  methodTitle: string;
};
