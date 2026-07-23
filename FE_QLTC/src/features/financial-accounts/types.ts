export interface FinancialAccountItem {
  id: string;
  name: string;
  accountType: string;
  connectionMode: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
  providerName: string | null;
  maskedAccountNumber: string | null;
  syncStatus: string;
  lastSync: string | null;
}

export interface CreateManualFinancialAccountPayload {
  name: string;
  accountType: string;
  currentBalance: number;
  currency?: string;
  isDefault: boolean;
}

export interface CreateLinkApiFinancialAccountPayload {
  bankName: string;
  bankCode?: string | null;
  accountNumber: string;
  accountHolderName?: string | null;
  isDefault: boolean;
}

export interface ConnectSePayFinancialAccountPayload {
  providerCode: "SEPAY";
  bankCode: "VCB" | "MB" | "TCB";
  accountNumber: string;
  accountName: string;
}

export interface SePayConnectionStatus {
  connected: boolean;
  bank: string | null;
  lastSync: string | null;
  syncStatus: string;
}

export interface UpdateFinancialAccountPayload {
  name?: string | null;
  currentBalance?: number | null;
  isDefault?: boolean | null;
}
