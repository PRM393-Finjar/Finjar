import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { DashboardRetentionPoint } from "../types";

export function RetentionCohortChart({ items }: { items: DashboardRetentionPoint[] }) {
  const cohortLabelMap: Record<string, string> = {
    cohortA: "Nhóm Q1/2026",
    cohortB: "Nhóm Q4/2025",
    cohortC: "Nhóm Q3/2025",
    cohortD: "Nhóm Q2/2025",
  };
  const d7 = items.find((item) => item.periodLabel === "D7");
  const d30 = items.find((item) => item.periodLabel === "D30");
  const avgD7 = d7 ? Math.round((d7.cohortA + d7.cohortB + d7.cohortC + d7.cohortD) / 4) : 0;
  const avgD30 = d30 ? Math.round((d30.cohortA + d30.cohortB + d30.cohortC + d30.cohortD) / 4) : 0;
  const dropRate = Math.max(0, avgD7 - avgD30);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Biểu đồ giữ chân người dùng sau onboarding</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3">
        <p className="text-xs text-muted-foreground">Tỷ lệ người dùng còn hoạt động sau 30 ngày theo từng nhóm.</p>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu giữ chân người dùng.</p> : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Retention trung bình D7</p>
            <p className="text-sm font-semibold text-slate-900">{avgD7}%</p>
          </div>
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Retention trung bình D30</p>
            <p className="text-sm font-semibold text-slate-900">{avgD30}%</p>
          </div>
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Mức giảm D7 → D30</p>
            <p className="text-sm font-semibold text-slate-900">-{dropRate}%</p>
          </div>
        </div>
        <div className="h-[300px] rounded-lg bg-slate-50 p-2 [&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-dot:focus]:outline-none [&_.recharts-curve:focus]:outline-none [&_path:focus]:outline-none [&_path:focus-visible]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={items} margin={{ top: 8, right: 14, left: 0, bottom: 0 }} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value: number, name: string) => [`${Number(value).toLocaleString("vi-VN")}%`, cohortLabelMap[name] ?? name]}
                contentStyle={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="cohortA" name="Nhóm Q1/2026" stroke="#4F46E5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cohortB" name="Nhóm Q4/2025" stroke="#06B6D4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cohortC" name="Nhóm Q3/2025" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cohortD" name="Nhóm Q2/2025" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
