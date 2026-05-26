import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  useNotifications,
  useUpdateNotificationStatus,
  type NotificationItem,
} from "@/features/notifications";
import { labelOf, NOTIFICATION_TYPE_LABELS } from "@/shared/constants/userCopy";

const PAGE_SIZE = 10;

export function UserNotificationsPage() {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [status, setStatus] = useState<"" | "read" | "unread">("");
  const [typeFilter, setTypeFilter] = useState("");

  const params = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
      pageIndex,
      ...(status ? { status } : {}),
      ...(typeFilter.trim() ? { type: typeFilter.trim() } : {}),
    }),
    [pageIndex, status, typeFilter],
  );

  const { data, isLoading, isError, refetch } = useNotifications(params);
  const { mutateAsync: updateStatus, isPending: updating } =
    useUpdateNotificationStatus();

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalItems / data.pageSize))
    : 1;

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await updateStatus({ ids: [item.id], isRead: true, markAll: false });
    }
    const meta = item.metadata;
    if (item.type === "GoalUpdate" && meta?.goalId) {
      navigate(ROUTES.GOALS);
      return;
    }
    if (item.type === "SpendingAlert") {
      if (meta?.limitId || meta?.jarId) {
        navigate(ROUTES.BUDGET);
        return;
      }
    }
    if (meta?.transactionId) {
      navigate(`/transactions/${meta.transactionId}`);
      return;
    }
    if (meta?.jarId) {
      navigate(ROUTES.JARS);
    }
  };

  const markAllRead = async () => {
    await updateStatus({ isRead: true, markAll: true });
  };

  if (isLoading && !data) {
    return <p className="brutal-loading text-sm">Đang tải thông báo...</p>;
  }

  if (isError && !data) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được thông báo.</p>
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

  return (
    <section className="space-y-6">
      <BrutalPageHeader
        title="Thông báo"
        description={
          <>
            Cảnh báo chi tiêu, mục tiêu và tin từ hệ thống —{" "}
            <span className="font-semibold">{data?.unreadCount ?? 0} chưa đọc</span>
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            className="brutal-btn-outline shrink-0 cursor-pointer"
            disabled={updating || (data?.unreadCount ?? 0) === 0}
            onClick={() => void markAllRead()}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        }
      />

      <Card className={cn("brutal-card border-0 shadow-none")}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-[#0f172a]">
            <Bell className="h-4 w-4 text-neutral-900" />
            Hộp thư
          </CardTitle>
          <CardDescription>
            Lọc theo trạng thái đã đọc / chưa đọc hoặc theo loại thông báo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <label htmlFor="notif-status" className="text-xs text-slate-500">
                Trạng thái
              </label>
              <select
                id="notif-status"
                className="h-9 rounded-md border border-neutral-900 bg-white px-3 text-sm"
                value={status}
                onChange={(e) => {
                  setPageIndex(1);
                  setStatus(e.target.value as typeof status);
                }}
              >
                <option value="">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>
            <div className="min-w-[160px] flex-1 space-y-1">
              <label htmlFor="notif-type" className="text-xs text-slate-500">
                Loại thông báo
              </label>
              <input
                id="notif-type"
                className="h-9 w-full rounded-md border border-neutral-900 px-3 text-sm"
                placeholder="VD: cảnh báo chi tiêu, mục tiêu…"
                value={typeFilter}
                onChange={(e) => {
                  setPageIndex(1);
                  setTypeFilter(e.target.value);
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <p className="brutal-loading text-sm">Đang tải thông báo...</p>
          ) : isError ? (
            <div className="brutal-error-box space-y-3">
              <p className="text-sm text-red-600">Không tải được thông báo.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="brutal-btn-outline cursor-pointer"
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : !data?.items.length ? (
            <div className="rounded-lg border border-dashed border-neutral-900 bg-slate-50/60 py-10 text-center text-sm text-slate-600">
              <Bell className="mx-auto mb-2 h-9 w-9 text-neutral-900/35" />
              Không có thông báo phù hợp.
            </div>
          ) : (
            <ul className="divide-y divide-[#e8ecf8] rounded-lg border border-neutral-900">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition hover:bg-neutral-100 ${
                      item.isRead ? "bg-white" : "bg-[#a8e087]/25"
                    }`}
                    onClick={() => void handleNotificationClick(item)}
                  >
                    {!item.isRead ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0a0a0a]" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[#0f172a]">{item.title}</p>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {labelOf(NOTIFICATION_TYPE_LABELS, item.type)}
                        </Badge>
                        {!item.isRead ? (
                          <Badge variant="default" className="bg-[#a8e087] text-[#0a0a0a] text-[10px]">
                            Mới
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                        {item.body}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(item.occurredAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {data && data.totalItems > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8ecf8] pt-4">
              <p className="text-xs text-slate-500">
                Trang {data.pageIndex}/{totalPages} · {data.totalItems} mục
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
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
                  className="cursor-pointer"
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
