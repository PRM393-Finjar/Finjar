import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  CreateTransactionPayload,
  DeleteTransactionResult,
  TransactionDetail,
  TransactionItem,
  TransactionListParams,
  TransactionListResult,
  TransactionPagination,
  TransactionType,
  UpdateTransactionPayload,
} from "./types";

const BASE = API_ENDPOINT.TRANSACTIONS;

interface TransactionApiRow {
  id: string;
  type: string;
  transactionsAmount: number;
  note?: string | null;
  date: string;
  financialAccount?: { id?: string | null; name?: string | null };
  jar?: { id?: string | null; name?: string | null };
  category?: { id?: string | null; name?: string | null };
  isDeleted?: boolean;
}

interface TransactionsListApiBody {
  data: TransactionApiRow[];
  pagination: TransactionPagination;
}

function mapRow(row: TransactionApiRow): TransactionItem {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: Number(row.transactionsAmount),
    note: row.note ?? "",
    transactionDate: row.date,
    financialAccountName: row.financialAccount?.name,
    jarName: row.jar?.name,
    categoryName: row.category?.name,
    isDeleted: row.isDeleted ?? false,
  };
}

function mapDetail(row: TransactionApiRow & {
  financialAccountId?: string | null;
  fromJarId?: string | null;
  toJarId?: string | null;
  categoryId?: string | null;
  toJar?: { id?: string | null; name?: string | null };
}): TransactionDetail {
  return {
    ...mapRow(row),
    financialAccountId: row.financialAccountId ?? row.financialAccount?.id ?? null,
    fromJarId: row.fromJarId ?? null,
    toJarId: row.toJarId ?? row.toJar?.id ?? null,
    toJarName: row.toJar?.name ?? null,
    categoryId: row.categoryId ?? row.category?.id ?? null,
  };
}

function buildListParams(params?: TransactionListParams) {
  if (!params) return undefined;
  return {
    pageIndex: params.pageIndex ?? 1,
    pageSize: params.pageSize ?? 20,
    financialAccountId: params.financialAccountId,
    type: params.type,
    jarId: params.jarId,
    categoryId: params.categoryId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    keyword: params.keyword,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    isDeleted: params.isDeleted,
  };
}

export const transactionService = {
  async list(params?: TransactionListParams): Promise<TransactionListResult> {
    const body = (await apiClient.get(BASE, {
      params: buildListParams(params),
    })) as TransactionsListApiBody;
    return {
      items: (body.data ?? []).map(mapRow),
      pagination: body.pagination,
    };
  },

  async getById(id: string): Promise<TransactionDetail> {
    const row = (await apiClient.get(`${BASE}/${id}`)) as TransactionApiRow & {
      financialAccountId?: string | null;
      fromJarId?: string | null;
      toJarId?: string | null;
      categoryId?: string | null;
      toJar?: { id?: string | null; name?: string | null };
    };
    return mapDetail(row);
  },

  async create(payload: CreateTransactionPayload): Promise<TransactionItem> {
    const body: Record<string, unknown> = {
      financialAccountId: payload.financialAccountId ?? undefined,
      type: payload.type,
      transactionsAmount: payload.amount,
      categoryId: payload.categoryId ?? undefined,
      fromJarId: payload.fromJarId ?? undefined,
      toJarId: payload.toJarId ?? undefined,
      note: payload.note ?? null,
    };
    if (payload.type !== "Transfer") {
      body.date = payload.date ?? new Date().toISOString();
    }
    const row = (await apiClient.post(BASE, body)) as {
      id: string;
      type: string;
      transactionsAmount: number;
      date: string;
    };
    return {
      id: row.id,
      type: row.type as TransactionType,
      amount: Number(row.transactionsAmount),
      note: payload.note ?? "",
      transactionDate: row.date,
      isDeleted: false,
    };
  },

  async update(
    id: string,
    payload: UpdateTransactionPayload,
  ): Promise<TransactionItem> {
    const row = (await apiClient.patch(`${BASE}/${id}`, payload)) as {
      id: string;
      type: string;
      transactionsAmount: number;
      date: string;
    };
    return {
      id: row.id,
      type: row.type as TransactionType,
      amount: Number(row.transactionsAmount),
      note: payload.note ?? "",
      transactionDate: row.date,
      isDeleted: false,
    };
  },

  async remove(id: string): Promise<DeleteTransactionResult> {
    return (await apiClient.delete(`${BASE}/${id}`)) as DeleteTransactionResult;
  },

  async restore(id: string): Promise<{ message: string }> {
    return (await apiClient.post(`${BASE}/${id}/restore`)) as { message: string };
  },
};
