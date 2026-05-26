import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { DashboardRecentUser } from "../types";

const statusClassName: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  banned: "bg-red-100 text-red-700",
};

export function RecentUsersList({ users }: { users: DashboardRecentUser[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Người dùng mới gần đây</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có người dùng mới.</p> : null}
        {users.map((user) => {
          const statusKey = user.status.toLowerCase();
          return (
            <div key={user.id} className="flex min-h-[72px] items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    statusClassName[statusKey] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {user.status}
                </span>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
