import { z } from "zod";
import { BUDGET_METHOD } from "@/constants/onboarding";

const budgetMethodEnum = z.enum([
  BUDGET_METHOD.SIX_JARS,
  BUDGET_METHOD.RULE_503020,
  BUDGET_METHOD.CUSTOM,
]);

export const onboardingFormSchema = z.object({
  monthlyIncome: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n > 0, "Thu nhập phải lớn hơn 0"),
  occupation: z.string().min(1, "Chọn nghề nghiệp"),
  ageRange: z.string().min(1, "Chọn độ tuổi"),
  financialGoals: z
    .array(z.string())
    .min(1, "Chọn ít nhất một mục tiêu tài chính"),
  spendingChallenges: z
    .array(z.string())
    .min(1, "Chọn ít nhất một thách thức chi tiêu"),
  budgetingMethod: budgetMethodEnum
    .nullable()
    .refine((v) => v !== null, { message: "Chọn phương pháp ngân sách" }),
});

export type OnboardingFormValues = z.input<typeof onboardingFormSchema>;

export type OnboardingFormOutput = z.output<typeof onboardingFormSchema>;

export const onboardingStep1Schema = onboardingFormSchema.pick({
  monthlyIncome: true,
  occupation: true,
  ageRange: true,
});

export const onboardingStep2Schema = onboardingFormSchema.pick({
  financialGoals: true,
  spendingChallenges: true,
});

export const onboardingStep3Schema = onboardingFormSchema.pick({
  budgetingMethod: true,
});

export const onboardingDefaultValues: OnboardingFormValues = {
  monthlyIncome: 15_000_000,
  occupation: "",
  ageRange: "",
  financialGoals: [],
  spendingChallenges: [],
  budgetingMethod: null,
};

/** Alias cho service / import cũ */
export type OnboardingForm = OnboardingFormOutput;
