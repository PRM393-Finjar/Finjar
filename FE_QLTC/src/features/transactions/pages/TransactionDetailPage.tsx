import { Link, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/shared/components/ui/button";

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

import { useTransaction } from "../hooks/useTransactions";

import type { TransactionType } from "../types";



export function TransactionDetailPage() {

  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useTransaction(id);



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

      <div className="flex items-center gap-3">

        <Button asChild variant="outline" size="sm" className="brutal-btn-outline cursor-pointer">

          <Link to={ROUTES.TRANSACTIONS}>

            <ArrowLeft className="mr-1 h-4 w-4" />

            Danh sách

          </Link>

        </Button>

        <h1 className="text-2xl font-extrabold tracking-tight">Chi tiết giao dịch</h1>

      </div>



      <Card className={cn("brutal-card border-0 shadow-none")}>

        <CardHeader>

          <CardTitle className="text-base">

            {TRANSACTION_TYPE_LABELS[data.type as TransactionType] ?? data.type}

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


