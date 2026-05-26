import { useState } from "react";

import { Link } from "react-router-dom";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

import { Button } from "@/shared/components/ui/button";

import { ROUTES } from "@/shared/constants/routes";

import {
  getCategoryDisplayName,
  TRANSACTION_TYPE_LABELS,
} from "@/shared/constants/userCopy";
import { formatVnd } from "@/shared/lib/formatCurrency";

import { useTransactions } from "../hooks/useTransactions";

import type { TransactionType } from "../types";



const PAGE_SIZE = 20;



function amountClass(type: string) {

  if (type === "Income") return "text-green-600";

  if (type === "Transfer") return "text-slate-700";

  return "text-red-600";

}



function amountPrefix(type: string) {

  if (type === "Income") return "+";

  if (type === "Transfer") return "↔ ";

  return "-";

}



export function TransactionsPage() {

  const [pageIndex, setPageIndex] = useState(1);

  const { data, isLoading, isError, refetch } = useTransactions({

    pageIndex,

    pageSize: PAGE_SIZE,

    sortBy: "date",

    sortDir: "desc",

  });



  if (isLoading) {

    return <p className="brutal-loading text-sm">Đang tải giao dịch...</p>;

  }

  if (isError || !data) {

    return (

      <div className="brutal-error-box space-y-3">

        <p className="text-sm text-red-600">Không tải được danh sách giao dịch.</p>

        <Button

          type="button"

          variant="outline"

          className="brutal-btn-outline cursor-pointer"

          onClick={() => void refetch()}

        >

          Thử lại

        </Button>

      </div>

    );

  }



  const rows = data.items;

  const { pagination } = data;

  const totalPages = Math.max(1, pagination.totalPages);



  return (

    <section className="space-y-6">

      <BrutalPageHeader

        eyebrow="Thu · Chi · Chuyển"

        title="Giao dịch"

        description="Thu, chi và chuyển khoản."

        actions={

          <Button asChild className="brutal-btn-primary w-full cursor-pointer sm:w-auto">

            <Link to={ROUTES.TRANSACTIONS_ADD}>

              <Plus className="h-4 w-4" />

              Thêm giao dịch

            </Link>

          </Button>

        }

      />

      <Card className={cn("brutal-card border-0 shadow-none")}>

        <CardHeader className="pb-2">

          <CardTitle className="text-base">Giao dịch gần đây</CardTitle>

        </CardHeader>

        <CardContent className="space-y-3">

          {rows.length === 0 ? (

            <p className="text-sm text-neutral-600">

              Chưa có giao dịch. Thêm giao dịch thủ công hoặc đồng bộ từ ngân hàng

              liên kết.

            </p>

          ) : (

            rows.map((item) => (

              <Link

                key={item.id}

                to={`/transactions/${item.id}`}

                className="brutal-row flex cursor-pointer items-center justify-between p-3 transition hover:bg-neutral-50"

              >

                <div>

                  <p className="text-sm font-medium">

                    {item.note?.trim()

                      ? item.note

                      : getCategoryDisplayName(item.categoryName) ||

                        item.financialAccountName ||

                        item.jarName ||

                        TRANSACTION_TYPE_LABELS[item.type as TransactionType] ||

                        item.type}

                  </p>

                  <p className="text-xs text-muted-foreground">

                    {new Date(item.transactionDate).toLocaleString("vi-VN")}

                    {item.type

                      ? ` · ${TRANSACTION_TYPE_LABELS[item.type as TransactionType] ?? item.type}`

                      : ""}

                  </p>

                </div>

                <p className={`font-medium tabular-nums ${amountClass(item.type)}`}>

                  {amountPrefix(item.type)}

                  {formatVnd(Math.abs(item.amount))}

                </p>

              </Link>

            ))

          )}



          {pagination.totalCount > 0 ? (

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-4">

              <p className="text-xs text-neutral-500">

                Trang {pageIndex}/{totalPages} · {pagination.totalCount} giao dịch

              </p>

              <div className="flex gap-2">

                <Button

                  type="button"

                  variant="outline"

                  size="sm"

                  className="brutal-btn-outline cursor-pointer"

                  disabled={pageIndex <= 1}

                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}

                >

                  <ChevronLeft className="h-4 w-4" />

                  Trước

                </Button>

                <Button

                  type="button"

                  variant="outline"

                  size="sm"

                  className="brutal-btn-outline cursor-pointer"

                  disabled={pageIndex >= totalPages}

                  onClick={() =>

                    setPageIndex((p) => Math.min(totalPages, p + 1))

                  }

                >

                  Sau

                  <ChevronRight className="h-4 w-4" />

                </Button>

              </div>

            </div>

          ) : null}

        </CardContent>

      </Card>

    </section>

  );

}


