import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { DashboardTransaction } from "../types";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

export function RecentTransactions({ items }: { items: DashboardTransaction[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Giao dịch gần đây</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có giao dịch nào.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="flex min-h-[72px] items-center justify-between rounded-md border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.note || "Giao dịch chưa đặt tên"}</p>
              <p className="text-xs text-muted-foreground">{new Date(item.transactionDate).toLocaleString("vi-VN")}</p>
            </div>
            <p className={`shrink-0 whitespace-nowrap text-right ${item.type === "Income" ? "text-green-600" : "text-red-500"}`}>
              {item.type === "Income" ? "+" : "-"}
              {formatAmount(item.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
