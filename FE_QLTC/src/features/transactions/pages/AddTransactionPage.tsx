import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";
import { parseApiError } from "@/shared/lib/apiErrors";
import { ROUTES } from "@/shared/constants";
import {
  getCategoryDisplayName,
  TRANSACTION_TYPE_LABELS,
} from "@/shared/constants/userCopy";
import { useFinancialAccounts } from "@/features/financial-accounts";
import { useUserCategories } from "@/features/categories";
import { useJars } from "@/features/jars/hooks/useJars";
import { useCreateTransaction } from "../hooks/useTransactions";
import type { TransactionType } from "../types";

type TransferMode = "jarToJar" | "accountToJar" | "jarToAccount";

function nowLocalString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTransactionPage() {
  const navigate = useNavigate();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();
  const { data: accounts = [], isLoading: loadingAccounts } =
    useFinancialAccounts();
  const { data: categories = [], isLoading: loadingCategories } =
    useUserCategories();
  const { data: jars = [], isLoading: loadingJars } = useJars();

  const manualAccounts = useMemo(
    () => accounts.filter((a) => a.connectionMode === "Manual" && a.isActive),
    [accounts],
  );

  const [type, setType] = useState<TransactionType>("Expense");
  const [transferMode, setTransferMode] = useState<TransferMode>("jarToJar");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [financialAccountId, setFinancialAccountId] = useState("");
  const [fromJarId, setFromJarId] = useState("");
  const [toJarId, setToJarId] = useState("");
  const [dateLocal, setDateLocal] = useState(nowLocalString);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadingDeps = loadingAccounts || loadingCategories || loadingJars;
  const isTransfer = type === "Transfer";
  const needsJar = type === "Expense" || (isTransfer && transferMode !== "accountToJar");
  const canSubmit =
    !isPending &&
    !loadingDeps &&
    (!needsJar || jars.length > 0) &&
    (type !== "Income" || manualAccounts.length > 0);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateAndBuild = (): {
    type: TransactionType;
    amount: number;
    note?: string;
    categoryId?: string | null;
    financialAccountId?: string | null;
    fromJarId?: string | null;
    toJarId?: string | null;
    date?: string;
  } | null => {
    setFormError(null);
    setFieldErrors({});

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      const msg = "Vui lòng nhập số tiền lớn hơn 0.";
      setFieldErrors({ amount: msg });
      setFormError(msg);
      return null;
    }

    let dateIso: string | undefined;
    if (!isTransfer) {
      if (!dateLocal?.trim()) {
        const msg = "Bạn chưa chọn thời gian giao dịch.";
        setFieldErrors({ date: msg });
        setFormError(msg);
        return null;
      }
      const parsedAt = new Date(dateLocal);
      if (Number.isNaN(parsedAt.getTime())) {
        const msg = "Thời gian giao dịch không hợp lệ.";
        setFieldErrors({ date: msg });
        setFormError(msg);
        return null;
      }
      if (parsedAt.getTime() > Date.now()) {
        const msg = "Chỉ ghi nhận được đến thời điểm hiện tại.";
        setFieldErrors({ date: msg });
        setFormError(msg);
        return null;
      }
      dateIso = parsedAt.toISOString();
    }

    const cat = categoryId || null;
    const noteTrim = note.trim() || undefined;

    if (type === "Expense") {
      if (!fromJarId) {
        const msg = "Hãy chọn hũ bạn muốn chi tiền.";
        setFieldErrors({ fromJarId: msg });
        setFormError(msg);
        return null;
      }
      return {
        type: "Expense",
        amount: num,
        note: noteTrim,
        categoryId: cat,
        fromJarId,
        toJarId: null,
        financialAccountId: null,
        date: dateIso,
      };
    }

    if (type === "Income") {
      if (!financialAccountId) {
        const msg = "Hãy chọn tài khoản nhận tiền.";
        setFieldErrors({ financialAccountId: msg });
        setFormError(msg);
        return null;
      }
      return {
        type: "Income",
        amount: num,
        note: noteTrim,
        categoryId: cat,
        financialAccountId,
        fromJarId: null,
        toJarId: null,
        date: dateIso,
      };
    }

    if (type === "Transfer") {
      if (transferMode === "jarToJar") {
        if (!fromJarId || !toJarId) {
          setFormError("Hãy chọn cả hũ gửi và hũ nhận.");
          return null;
        }
        if (fromJarId === toJarId) {
          setFormError("Hũ gửi và hũ nhận phải khác nhau.");
          return null;
        }
        return {
          type: "Transfer",
          amount: num,
          note: noteTrim,
          categoryId: cat,
          fromJarId,
          toJarId,
          financialAccountId: null,
        };
      }
      if (transferMode === "accountToJar") {
        if (!financialAccountId || !toJarId) {
          setFormError("Hãy chọn tài khoản và hũ muốn chuyển vào.");
          return null;
        }
        return {
          type: "Transfer",
          amount: num,
          note: noteTrim,
          categoryId: cat,
          financialAccountId,
          toJarId,
          fromJarId: null,
        };
      }
      if (!fromJarId || !financialAccountId) {
        setFormError("Hãy chọn hũ gửi và tài khoản nhận tiền.");
        return null;
      }
      return {
        type: "Transfer",
        amount: num,
        note: noteTrim,
        categoryId: cat,
        fromJarId,
        financialAccountId,
        toJarId: null,
      };
    }

    setFormError("Loại giao dịch không hợp lệ.");
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = validateAndBuild();
    if (!payload) return;
    try {
      await createTransaction(payload);
      navigate(ROUTES.TRANSACTIONS, { replace: true });
    } catch (e) {
      const parsed = parseApiError(e);
      setFormError(parsed.message);
      if (parsed.field) {
        setFieldErrors({ [parsed.field]: parsed.message });
      }
    }
  };

  const fieldError = (field: string) => fieldErrors[field];

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <BrutalPageHeader
        title="Thêm giao dịch"
        description="Ghi lại khoản thu, khoản chi hoặc chuyển tiền giữa hũ và tài khoản."
      />

      <Card className={cn("brutal-card w-full border-0 shadow-none")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#0f172a]">
            Tạo giao dịch thủ công
          </CardTitle>
          <CardDescription>
            Điền thông tin bên dưới rồi bấm lưu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <select
                id="type"
                className="brutal-select"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as TransactionType)
                }
              >
                <option value="Expense">{TRANSACTION_TYPE_LABELS.Expense}</option>
                <option value="Income">{TRANSACTION_TYPE_LABELS.Income}</option>
                <option value="Transfer">{TRANSACTION_TYPE_LABELS.Transfer}</option>
              </select>
            </div>

            {isTransfer ? (
              <div className="space-y-2">
                <Label htmlFor="transferMode">Kiểu chuyển</Label>
                <select
                  id="transferMode"
                  className="brutal-select"
                  value={transferMode}
                  onChange={(event) =>
                    setTransferMode(event.target.value as TransferMode)
                  }
                >
                  <option value="jarToJar">Hũ → Hũ</option>
                  <option value="accountToJar">Tài khoản → Hũ</option>
                  <option value="jarToAccount">Hũ → Tài khoản</option>
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    clearFieldError("amount");
                  }}
                  required
                  aria-invalid={Boolean(fieldError("amount"))}
                />
                {fieldError("amount") ? (
                  <p className="text-sm text-red-500">{fieldError("amount")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Thời gian giao dịch</Label>
                {isTransfer ? (
                  <p
                    id="date"
                    className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-slate-600"
                  >
                    Ghi nhận ngay lúc này
                  </p>
                ) : (
                  <>
                    <ScheduleDateTimePicker
                      id="date"
                      value={dateLocal}
                      onChange={(v) => {
                        setDateLocal(v);
                        clearFieldError("date");
                      }}
                      disablePast={false}
                      disableFuture
                      allowClear={false}
                      className="max-w-none"
                    />
                    {fieldError("date") ? (
                      <p className="text-sm text-red-500">{fieldError("date")}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục (không bắt buộc)</Label>
              <select
                id="category"
                className="brutal-select"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  clearFieldError("categoryId");
                }}
                disabled={loadingDeps}
              >
                <option value="">Không chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryDisplayName(c.name, c.kind)}
                  </option>
                ))}
              </select>
              {fieldError("categoryId") ? (
                <p className="text-sm text-red-500">{fieldError("categoryId")}</p>
              ) : null}
            </div>

            {type === "Expense" ? (
              <div className="space-y-2">
                <Label htmlFor="fromJar">Hũ nguồn</Label>
                <select
                  id="fromJar"
                  className="brutal-select"
                  value={fromJarId}
                  onChange={(event) => {
                    setFromJarId(event.target.value);
                    clearFieldError("fromJarId");
                  }}
                  required
                  disabled={loadingDeps}
                >
                  <option value="">Chọn hũ</option>
                  {jars.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.status})
                    </option>
                  ))}
                </select>
                {fieldError("fromJarId") ? (
                  <p className="text-sm text-red-500">{fieldError("fromJarId")}</p>
                ) : null}
              </div>
            ) : null}

            {type === "Income" ? (
              <div className="space-y-2">
                <Label htmlFor="account">Tài khoản tiền</Label>
                <select
                  id="account"
                  className="brutal-select"
                  value={financialAccountId}
                  onChange={(event) => {
                    setFinancialAccountId(event.target.value);
                    clearFieldError("financialAccountId");
                  }}
                  required
                  disabled={loadingDeps}
                >
                  <option value="">Chọn tài khoản</option>
                  {manualAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.accountType}
                    </option>
                  ))}
                </select>
                {fieldError("financialAccountId") ? (
                  <p className="text-sm text-red-500">
                    {fieldError("financialAccountId")}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Chỉ chọn tài khoản bạn tự thêm, không dùng tài khoản liên kết ngân hàng.
                </p>
              </div>
            ) : null}

            {type === "Transfer" && transferMode === "jarToJar" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromJarT">Hũ nguồn</Label>
                  <select
                    id="fromJarT"
                    className="brutal-select"
                    value={fromJarId}
                    onChange={(event) => setFromJarId(event.target.value)}
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn</option>
                    {jars.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toJarT">Hũ đích</Label>
                  <select
                    id="toJarT"
                    className="brutal-select"
                    value={toJarId}
                    onChange={(event) => setToJarId(event.target.value)}
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn</option>
                    {jars.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {type === "Transfer" && transferMode === "accountToJar" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="faAj">Tài khoản</Label>
                  <select
                    id="faAj"
                    className="brutal-select"
                    value={financialAccountId}
                    onChange={(event) => {
                      setFinancialAccountId(event.target.value);
                      clearFieldError("financialAccountId");
                    }}
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn tài khoản</option>
                    {manualAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {fieldError("financialAccountId") ? (
                    <p className="text-sm text-red-500">
                      {fieldError("financialAccountId")}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toJarAj">Hũ đích</Label>
                  <select
                    id="toJarAj"
                    className="brutal-select"
                    value={toJarId}
                    onChange={(event) => setToJarId(event.target.value)}
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn hũ</option>
                    {jars.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {type === "Transfer" && transferMode === "jarToAccount" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromJarJa">Hũ nguồn</Label>
                  <select
                    id="fromJarJa"
                    className="brutal-select"
                    value={fromJarId}
                    onChange={(event) => {
                      setFromJarId(event.target.value);
                      clearFieldError("fromJarId");
                    }}
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn hũ</option>
                    {jars.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                  {fieldError("fromJarId") ? (
                    <p className="text-sm text-red-500">{fieldError("fromJarId")}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faJa">Tài khoản đích</Label>
                  <select
                    id="faJa"
                    className="brutal-select"
                    value={financialAccountId}
                    onChange={(event) =>
                      setFinancialAccountId(event.target.value)
                    }
                    disabled={loadingDeps}
                  >
                    <option value="">Chọn tài khoản</option>
                    {manualAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {formError ? (
              <p className="text-sm text-red-500">{formError}</p>
            ) : null}

            {loadingDeps ? (
              <p className="text-sm font-medium text-neutral-600">
                Đang tải danh sách hũ, tài khoản và danh mục…
              </p>
            ) : null}
            {!loadingDeps && needsJar && jars.length === 0 ? (
              <p className="text-sm font-medium text-amber-800">
                Chưa có hũ nào.{" "}
                <Link to={ROUTES.JARS} className="font-bold underline">
                  Tạo hũ
                </Link>{" "}
                trước khi ghi chi tiêu hoặc chuyển tiền.
              </p>
            ) : null}
            {!loadingDeps && type === "Income" && manualAccounts.length === 0 ? (
              <p className="text-sm font-medium text-amber-800">
                Chưa có tài khoản thủ công.{" "}
                <Link to={ROUTES.ACCOUNTS} className="font-bold underline">
                  Thêm nguồn tiền
                </Link>{" "}
                trước khi ghi thu nhập.
              </p>
            ) : null}
            <button
              type="submit"
              className="brutal-btn-primary inline-flex h-10 w-full cursor-pointer items-center justify-center px-4 text-sm disabled:cursor-not-allowed sm:w-auto"
              disabled={!canSubmit}
            >
              {isPending ? "Đang lưu…" : "Lưu giao dịch"}
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
