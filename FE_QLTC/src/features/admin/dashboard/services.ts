import { apiClient } from "@/lib/axios";
import { mockData } from "@/lib/mockData";
import {
  requestWithStrategy,
  type RequestMode,
  wait,
} from "@/lib/requestStrategy";
import type {
  DashboardRecentUser,
  DashboardSummary,
  DashboardTransaction,
} from "./types";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";

const DASHBOARD_STRATEGY = {
  adminSummary: "mock" as RequestMode,
} as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const toTransaction = (
  item: (typeof mockData.tables.transactions)[number],
): DashboardTransaction => ({
  id: item.id,
  type: item.type,
  amount: item.amount,
  note: item.note ?? "",
  transactionDate: item.transaction_date,
});

const toRecentUser = (
  item: (typeof mockData.tables.accounts)[number],
): DashboardRecentUser => ({
  id: item.id,
  fullName: item.full_name,
  email: item.email,
  status: item.status,
  createdAt: item.created_at,
});

export const adminDashboardService = {
  async getAdminSummary(): Promise<DashboardSummary> {
    const realRequest = () =>
      apiClient.get<DashboardSummary>(
        API_ENDPOINT.ADMIN.DASHBOARD,
      ) as unknown as Promise<DashboardSummary>;

    const mockRequest = async () => {
      await wait(200);

      const totalUsers = mockData.tables.accounts.length;
      const activeUsers = mockData.tables.accounts.filter(
        (account) => account.status === "Active",
      ).length;
      const bannedUsers = mockData.tables.accounts.filter(
        (account) => String(account.status).toLowerCase() === "banned",
      ).length;
      const totalTransactions = 200;
      const totalTransactionAmount = 100_000_000;

      const previousUsers = Math.max(1, totalUsers - 1);
      const userGrowthPercent = Math.round(
        ((totalUsers - previousUsers) / previousUsers) * 100,
      );

      const dau = Math.max(1, Math.round(activeUsers * 0.58));
      const mau = Math.max(dau, activeUsers);
      const engagementPercent = Math.round((dau / mau) * 100);

      const syncErrorRate = 0.02;
      const healthStatus =
        syncErrorRate <= 0.1
          ? "Tốt"
          : syncErrorRate <= 1
            ? "Cảnh báo"
            : "Nghiêm trọng";

      return {
        stats: [
          {
            label: "Tổng người dùng",
            value: `${totalUsers}`,
            hint: `+${userGrowthPercent}% so với kỳ trước`,
          },
          {
            label: "Tương tác (DAU/MAU)",
            value: `${dau} / ${mau}`,
            hint: `${engagementPercent}% mức gắn kết`,
          },
          {
            label: "Tổng giá trị giao dịch",
            value: formatCurrency(totalTransactionAmount),
            hint: `${totalTransactions} giao dịch trong kỳ`,
          },
          {
            label: "Sức khỏe hệ thống",
            value: `${syncErrorRate}%`,
            hint: `${healthStatus} • ${bannedUsers} tài khoản bị khóa`,
          },
        ],
        transactionVolumeTrend: [
          { label: "T2", amount: 14_000_000, count: 28 },
          { label: "T3", amount: 12_000_000, count: 24 },
          { label: "T4", amount: 16_000_000, count: 32 },
          { label: "T5", amount: 13_000_000, count: 26 },
          { label: "T6", amount: 17_000_000, count: 34 },
          { label: "T7", amount: 12_000_000, count: 24 },
          { label: "CN", amount: 16_000_000, count: 32 },
        ],
        recentTransactions: mockData.tables.transactions
          .slice(0, 5)
          .map(toTransaction),
        recentUsers: [...mockData.tables.accounts]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 5)
          .map(toRecentUser),
        topSpendingCategories: [
          { label: "Ăn uống", value: 32_000_000 },
          { label: "Mua sắm", value: 24_000_000 },
          { label: "Di chuyển", value: 18_000_000 },
          { label: "Giải trí", value: 14_000_000 },
          { label: "Khác", value: 12_000_000 },
        ],
        retentionTrend: [
          {
            periodLabel: "D0",
            cohortA: 100,
            cohortB: 100,
            cohortC: 100,
            cohortD: 100,
          },
          {
            periodLabel: "D7",
            cohortA: 76,
            cohortB: 72,
            cohortC: 68,
            cohortD: 64,
          },
          {
            periodLabel: "D14",
            cohortA: 66,
            cohortB: 61,
            cohortC: 57,
            cohortD: 53,
          },
          {
            periodLabel: "D21",
            cohortA: 59,
            cohortB: 55,
            cohortC: 51,
            cohortD: 47,
          },
          {
            periodLabel: "D30",
            cohortA: 52,
            cohortB: 48,
            cohortC: 44,
            cohortD: 40,
          },
        ],
      };
    };

    return requestWithStrategy(
      DASHBOARD_STRATEGY.adminSummary,
      realRequest,
      mockRequest,
    );
  },
};
