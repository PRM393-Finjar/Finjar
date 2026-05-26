import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  BudgetLimit,
  CreateBudgetLimitPayload,
  UpdateBudgetLimitPayload,
} from "./types";

function strId(v: unknown): string {
  return String(v ?? "");
}

function normalizeLimitRow(raw: Record<string, unknown>): BudgetLimit {
  const tt = String(raw.targetType ?? "Jar");
  return {
    id: strId(raw.id),
    targetType: tt === "Category" ? "Category" : "Jar",
    targetId: strId(raw.targetId),
    targetName: String(raw.targetName ?? ""),
    limitAmount: Number(raw.limitAmount ?? 0),
    period: String(raw.period ?? ""),
    alertAtPercentage: Number(raw.alertAtPercentage ?? 0),
    currentSpent: Number(raw.currentSpent ?? 0),
    currentPercentage: Number(raw.currentPercentage ?? 0),
    status: String(raw.status ?? ""),
  };
}

export const budgetService = {
  async list(): Promise<BudgetLimit[]> {
    const raw = await apiClient.get(API_ENDPOINT.LIMITS);
    const rows = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)
        ? (raw as { data: Record<string, unknown>[] }).data
        : [];
    return rows.map((r) => normalizeLimitRow(r as Record<string, unknown>));
  },

  async create(payload: CreateBudgetLimitPayload): Promise<void> {
    await apiClient.post(API_ENDPOINT.LIMITS, {
      targetType: payload.targetType,
      targetId: payload.targetId,
      limitAmount: payload.limitAmount,
      period: payload.period,
      alertAtPercentage: payload.alertAtPercentage,
    });
  },

  async update(id: string, payload: UpdateBudgetLimitPayload): Promise<void> {
    await apiClient.patch(`${API_ENDPOINT.LIMITS}/${id}`, payload);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINT.LIMITS}/${id}`);
  },
};
