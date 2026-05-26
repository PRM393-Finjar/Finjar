import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { DashboardStat } from "../types";

export function StatCard({ label, value, hint }: DashboardStat) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
