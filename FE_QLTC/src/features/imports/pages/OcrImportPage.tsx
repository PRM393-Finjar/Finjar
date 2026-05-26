import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  ImageUp,
  Loader2,
  ReceiptText,
  Save,
  ShieldCheck,
  Upload,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useUserCategories } from "@/features/categories";
import { useFinancialAccounts } from "@/features/financial-accounts";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { TRANSACTION_TYPE_LABELS, getCategoryDisplayName } from "@/shared/constants/userCopy";
import { parseApiError } from "@/shared/lib/apiErrors";
import { invalidateFinanceQueries } from "@/shared/lib/invalidateFinanceQueries";
import { importService } from "../services";
import type {
  ImportImageResult,
  ImportTransactionType,
  UpdateImportDraftPayload,
} from "../types";

type PendingAction = "upload" | "update" | "confirm" | null;

type ReviewForm = {
  amount: string;
  type: ImportTransactionType;
  dateLocal: string;
  categoryId: string;
  note: string;
};

const initialReviewForm: ReviewForm = {
  amount: "",
  type: "Expense",
  dateLocal: "",
  categoryId: "",
  note: "",
};

const statusLabels: Record<string, string> = {
  awaitingreview: "Chờ rà soát",
  completed: "Đã xác nhận",
  pending: "Đã tải lên",
  uploaded: "Đã tải lên",
  failed: "Lỗi OCR",
  success: "OCR xong",
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeValue(value?: string | null) {
  if (!value?.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}T${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "Chưa nhận diện";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFileSize(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function firstNumber(...values: Array<number | null | undefined>) {
  return values.find((value) => value != null && Number.isFinite(value)) ?? null;
}

function getImportJobId(result: ImportImageResult | null) {
  return result?.id || result?.importJobId || "";
}

function getFirstDraftId(result: ImportImageResult | null) {
  return result?.draft?.id || result?.drafts?.[0]?.id || null;
}

function resolveImageUrl(url?: string | null) {
  if (!url?.trim()) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = apiClient.defaults.baseURL;
  if (!baseUrl) return url;
  return new URL(url, baseUrl).toString();
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Chờ rà soát";
  return statusLabels[status.toLowerCase()] ?? status;
}

function isCompletedStatus(status?: string | null) {
  return status?.toLowerCase() === "completed";
}

export function OcrImportPage() {
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: loadingAccounts } = useFinancialAccounts();
  const { data: categories = [], isLoading: loadingCategories } = useUserCategories();

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.isActive),
    [accounts],
  );

  const defaultAccountId = useMemo(() => {
    const preferred = activeAccounts.find((account) => account.isDefault);
    return preferred?.id || activeAccounts[0]?.id || "";
  }, [activeAccounts]);

  const [file, setFile] = useState<File | null>(null);
  const [financialAccountId, setFinancialAccountId] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [result, setResult] = useState<ImportImageResult | null>(null);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewForm>(initialReviewForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedFinancialAccountId = activeAccounts.some(
    (account) => account.id === financialAccountId,
  )
    ? financialAccountId
    : defaultAccountId;

  const selectedAccount = activeAccounts.find(
    (account) => account.id === selectedFinancialAccountId,
  );

  const previewUrl = resolveImageUrl(result?.preview?.imageUrl);
  const receipt = result?.receipt;
  const transaction = result?.preview?.transaction;
  const detectedAmount = firstNumber(
    transaction?.amount,
    result?.preview?.summary?.total,
    receipt?.totalAmount,
  );
  const warnings = result?.preview?.warnings?.length
    ? result.preview.warnings
    : receipt?.warnings ?? [];
  const importJobId = getImportJobId(result);
  const draftId = getFirstDraftId(result);
  const reviewLocked = Boolean(confirmedMessage) || isCompletedStatus(result?.status);
  const loadingDeps = loadingAccounts || loadingCategories;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const makeReviewForm = (nextResult: ImportImageResult): ReviewForm => {
    const nextTransaction = nextResult.preview?.transaction;
    const nextReceipt = nextResult.receipt;
    const nextAmount = firstNumber(
      nextTransaction?.amount,
      nextResult.preview?.summary?.total,
      nextReceipt?.totalAmount,
    );
    const suggestedCategoryName =
      nextTransaction?.suggestedCategoryName || nextReceipt?.suggestedCategoryName || "";
    const matchedCategory = categories.find((category) => {
      const label = getCategoryDisplayName(category.name, category.kind);
      return (
        category.name.toLowerCase() === suggestedCategoryName.toLowerCase() ||
        label.toLowerCase() === suggestedCategoryName.toLowerCase()
      );
    });
    const nextType = nextTransaction?.type === "Income" ? "Income" : "Expense";

    return {
      amount: nextAmount == null ? "" : String(nextAmount),
      type: nextType,
      dateLocal: toLocalDateTimeValue(
        nextTransaction?.date || nextReceipt?.transactionDate,
      ),
      categoryId: nextTransaction?.categoryId || matchedCategory?.id || "",
      note:
        nextTransaction?.note ||
        nextTransaction?.merchantName ||
        nextReceipt?.merchantName ||
        "",
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast.error("Chọn ảnh hoặc PDF hóa đơn.");
      return;
    }
    if (!selectedFinancialAccountId) {
      toast.error("Chọn tài khoản nhận giao dịch trước khi gửi.");
      return;
    }

    setPendingAction("upload");
    setResult(null);
    setConfirmedMessage(null);
    setFieldErrors({});

    try {
      const response = await importService.uploadReceiptImage(file, {
        financialAccountId: selectedFinancialAccountId,
        layout: "invoice",
        runOcr: true,
        includeDebug: false,
      });
      setResult(response);
      setReview(makeReviewForm(response));
      toast.success(response.message || "Đã tải hóa đơn lên.");
    } catch (error) {
      toast.error(parseApiError(error).message || "Tải lên thất bại.");
    } finally {
      setPendingAction(null);
    }
  };

  const buildDraftPayload = (): UpdateImportDraftPayload | null => {
    setFieldErrors({});

    const amount = Number(review.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      const message = "Số tiền phải lớn hơn 0.";
      setFieldErrors({ amount: message });
      toast.error(message);
      return null;
    }

    if (!review.dateLocal.trim()) {
      const message = "Chọn ngày giao dịch trước khi xác nhận.";
      setFieldErrors({ date: message });
      toast.error(message);
      return null;
    }

    const parsedDate = new Date(review.dateLocal);
    if (Number.isNaN(parsedDate.getTime())) {
      const message = "Ngày giao dịch không hợp lệ.";
      setFieldErrors({ date: message });
      toast.error(message);
      return null;
    }

    return {
      transactionDate: parsedDate.toISOString(),
      amount,
      type: review.type,
      editedNote: review.note.trim() || null,
      editedCategoryId: review.categoryId || null,
      editedJarId: null,
      isValid: true,
      validationError: null,
    };
  };

  const handleUpdateDraft = async () => {
    if (!importJobId || reviewLocked) return;
    const payload = buildDraftPayload();
    if (!payload) return;

    setPendingAction("update");
    try {
      const updatedDraft = await importService.updateFirstDraft(
        importJobId,
        payload,
        draftId,
      );
      setResult((prev) =>
        prev
          ? {
              ...prev,
              draft: updatedDraft,
              drafts: draftId
                ? (prev.drafts ?? []).map((item, index) =>
                    item.id === draftId || index === 0 ? updatedDraft : item,
                  )
                : prev.drafts,
            }
          : prev,
      );
      toast.success("Đã cập nhật bản nháp.");
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirm = async () => {
    if (!importJobId || reviewLocked) return;
    if (!selectedFinancialAccountId) {
      toast.error("Chọn tài khoản nhận giao dịch trước khi xác nhận.");
      return;
    }
    const payload = buildDraftPayload();
    if (!payload) return;

    setPendingAction("confirm");
    try {
      const updatedDraft = await importService.updateFirstDraft(
        importJobId,
        payload,
        draftId,
      );
      const confirmResult = await importService.confirmImport(importJobId, {
        financialAccountId: selectedFinancialAccountId,
        draftIds: draftId ? [draftId] : undefined,
      });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              status: confirmResult.status || "Completed",
              draft: updatedDraft,
            }
          : prev,
      );
      setConfirmedMessage(
        confirmResult.message || "Đã xác nhận và tạo giao dịch từ hóa đơn.",
      );
      invalidateFinanceQueries(queryClient);
      toast.success(confirmResult.message || "Đã xác nhận giao dịch.");
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message);
      if (parsed.field) {
        setFieldErrors({ [parsed.field]: parsed.message });
      }
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="space-y-6">
      <BrutalPageHeader
        eyebrow="Import"
        title="OCR hóa đơn"
        description="Tải hóa đơn lên để tạo bản nháp giao dịch, rà soát lại số tiền, ngày, danh mục rồi mới xác nhận."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className={cn("brutal-card border-0 shadow-none")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageUp className="h-4 w-4" />
              Tải hóa đơn
            </CardTitle>
            <CardDescription>
              Hỗ trợ ảnh và PDF. OCR luôn chạy ở chế độ hóa đơn để tạo dữ liệu nháp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ocr-file">File hóa đơn</Label>
                <Input
                  id="ocr-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="cursor-pointer"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setFile(nextFile);
                    setResult(null);
                    setConfirmedMessage(null);
                    setReview(initialReviewForm);
                    setFieldErrors({});
                  }}
                />
                {file ? (
                  <p className="text-xs font-semibold text-neutral-600">
                    {file.name}
                    {formatFileSize(file.size) ? ` · ${formatFileSize(file.size)}` : ""}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ocr-account">Tài khoản nhận giao dịch</Label>
                <select
                  id="ocr-account"
                  className="brutal-select"
                  value={selectedFinancialAccountId}
                  onChange={(event) => setFinancialAccountId(event.target.value)}
                  disabled={loadingAccounts}
                >
                  <option value="">Chọn tài khoản</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.isDefault ? " · Mặc định" : ""}
                    </option>
                  ))}
                </select>
                {!loadingAccounts && activeAccounts.length === 0 ? (
                  <p className="text-sm font-semibold text-amber-800">
                    Chưa có tài khoản hoạt động để nhận giao dịch OCR.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="brutal-btn-primary h-10 w-full cursor-pointer sm:w-auto"
                disabled={pendingAction === "upload" || !file || !selectedFinancialAccountId}
              >
                {pendingAction === "upload" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {pendingAction === "upload" ? "Đang OCR..." : "Gửi hóa đơn"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={cn("brutal-card border-0 shadow-none")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-4 w-4" />
              Kết quả OCR
            </CardTitle>
            <CardDescription>
              Dữ liệu OCR chỉ là bản nháp, cần kiểm tra lại trước khi tạo giao dịch thật.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border-2 border-[#0a0a0a] bg-neutral-100">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview hóa đơn"
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-neutral-600">
                        <FileImage className="h-9 w-9" />
                        Chưa có ảnh preview
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border-2 border-[#0a0a0a] bg-white p-3 text-sm shadow-[3px_3px_0_0_#0a0a0a]">
                    <p className="font-extrabold">
                      {result.originalFileName || result.fileName || file?.name || "Hóa đơn"}
                    </p>
                    <p className="mt-1 text-neutral-600">
                      {selectedAccount?.name || "Chưa chọn tài khoản"}
                    </p>
                    {formatFileSize(result.sizeInBytes) ? (
                      <p className="mt-1 text-neutral-600">
                        {formatFileSize(result.sizeInBytes)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border-2 border-[#0a0a0a] px-3 py-1 text-xs font-extrabold",
                        isCompletedStatus(result.status)
                          ? "bg-[#a8e087]"
                          : result.status?.toLowerCase() === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-white",
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {getStatusLabel(result.status)}
                    </span>
                    {confirmedMessage ? (
                      <span className="text-sm font-semibold text-emerald-700">
                        {confirmedMessage}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      label="Đơn vị bán"
                      value={
                        transaction?.merchantName ||
                        receipt?.merchantName ||
                        "Chưa nhận diện"
                      }
                    />
                    <InfoTile label="Tổng tiền" value={formatMoney(detectedAmount)} />
                    <InfoTile
                      label="Ngày giao dịch"
                      value={
                        transaction?.date ||
                        receipt?.transactionDate ||
                        "Chưa nhận diện"
                      }
                    />
                    <InfoTile
                      label="Danh mục gợi ý"
                      value={
                        transaction?.suggestedCategoryName ||
                        receipt?.suggestedCategoryName ||
                        "Chưa nhận diện"
                      }
                      hint={
                        transaction?.matchedBy ||
                        transaction?.categoryMatchedBy ||
                        receipt?.matchedBy ||
                        receipt?.categoryMatchedBy ||
                        undefined
                      }
                    />
                  </div>

                  {warnings.length > 0 ? (
                    <div className="rounded-2xl border-2 border-amber-900 bg-amber-50 p-3 text-sm text-amber-950">
                      <p className="flex items-center gap-2 font-extrabold">
                        <AlertTriangle className="h-4 w-4" />
                        Cần kiểm tra lại
                      </p>
                      <ul className="mt-2 space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {result.preview?.items?.length ? (
                    <div className="rounded-2xl border-2 border-[#0a0a0a] bg-white p-3">
                      <p className="mb-2 text-sm font-extrabold">Dòng hóa đơn</p>
                      <div className="max-h-44 space-y-2 overflow-auto brutal-scroll">
                        {result.preview.items.map((item, index) => (
                          <div
                            key={`${item.name ?? "item"}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 truncate font-semibold">
                              {item.name || "Dòng chưa đặt tên"}
                            </span>
                            <span className="shrink-0 font-bold">
                              {formatMoney(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-400 bg-neutral-50 p-6 text-center">
                <FileImage className="h-10 w-10 text-neutral-500" />
                <p className="mt-3 text-sm font-extrabold">Chưa có hóa đơn nào</p>
                <p className="mt-1 max-w-sm text-sm text-neutral-600">
                  Sau khi gửi file, preview OCR và form rà soát sẽ hiện tại đây.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result ? (
        <Card className={cn("brutal-card border-0 shadow-none")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Rà soát trước khi xác nhận
            </CardTitle>
            <CardDescription>
              Form này cập nhật bản nháp trước, sau đó backend mới tạo transaction thật khi xác nhận.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="review-amount">Số tiền</Label>
                    <Input
                      id="review-amount"
                      type="number"
                      min="0"
                      step="1"
                      value={review.amount}
                      onChange={(event) => {
                        setReview((prev) => ({ ...prev, amount: event.target.value }));
                        clearFieldError("amount");
                      }}
                      disabled={reviewLocked}
                      aria-invalid={Boolean(fieldErrors.amount)}
                    />
                    {fieldErrors.amount ? (
                      <p className="brutal-field-error">{fieldErrors.amount}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-type">Loại giao dịch</Label>
                    <select
                      id="review-type"
                      className="brutal-select"
                      value={review.type}
                      onChange={(event) =>
                        setReview((prev) => ({
                          ...prev,
                          type: event.target.value as ImportTransactionType,
                        }))
                      }
                      disabled={reviewLocked}
                    >
                      <option value="Expense">{TRANSACTION_TYPE_LABELS.Expense}</option>
                      <option value="Income">{TRANSACTION_TYPE_LABELS.Income}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-date">Ngày giao dịch</Label>
                    <ScheduleDateTimePicker
                      id="review-date"
                      value={review.dateLocal}
                      onChange={(value) => {
                        setReview((prev) => ({ ...prev, dateLocal: value }));
                        clearFieldError("date");
                        clearFieldError("transactionDate");
                      }}
                      disablePast={false}
                      allowClear={false}
                      className="max-w-none"
                    />
                    {fieldErrors.date || fieldErrors.transactionDate ? (
                      <p className="brutal-field-error">
                        {fieldErrors.date || fieldErrors.transactionDate}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-category">Danh mục</Label>
                    <select
                      id="review-category"
                      className="brutal-select"
                      value={review.categoryId}
                      onChange={(event) =>
                        setReview((prev) => ({
                          ...prev,
                          categoryId: event.target.value,
                        }))
                      }
                      disabled={reviewLocked || loadingCategories}
                    >
                      <option value="">Không chọn</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.kind === "default" ? "[Mặc định] " : ""}
                          {getCategoryDisplayName(category.name, category.kind)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-note">Ghi chú</Label>
                  <Input
                    id="review-note"
                    value={review.note}
                    onChange={(event) =>
                      setReview((prev) => ({ ...prev, note: event.target.value }))
                    }
                    disabled={reviewLocked}
                    placeholder="Ví dụ: hóa đơn ăn trưa, siêu thị..."
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="brutal-btn-outline h-10 cursor-pointer"
                    disabled={
                      reviewLocked ||
                      !importJobId ||
                      pendingAction === "update" ||
                      pendingAction === "confirm"
                    }
                    onClick={handleUpdateDraft}
                  >
                    {pendingAction === "update" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {pendingAction === "update" ? "Đang cập nhật..." : "Cập nhật nháp"}
                  </Button>
                  <Button
                    type="button"
                    className="brutal-btn-primary h-10 cursor-pointer"
                    disabled={
                      reviewLocked ||
                      !importJobId ||
                      !selectedFinancialAccountId ||
                      pendingAction === "update" ||
                      pendingAction === "confirm"
                    }
                    onClick={handleConfirm}
                  >
                    {pendingAction === "confirm" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    {pendingAction === "confirm"
                      ? "Đang xác nhận..."
                      : "Xác nhận giao dịch"}
                  </Button>
                </div>
              </form>

              <div className="rounded-2xl border-2 border-[#0a0a0a] bg-[#a5a6f6] p-4 shadow-[3px_3px_0_0_#0a0a0a]">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <WalletCards className="h-4 w-4" />
                  Tóm tắt tạo giao dịch
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Tài khoản" value={selectedAccount?.name || "Chưa chọn"} />
                  <SummaryRow
                    label="Số tiền"
                    value={formatMoney(Number(review.amount))}
                  />
                  <SummaryRow
                    label="Loại"
                    value={TRANSACTION_TYPE_LABELS[review.type]}
                  />
                  <SummaryRow
                    label="Draft"
                    value={draftId ? `#${draftId.slice(0, 8)}` : "Bản đầu tiên"}
                  />
                </dl>
                {reviewLocked ? (
                  <p className="mt-4 rounded-xl border-2 border-[#0a0a0a] bg-white p-3 text-xs font-bold">
                    Import này đã được xác nhận nên form đang khóa để tránh tạo trùng giao dịch.
                  </p>
                ) : null}
                {loadingDeps ? (
                  <p className="mt-4 text-xs font-bold text-neutral-800">
                    Đang tải tài khoản và danh mục...
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function InfoTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-[#0a0a0a] bg-white p-3 shadow-[3px_3px_0_0_#0a0a0a]">
      <p className="text-xs font-bold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-neutral-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs font-semibold text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-neutral-700">{label}</dt>
      <dd className="text-right font-extrabold">{value}</dd>
    </div>
  );
}
