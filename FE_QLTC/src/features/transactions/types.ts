export type TransactionType = "Income" | "Expense" | "Transfer";

export interface TransactionItem {
  id: string;
  type: TransactionType;
  /** Số có dấu theo BE (expense thường âm) hoặc dương — UI dùng `Math.abs` khi format. */
  amount: number;
  note: string;
  transactionDate: string;
  financialAccountName?: string | null;
  jarName?: string | null;
  toJarName?: string | null;
  categoryName?: string | null;
}

export interface TransactionDetail extends TransactionItem {
  financialAccountId?: string | null;
  fromJarId?: string | null;
  toJarId?: string | null;
  categoryId?: string | null;
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TransactionListResult {
  items: TransactionItem[];
  pagination: TransactionPagination;
}

export interface TransactionListParams {
  pageIndex?: number;
  pageSize?: number;
  financialAccountId?: string;
  type?: TransactionType;
  jarId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  sortBy?: "date" | "amount";
  sortDir?: "asc" | "desc";
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  note?: string;
  financialAccountId?: string | null;
  categoryId?: string | null;
  fromJarId?: string | null;
  toJarId?: string | null;
  /** ISO8601; mặc định now. */
  date?: string;
}

export interface UpdateTransactionPayload {
  transactionsAmount?: number;
  categoryId?: string | null;
  note?: string | null;
}

export interface DeleteTransactionResult {
  message: string;
}
