import axios from "axios";
import { apiClient } from "@/lib/axios";
import { env } from "@/lib/env";
import { type RequestMode, wait } from "@/lib/requestStrategy";
import { API_ENDPOINT } from "@/shared/constants";
import { buildMockUserDashboard } from "./mockDashboard";
import type { UserDashboardData } from "./types";

const DASHBOARD_STRATEGY = {
  userDashboard: (import.meta.env.VITE_DASHBOARD_MODE ?? "real") as RequestMode,
} as const;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function strId(v: unknown): string {
  return String(v ?? "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function pick(obj: Record<string, unknown>, camel: string, pascal: string) {
  return obj[camel] ?? obj[pascal];
}

function unwrapDashboardPayload(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  if (pick(root, "balanceSummary", "BalanceSummary")) return root;
  const data = root.data ?? root.Data;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return root;
}

function normalizeDashboard(raw: unknown): UserDashboardData {
  const r = unwrapDashboardPayload(raw);
  const bs = asRecord(pick(r, "balanceSummary", "BalanceSummary"));

  const balanceSummary = {
    totalBalance: num(pick(bs, "totalBalance", "TotalBalance")),
    allocatedBalance: num(pick(bs, "allocatedBalance", "AllocatedBalance")),
    unallocatedBalance: num(
      pick(bs, "unallocatedBalance", "UnallocatedBalance"),
    ),
    totalIncome: num(pick(bs, "totalIncome", "TotalIncome")),
    totalExpense: num(pick(bs, "totalExpense", "TotalExpense")),
    netChange: num(pick(bs, "netChange", "NetChange")),
  };

  const financialAccounts = (
    (pick(r, "financialAccounts", "FinancialAccounts") as unknown[]) ?? []
  ).map((x) => {
    const a = asRecord(x);
    return {
      id: strId(a.id ?? a.Id),
      name: String(a.name ?? a.Name ?? ""),
      currentBalance: num(a.currentBalance ?? a.CurrentBalance),
      isDefault: Boolean(a.isDefault ?? a.IsDefault),
    };
  });

  const jarSummary = (
    (pick(r, "jarSummary", "JarSummary") as unknown[]) ?? []
  ).map((x) => {
    const j = asRecord(x);
    return {
      jarId: strId(j.jarId ?? j.JarId),
      jarName: String(j.jarName ?? j.JarName ?? ""),
      balance: num(j.balance ?? j.Balance),
      spent: num(j.spent ?? j.Spent),
      spentPercentage: num(j.spentPercentage ?? j.SpentPercentage),
    };
  });

  const categoryBreakdown = (
    (pick(r, "categoryBreakdown", "CategoryBreakdown") as unknown[]) ?? []
  ).map((x) => {
    const c = asRecord(x);
    return {
      categoryId: strId(c.categoryId ?? c.CategoryId),
      categoryName: String(c.categoryName ?? c.CategoryName ?? ""),
      totalAmount: num(c.totalAmount ?? c.TotalAmount),
      percentage: num(c.percentage ?? c.Percentage),
    };
  });

  const recentTransactions = (
    (pick(r, "recentTransactions", "RecentTransactions") as unknown[]) ?? []
  ).map((x) => {
    const t = asRecord(x);
    const d = t.date ?? t.Date ?? t.transactionDate ?? t.TransactionDate;
    return {
      id: strId(t.id ?? t.Id),
      type: String(t.type ?? t.Type ?? ""),
      transactionsAmount: num(
        t.transactionsAmount ?? t.TransactionsAmount ?? t.amount ?? t.Amount,
      ),
      note:
        t.note != null || t.Note != null
          ? String(t.note ?? t.Note)
          : null,
      date:
        typeof d === "string"
          ? d
          : d instanceof Date
            ? d.toISOString()
            : String(d ?? ""),
    };
  });

  const goalProgress = (
    (pick(r, "goalProgress", "GoalProgress") as unknown[]) ?? []
  ).map((x) => {
    const g = asRecord(x);
    return {
      goalId: strId(g.goalId ?? g.GoalId),
      title: String(g.title ?? g.Title ?? ""),
      progressPercentage: num(
        g.progressPercentage ?? g.ProgressPercentage,
      ),
      daysRemaining: num(g.daysRemaining ?? g.DaysRemaining),
    };
  });

  return {
    balanceSummary,
    financialAccounts,
    jarSummary,
    categoryBreakdown,
    recentTransactions,
    goalProgress,
  };
}

function isApiUnreachable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.response.status >= 502;
}

export function getDashboardErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Không kết nối được API (${env.API_URL}). Hãy chạy backend và kiểm tra VITE_API_LOCAL_URL trong file .env.`;
    }
    if (error.response.status === 401) {
      return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    }
    const body = error.response.data;
    if (body && typeof body === "object" && "message" in body) {
      return String((body as { message: unknown }).message);
    }
    return `API trả lỗi ${error.response.status}.`;
  }
  if (error instanceof Error) return error.message;
  return "Không tải được dữ liệu tổng quan.";
}

export const userDashboardService = {
  async getDashboard(): Promise<UserDashboardData> {
    const realRequest = async () => {
      const raw = await apiClient.get(API_ENDPOINT.USER_DASHBOARD);
      return normalizeDashboard(raw);
    };

    const mockRequest = async () => {
      await wait(200);
      return buildMockUserDashboard();
    };

    if (DASHBOARD_STRATEGY.userDashboard === "mock") {
      return mockRequest();
    }

    try {
      return await realRequest();
    } catch (error) {
      if (import.meta.env.DEV && isApiUnreachable(error)) {
        console.warn(
          "[dashboard] API không khả dụng — dùng dữ liệu demo trong môi trường dev.",
          error,
        );
        return mockRequest();
      }
      throw error;
    }
  },
};
