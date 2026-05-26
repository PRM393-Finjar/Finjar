import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ROUTES } from "@/shared/constants/routes";
import {
  AGE_RANGE_OPTIONS,
  BUDGET_METHOD,
  FINANCIAL_GOAL_OPTIONS,
  METHOD_CARDS,
  OCCUPATION_OPTIONS,
  ONBOARDING_UI,
  SPENDING_CHALLENGE_OPTIONS,
} from "@/constants/onboarding";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSuggestionRows } from "../services";
import { useOnboardingForm } from "../hooks/useOnboardingForm";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const formatVnd = (amount: number) => vndFormatter.format(amount);

const inputClass =
  "mt-1.5 w-full rounded-lg border-2 border-neutral-900 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#a8e087]";

function toggleInList<T>(list: T[], value: T): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

/** Chỉ tài khoản user (không phải admin) lần đầu (`isOnboardingCompleted === false`) dùng trang này. */
export function OnboardingPage() {
  const { user, isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }
  if (user?.isOnboardingCompleted === true) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <OnboardingWizard />;
}

function OnboardingWizard() {
  const {
    form,
    step,
    goNext,
    goBack,
    submit,
    submitting,
    submitError,
    totalSteps,
  } = useOnboardingForm();

  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const incomeRaw = watch("monthlyIncome");
  const incomeNumber =
    typeof incomeRaw === "number" && !Number.isNaN(incomeRaw) ? incomeRaw : 0;
  const budgetingMethod = watch("budgetingMethod");

  const suggestionRows = useMemo(
    () => getSuggestionRows(budgetingMethod, incomeNumber),
    [budgetingMethod, incomeNumber],
  );

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#eef1fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border-2 border-neutral-900 bg-[#f4f4f5] p-3 md:p-4">
          <div className="rounded-xl border border-neutral-900 bg-[#f3f6ff] px-4 py-6 md:px-8 md:py-8">
            <p className="text-xs font-medium text-neutral-900">
              {ONBOARDING_UI.stepLabel(step, totalSteps)} — {ONBOARDING_UI.pageTitle}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0f172a]">
              Khởi tạo tài chính cá nhân
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vài bước ngắn để cá nhân hóa trải nghiệm trong app.
            </p>
            {submitError ? (
              <p className="mt-2 text-xs text-red-600">{submitError}</p>
            ) : null}

            <div className="mb-6 mt-5 flex flex-wrap items-center justify-between gap-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={`h-1.5 min-w-16 flex-1 rounded-full ${
                    n <= step ? "bg-[#a8e087] text-[#0a0a0a]" : "bg-slate-200"
                  } ${n < totalSteps ? "mr-1" : ""}`}
                />
              ))}
            </div>

            {step === 1 && (
              <Card className="mb-4 border border-neutral-900 bg-white/80 shadow-none">
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-base font-semibold text-[#0f172a]">
                    Thông tin cơ bản
                  </h2>
                  <p className="text-sm text-slate-600">
                    Nhập thu nhập và tình hình công việc.
                  </p>
                  <div className="mt-3.5 flex flex-col gap-3">
                    <label className="block text-sm font-medium text-slate-700">
                      {ONBOARDING_UI.monthlyIncome}
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        {...register("monthlyIncome", { valueAsNumber: true })}
                      />
                      {errors.monthlyIncome ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {errors.monthlyIncome.message}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-xs text-slate-500">
                        {formatVnd(incomeNumber)}
                      </span>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      {ONBOARDING_UI.occupation}
                      <select className={inputClass} {...register("occupation")}>
                        <option value="">-- Chọn --</option>
                        {OCCUPATION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {errors.occupation ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {errors.occupation.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      {ONBOARDING_UI.ageRange}
                      <select className={inputClass} {...register("ageRange")}>
                        <option value="">-- Chọn --</option>
                        {AGE_RANGE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {errors.ageRange ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {errors.ageRange.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="mb-4 border border-neutral-900 bg-white/80 shadow-none">
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-base font-semibold text-[#0f172a]">
                    {ONBOARDING_UI.financialGoals}
                  </h2>
                  <Controller
                    name="financialGoals"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        {FINANCIAL_GOAL_OPTIONS.map((g) => (
                          <label
                            key={g.value}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(g.value)}
                              onChange={() =>
                                field.onChange(toggleInList(field.value, g.value))
                              }
                              className="h-4 w-4 accent-[#a8e087]"
                            />
                            {g.label}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.financialGoals ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.financialGoals.message}
                    </p>
                  ) : null}

                  <h2 className="mt-5 mb-3 text-base font-semibold text-[#0f172a]">
                    {ONBOARDING_UI.challenges}
                  </h2>
                  <Controller
                    name="spendingChallenges"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        {SPENDING_CHALLENGE_OPTIONS.map((g) => (
                          <label
                            key={g.value}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(g.value)}
                              onChange={() =>
                                field.onChange(toggleInList(field.value, g.value))
                              }
                              className="h-4 w-4 accent-[#a8e087]"
                            />
                            {g.label}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.spendingChallenges ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.spendingChallenges.message}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="mb-4 border border-neutral-900 bg-white/80 shadow-none">
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-base font-semibold text-[#0f172a]">
                    {ONBOARDING_UI.methodTitle}
                  </h2>
                  <Controller
                    name="budgetingMethod"
                    control={control}
                    render={({ field }) => (
                      <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                        {METHOD_CARDS.map((m) => {
                          const active = field.value === m.id;
                          return (
                            <button
                              type="button"
                              key={m.id}
                              onClick={() => field.onChange(m.id)}
                              className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
                                active
                                  ? "border-2 border-neutral-900 bg-[#a5a6f6]/40"
                                  : "border border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-sm font-semibold text-neutral-900">
                                {m.title}
                              </div>
                              <p className="mt-2 text-xs text-slate-600">
                                {m.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.budgetingMethod ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.budgetingMethod.message}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="mb-4 border border-neutral-900 bg-white/80 shadow-none">
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-base font-semibold text-[#0f172a]">
                    {budgetingMethod === BUDGET_METHOD.CUSTOM
                      ? "Bạn chọn tùy chỉnh hũ"
                      : ONBOARDING_UI.reviewTitle}
                  </h2>
                  {budgetingMethod === BUDGET_METHOD.CUSTOM ? (
                    <p className="text-sm text-slate-600">
                      Bạn có thể cấu hình chi tiết ở trang hũ sau bước này.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2.5 p-0">
                      {suggestionRows.map((j) => (
                        <li
                          key={j.name}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <span aria-hidden>{j.icon}</span> {j.name} —{" "}
                            {j.percentage}%
                          </span>
                          <span className="font-semibold text-neutral-900">
                            {formatVnd(j.monthlyAmount)}/tháng
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2.5 text-xs text-slate-500">
                    Từ thu nhập:{" "}
                    <strong className="text-[#0f172a]">
                      {formatVnd(incomeNumber)}
                    </strong>{" "}
                    / tháng
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={submitting}
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    {ONBOARDING_UI.back}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < totalSteps && (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="brutal-btn-primary cursor-pointer"
                  >
                    {ONBOARDING_UI.next}
                  </Button>
                )}
                {step === totalSteps && (
                  <Button
                    type="button"
                    onClick={() => void submit()}
                    disabled={submitting}
                    className="brutal-btn-primary cursor-pointer"
                  >
                    {submitting ? "Đang lưu…" : ONBOARDING_UI.reviewSubmit}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
