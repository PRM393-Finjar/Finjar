import { Link, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/shared/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {

  Card,

  CardContent,

  CardHeader,

  CardTitle,

} from "@/shared/components/ui/card";

import { ROUTES } from "@/shared/constants/routes";

import {
  getCategoryDisplayName,
  TRANSACTION_TYPE_LABELS,
} from "@/shared/constants/userCopy";
import { formatVnd } from "@/shared/lib/formatCurrency";

import { useTransaction, useDeleteTransaction, useRestoreTransaction } from "../hooks/useTransactions";

import type { TransactionType } from "../types";



export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useTransaction(id);
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
  const { mutate: restoreTransaction, isPending: isRestoring } = useRestoreTransaction();

  const handleDelete = () => {
    if (!id || !window.confirm("Bạn có chắc chắn muốn xoá giao dịch này không?")) return;
    deleteTransaction(id, {
      onSuccess: () => navigate(ROUTES.TRANSACTIONS, { replace: true })
    });
  };

  const handleRestore = () => {
    if (!id) return;
    restoreTransaction(id, {
      onSuccess: () => refetch()
    });
  };

  if (isLoading) {

    return <p className="brutal-loading text-sm">Đang tải chi tiết giao dịch...</p>;

  }



  if (isError || !data) {

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="brutal-btn-outline cursor-pointer">
            <Link to={ROUTES.TRANSACTIONS}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Danh sách
            </Link>
          </Button>
          <h1 className="text-2xl font-extrabold tracking-tight">Chi tiết giao dịch</h1>
        </div>
        <div className="flex items-center gap-2">
          {data.isDeleted ? (
            <Button 
              variant="default" 
              size="sm" 
              className="cursor-pointer"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="brutal-btn-outline cursor-pointer">
                <Link to={`/transactions/${id}/edit`}>
                  Sửa
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="cursor-pointer"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {isDeleting ? "Đang xoá..." : "Xoá"}
              </Button>
            </>
          )}
        </div>
      </div>



      <Card className={cn("brutal-card border-0 shadow-none")}>

        <CardHeader>

          <CardTitle className="text-base flex items-center gap-2">

            {TRANSACTION_TYPE_LABELS[data.type as TransactionType] ?? data.type}

            {data.isDeleted && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                Đã xoá
              </span>
            )}

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-3 text-sm text-neutral-700">

          <p>

            <span className="text-neutral-500">Số tiền: </span>

            <span className="font-semibold">{formatVnd(Math.abs(data.amount))}</span>

          </p>

          <p>

            <span className="text-neutral-500">Thời gian: </span>

            {new Date(data.transactionDate).toLocaleString("vi-VN")}

          </p>

          {data.categoryName ? (

            <p>

              <span className="text-neutral-500">Danh mục: </span>

              {getCategoryDisplayName(data.categoryName)}

            </p>

          ) : null}

          {data.jarName ? (

            <p>

              <span className="text-neutral-500">Hũ nguồn: </span>

              {data.jarName}

            </p>

          ) : null}

          {data.toJarName ? (

            <p>

              <span className="text-neutral-500">Hũ đích: </span>

              {data.toJarName}

            </p>

          ) : null}

          {data.financialAccountName ? (

            <p>

              <span className="text-neutral-500">Tài khoản: </span>

              {data.financialAccountName}

            </p>

          ) : null}

          <p>

            <span className="text-neutral-500">Ghi chú: </span>

            {data.note?.trim() ? data.note : "—"}

          </p>

        </CardContent>

      </Card>

    </section>

  );

}


