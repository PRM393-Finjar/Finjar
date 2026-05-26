import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { DashboardSpendingCategory } from "../types";

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE"];

export function TopSpendingCategoriesChart({ items }: { items: DashboardSpendingCategory[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cơ cấu chi tiêu (Top danh mục)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu chi tiêu.</p> : null}
        <div className="h-64 [&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_.recharts-sector:focus-visible]:outline-none [&_path:focus]:outline-none [&_path:focus-visible]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Pie data={items} dataKey="value" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={2}>
                {items.map((item, index) => (
                  <Cell key={item.label} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${Number(value).toLocaleString("vi-VN")} đ`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{item.label}</span>
                </div>
                <span className="text-muted-foreground">{percent}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
