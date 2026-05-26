import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";

export function CashFlowChart() {
  const { format, formatMonth, cashFlowSeries } = useFinanceDashboard();

  const data = cashFlowSeries.map((row) => ({
    month: row.month,
    label: formatMonth(row.month),
    inflow: row.inflow,
    outflow: row.outflow,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-44 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#525252", fontSize: 10, fontWeight: 600 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(168, 224, 135, 0.15)" }}
            formatter={(value: number, name: string) => [
              format(value),
              name === "inflow" ? "Thu" : "Chi",
            ]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="inflow" fill="#a8e087" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="outflow" fill="#a5a6f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
