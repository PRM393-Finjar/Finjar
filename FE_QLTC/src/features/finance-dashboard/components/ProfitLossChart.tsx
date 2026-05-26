import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { profitLossChartData } from "../mockData";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";

export function ProfitLossChart() {
  const { formatMonth, language } = useFinanceDashboard();

  const data = profitLossChartData.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a8e087" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#a8e087" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 10, fontWeight: 500 }}
            interval={language === "vi" ? 1 : 2}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#a8e087"
            strokeWidth={2.5}
            fill="url(#inflowGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
