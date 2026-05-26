import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  ConfirmImportPayload,
  ConfirmImportResult,
  ImportDraftResult,
  ImportImageResult,
  UpdateImportDraftPayload,
  UploadReceiptOptions,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function unwrapImportResult<T>(raw: unknown): T {
  const obj = asRecord(raw);
  if ("body" in obj) return obj.body as T;
  if ("data" in obj && Object.keys(obj).length === 1) return obj.data as T;
  return raw as T;
}

function normalizeDraft(raw: unknown): ImportDraftResult {
  const obj = asRecord(raw);
  return {
    id: obj.id == null ? null : String(obj.id),
    transactionDate: obj.transactionDate == null ? null : String(obj.transactionDate),
    amount: obj.amount == null ? null : Number(obj.amount),
    type: obj.type == null ? null : String(obj.type),
    editedNote: obj.editedNote == null ? null : String(obj.editedNote),
    editedCategoryId: obj.editedCategoryId == null ? null : String(obj.editedCategoryId),
    editedJarId: obj.editedJarId == null ? null : String(obj.editedJarId),
    isValid: typeof obj.isValid === "boolean" ? obj.isValid : undefined,
    validationError: obj.validationError == null ? null : String(obj.validationError),
  };
}

export const importService = {
  async uploadReceiptImage(
    file: File,
    options?: UploadReceiptOptions,
  ): Promise<ImportImageResult> {
    const fd = new FormData();
    fd.append("file", file);
    if (options?.financialAccountId) {
      fd.append("financialAccountId", options.financialAccountId);
    }
    if (options?.bankCode) {
      fd.append("bankCode", options.bankCode);
    }
    if (options?.layout != null) {
      fd.append("layout", options.layout);
    } else {
      fd.append("layout", "invoice");
    }
    fd.append("runOcr", String(options?.runOcr ?? true));
    fd.append("includeDebug", String(options?.includeDebug ?? false));

    const raw = await apiClient.post(API_ENDPOINT.IMPORTS.IMAGE, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapImportResult<ImportImageResult>(raw);
  },

  async updateFirstDraft(
    importJobId: string,
    payload: UpdateImportDraftPayload,
    draftId?: string | null,
  ): Promise<ImportDraftResult> {
    const endpoint = draftId
      ? API_ENDPOINT.IMPORTS.DRAFT(importJobId, draftId)
      : API_ENDPOINT.IMPORTS.DETAIL(importJobId);
    const raw = await apiClient.patch(endpoint, payload);
    return normalizeDraft(unwrapImportResult(raw));
  },

  async confirmImport(
    importJobId: string,
    payload: ConfirmImportPayload,
  ): Promise<ConfirmImportResult> {
    const raw = await apiClient.post(API_ENDPOINT.IMPORTS.CONFIRM(importJobId), payload);
    return unwrapImportResult<ConfirmImportResult>(raw);
  },
};
