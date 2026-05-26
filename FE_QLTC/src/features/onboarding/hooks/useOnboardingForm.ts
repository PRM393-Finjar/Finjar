import { useCallback, useState } from "react";
import { useForm, type FieldPath, type FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { useAuthStore } from "@/features/auth/store";
import { profileService } from "@/features/profile/services";
import { currentUserQueryKey } from "@/features/profile/hooks/useCurrentUser";
import { ROUTES } from "@/shared/constants/routes";
import type { UserRole } from "@/shared/types";
import { ONBOARDING_UI } from "@/constants/onboarding";
import { onboardingService } from "../services";
import {
  onboardingDefaultValues,
  onboardingFormSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  type OnboardingFormValues,
} from "../schema";

export const ONBOARDING_TOTAL_STEPS = 4;

function appRoleFromApiRole(apiRole: string): UserRole {
  const r = apiRole.trim().toLowerCase();
  return r.includes("admin") ? "admin" : "user";
}

function applyZodIssues<T extends FieldValues>(
  issues: z.ZodIssue[],
  setError: (name: FieldPath<T>, error: { message: string }) => void,
) {
  for (const issue of issues) {
    if (issue.path.length === 0) continue;
    const path = issue.path.map(String).join(".") as FieldPath<T>;
    setError(path, { message: issue.message });
  }
}

export function useOnboardingForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { mutateAsync: completeOnboarding, isPending: submitting } =
    useMutation({
      mutationKey: ["onboarding", "complete"],
      mutationFn: onboardingService.complete,
    });

  const form = useForm<OnboardingFormValues>({
    defaultValues: onboardingDefaultValues,
  });

  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const goNext = useCallback(() => {
    const values = form.getValues();
    const schemas = [
      onboardingStep1Schema,
      onboardingStep2Schema,
      onboardingStep3Schema,
    ] as const;
    const schema = schemas[step - 1];
    if (!schema) {
      setStep((s) => s + 1);
      return;
    }

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      form.clearErrors();
      applyZodIssues(parsed.error.issues, form.setError);
      return;
    }

    setStep((s) => s + 1);
  }, [form, step]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const submit = useCallback(async () => {
    setSubmitError(null);
    const parsed = onboardingFormSchema.safeParse(form.getValues());
    if (!parsed.success) {
      form.clearErrors();
      applyZodIssues(parsed.error.issues, form.setError);
      return;
    }

    try {
      await completeOnboarding({
        monthlyIncome: parsed.data.monthlyIncome,
        occupation: parsed.data.occupation,
        ageRange: parsed.data.ageRange,
        financialGoals: parsed.data.financialGoals,
        spendingChallenges: parsed.data.spendingChallenges,
        budgetingMethod: parsed.data.budgetingMethod,
      });
      const prev = useAuthStore.getState();
      if (prev.accessToken && prev.user) {
        try {
          const me = await profileService.getMe();
          setAuth({
            accessToken: prev.accessToken,
            role: prev.role ?? appRoleFromApiRole(prev.user.role),
            user: {
              id: me.id,
              username: me.username,
              firstName: me.firstName,
              lastName: me.lastName,
              email: me.email,
              role: prev.user.role,
              isOnboardingCompleted: me.isOnboardingCompleted,
            },
          });
        } catch {
          setAuth({
            accessToken: prev.accessToken,
            role: prev.role ?? appRoleFromApiRole(prev.user.role),
            user: { ...prev.user, isOnboardingCompleted: true },
          });
        }
      }
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["user"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["jars"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const maybe = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        maybe?.response?.data?.message ||
        maybe?.message ||
        ONBOARDING_UI.submitError;
      setSubmitError(String(msg));
    }
  }, [form, navigate, queryClient, setAuth, completeOnboarding]);

  return {
    form,
    step,
    goNext,
    goBack,
    submit,
    submitting,
    submitError,
    totalSteps: ONBOARDING_TOTAL_STEPS,
  };
}
