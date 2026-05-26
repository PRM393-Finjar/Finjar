export type ImportTransactionType = "Expense" | "Income";

export interface ImportReceiptExtraction {
  merchantName?: string | null;
  totalAmount?: number | null;
  transactionDate?: string | null;
  suggestedCategoryName?: string | null;
  matchedBy?: string | null;
  categoryMatchedBy?: string | null;
  warnings?: string[];
  rawText?: string | null;
}

export interface ImportReceiptPreviewTransaction {
  merchantName?: string | null;
  amount?: number | null;
  date?: string | null;
  type?: ImportTransactionType | string | null;
  categoryId?: string | null;
  suggestedCategoryName?: string | null;
  matchedBy?: string | null;
  categoryMatchedBy?: string | null;
  note?: string | null;
}

export interface ImportReceiptPreviewItem {
  name?: string | null;
  amount?: number | null;
}

export interface ImportReceiptPreviewSummary {
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
}

export interface ImportReceiptPreview {
  imageUrl?: string | null;
  transaction?: ImportReceiptPreviewTransaction | null;
  items?: ImportReceiptPreviewItem[];
  summary?: ImportReceiptPreviewSummary | null;
  warnings?: string[];
}

export interface ImportDraftResult {
  id?: string | null;
  transactionDate?: string | null;
  amount?: number | null;
  type?: ImportTransactionType | string | null;
  editedNote?: string | null;
  editedCategoryId?: string | null;
  editedJarId?: string | null;
  isValid?: boolean;
  validationError?: string | null;
}

export interface ImportImageResult {
  id?: string | null;
  importJobId?: string | null;
  status?: string | null;
  message?: string;
  fileName?: string;
  originalFileName?: string;
  sizeInBytes?: number | null;
  financialAccountId?: string | null;
  receipt?: ImportReceiptExtraction | null;
  preview?: ImportReceiptPreview | null;
  draft?: ImportDraftResult | null;
  drafts?: ImportDraftResult[];
  ocrResult?: {
    isSuccess?: boolean;
    text?: string | null;
    errorMessage?: string | null;
  };
  rawOcrJson?: string | null;
}

export interface UploadReceiptOptions {
  financialAccountId?: string;
  bankCode?: string;
  layout?: string;
  runOcr?: boolean;
  includeDebug?: boolean;
}

export interface UpdateImportDraftPayload {
  transactionDate: string;
  amount: number;
  type: ImportTransactionType;
  editedNote?: string | null;
  editedCategoryId?: string | null;
  editedJarId?: string | null;
  isValid: boolean;
  validationError?: string | null;
}

export interface ConfirmImportPayload {
  financialAccountId?: string | null;
  fromJarId?: string | null;
  draftIds?: string[];
}

export interface ConfirmImportResult {
  id?: string | null;
  status?: string | null;
  message?: string | null;
  transactionId?: string | null;
}
