import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  ConnectSePayFinancialAccountPayload,
  CreateLinkApiFinancialAccountPayload,
  CreateManualFinancialAccountPayload,
  FinancialAccountItem,
  SePayConnectionStatus,
  UpdateFinancialAccountPayload,
} from "./types";

const BASE = API_ENDPOINT.FINANCIAL_ACCOUNT;

function strId(v: unknown): string {
  return String(v ?? "");
}

function optStr(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

function normalizeRow(raw: Record<string, unknown>): FinancialAccountItem {
  return {
    id: strId(raw.id),
    name: String(raw.name ?? ""),
    accountType: String(raw.accountType ?? ""),
    connectionMode: String(raw.connectionMode ?? ""),
    currency: String(raw.currency ?? "VND"),
    currentBalance: Number(raw.currentBalance ?? 0),
    isActive: Boolean(raw.isActive),
    isDefault: Boolean(raw.isDefault),
    providerName: optStr(raw.providerName),
    maskedAccountNumber: optStr(raw.maskedAccountNumber),
    lastSync: optStr(raw.lastSync),
    syncStatus: String(raw.syncStatus ?? "—"),
  };
}

function asRowArray(raw: unknown): FinancialAccountItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((x) => normalizeRow(x as Record<string, unknown>));
}

export const financialAccountService = {
  /** GET — axios có thể đã unwrap `{ data: [...] }` thành mảng. */
  async list(): Promise<FinancialAccountItem[]> {
    const raw = await apiClient.get(BASE);
    if (Array.isArray(raw)) {
      return asRowArray(raw);
    }
    if (raw && typeof raw === "object" && "data" in raw) {
      return asRowArray((raw as { data: unknown }).data);
    }
    return [];
  },

  async createManual(
    payload: CreateManualFinancialAccountPayload,
  ): Promise<void> {
    await apiClient.post(`${BASE}/Manual`, {
      name: payload.name.trim(),
      accountType: payload.accountType,
      currentBalance: payload.currentBalance,
      currency: payload.currency ?? "VND",
      isDefault: payload.isDefault,
    });
  },

  async createLinkApi(
    payload: CreateLinkApiFinancialAccountPayload,
  ): Promise<void> {
    await apiClient.post(`${BASE}/LinkApi`, {
      bankName: payload.bankName.trim(),
      bankCode: payload.bankCode?.trim() || null,
      accountNumber: payload.accountNumber.trim(),
      accountHolderName: payload.accountHolderName?.trim() || null,
      isDefault: payload.isDefault,
    });
  },

  async connectSePay(
    payload: ConnectSePayFinancialAccountPayload,
  ): Promise<void> {
    await apiClient.post(`${BASE}/sepay/connect`, {
      providerCode: payload.providerCode,
      bankCode: payload.bankCode,
      accountNumber: payload.accountNumber.trim(),
      accountName: payload.accountName.trim(),
      sepayApiKey: payload.sepayApiKey.trim(),
      ...(payload.currentBalance !== undefined
        ? { currentBalance: payload.currentBalance }
        : {}),
    });
  },

  async getSePayStatus(): Promise<SePayConnectionStatus> {
    const raw = (await apiClient.get(`${BASE}/sepay/status`)) as Record<
      string,
      unknown
    >;
    return {
      connected: Boolean(raw.connected),
      bank: optStr(raw.bank),
      lastSync: optStr(raw.lastSync),
      syncStatus: String(raw.syncStatus ?? "Disconnected"),
    };
  },

  async update(
    id: string,
    payload: UpdateFinancialAccountPayload,
  ): Promise<void> {
    const body: Record<string, string | number | boolean> = {};
    if (payload.name !== undefined && payload.name !== null) {
      body.name = payload.name;
    }
    if (
      payload.currentBalance !== undefined &&
      payload.currentBalance !== null
    ) {
      body.currentBalance = payload.currentBalance;
    }
    if (payload.isDefault !== undefined && payload.isDefault !== null) {
      body.isDefault = payload.isDefault;
    }
    await apiClient.patch(`${BASE}/${id}`, body);
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
