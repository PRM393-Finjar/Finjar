import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { parseApiError } from "@/shared/lib/apiErrors";
import { useUserCategories } from "@/features/categories";
import {
  useTransaction,
  useUpdateTransaction,
} from "../hooks/useTransactions";
import { getCategoryDisplayName } from "@/shared/constants/userCopy";

export function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: transaction, isLoading: loadingTx, isError, refetch } = useTransaction(id);
  const { mutateAsync: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
  const { data: categories = [], isLoading: loadingCategories } = useUserCategories();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(Math.abs(transaction.amount).toString());
      setNote(transaction.note || "");
      setCategoryId(transaction.categoryId || "");
    }
  }, [transaction]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      const msg = "Vui lòng nhập số tiền lớn hơn 0.";
      setFieldErrors({ amount: msg });
      setFormError(msg);
      return;
    }

    const payload = {
      transactionsAmount: num,
      categoryId: categoryId || null,
      note: note.trim() || null,
    };

    try {
      await updateTransaction({ id: id!, payload });
      navigate(`/transactions/${id}`, { replace: true });
    } catch (e) {
      const parsed = parseApiError(e);
      setFormError(parsed.message);
      if (parsed.field) {
        setFieldErrors({ [parsed.field]: parsed.message });
      }
    }
  };

  const fieldError = (field: string) => fieldErrors[field];
  const loadingDeps = loadingTx || loadingCategories;

  if (loadingTx) {
    return <p className="brutal-loading text-sm">Đang tải chi tiết giao dịch...</p>;
  }

  if (isError || !transaction) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được chi tiết giao dịch.</p>
        <Button
          type="button"
          variant="outline"
          className="brutal-btn-outline cursor-pointer"
          onClick={() => void refetch()}
        >
          Thử lại
        </Button>
        <Button asChild variant="link" className="px-0">
          <Link to={ROUTES.TRANSACTIONS}>Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="brutal-btn-outline cursor-pointer">
          <Link to={`/transactions/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại chi tiết
          </Link>
        </Button>
      </div>

      <BrutalPageHeader
        title="Sửa giao dịch"
        description="Cập nhật số tiền, ghi chú hoặc phân loại."
      />

      <Card className={cn("brutal-card w-full border-0 shadow-none")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#0f172a]">
            Cập nhật thông tin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="category">Danh mục</Label>
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

            <button
              type="submit"
              className="brutal-btn-primary inline-flex h-10 w-full cursor-pointer items-center justify-center px-4 text-sm disabled:cursor-not-allowed sm:w-auto"
              disabled={isUpdating || loadingDeps}
            >
              {isUpdating ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
