import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAdminBroadcasts } from "@/features/admin/broadcasts";
import { CreateBroadcastForm } from "../components/CreateBroadcastForm";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "Queued", label: "Đang chờ / đã lên lịch" },
  { value: "Sent", label: "Đã gửi" },
  { value: "Failed", label: "Thất bại" },
  { value: "Cancelled", label: "Đã hủy" },
] as const;

const adminTitle = "text-[#4F46E5]";
const adminBtnPrimary =
  "bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] focus-visible:ring-[#6366F1]";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function AdminBroadcastsPage() {
  const [pageIndex, setPageIndex] = useState(1);
  const [listStatus, setListStatus] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("Queued");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset page when status filter changes
    setPageIndex(1);
  }, [listStatus]);

  const listParams = useMemo(
    () => ({
      pageIndex,
      pageSize: PAGE_SIZE,
      status: listStatus,
    }),
    [pageIndex, listStatus],
  );

  const { data, isLoading, isError, isFetching } = useAdminBroadcasts(listParams);

  const pagination = data?.pagination;
  const broadcasts = data?.items ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    if (pagination && pageIndex > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp to server totalPages
      setPageIndex(Math.max(1, pagination.totalPages));
    }
  }, [pagination, pageIndex]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", adminTitle)}>
          Thông báo broadcast
        </h1>
        <p className="text-sm text-slate-600">
          Tạo thông báo, lọc lịch sử và phân trang — cùng một khối như trang quản lý user.
        </p>
      </div>

      <Card className="border-slate-200/90 shadow-sm ring-1 ring-[#6366F1]/10">
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className={cn("text-lg font-semibold", adminTitle)}>
            Tạo broadcast
          </CardTitle>
          <CreateBroadcastForm />
          <div className="flex flex-col gap-3 border-t border-indigo-100/90 pt-4 md:flex-row md:flex-wrap md:items-start">
            <div className="w-full min-w-[140px] md:w-44">
              <Label htmlFor="broadcast-list-status">Trạng thái (lịch sử)</Label>
              <Select
                value={listStatus}
                onValueChange={(v) =>
                  setListStatus(v as (typeof STATUS_OPTIONS)[number]["value"])
                }
              >
                <SelectTrigger id="broadcast-list-status" className="mt-1.5">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Không tải được danh sách broadcast.</p>
          ) : (
            <>
              <div className="scrollbar-none overflow-x-auto rounded-md border border-indigo-100/90 bg-white">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-indigo-100 bg-indigo-50/90 text-[11px] font-semibold uppercase tracking-wide text-[#4338ca]">
                    <tr>
                      <th className="px-3 py-2.5">Tiêu đề</th>
                      <th className="px-3 py-2.5">Nội dung</th>
                      <th className="px-3 py-2.5">Đối tượng</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Lên lịch</th>
                      <th className="px-3 py-2.5">Gửi lúc</th>
                      <th className="px-3 py-2.5 text-right">Đã gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcasts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          Chưa có broadcast nào cho bộ lọc này.
                        </td>
                      </tr>
                    ) : (
                      broadcasts.map((item) => (
                        <tr key={item.id} className="bg-white hover:bg-indigo-50/40">
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {item.title}
                          </td>
                          <td className="max-w-[220px] px-3 py-2.5 text-slate-600">
                            {truncate(item.body, 96)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {item.targetAudience}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-[#4338ca]">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {formatDate(item.scheduledAt)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {formatDate(item.sentAt)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                            {item.deliveredCount}/{item.targetCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  {pagination ? (
                    <>
                      Trang{" "}
                      <span className="font-semibold text-[#6366F1]">
                        {pagination.pageIndex}
                      </span>{" "}
                      / {pagination.totalPages} ·{" "}
                      <span className="font-semibold text-[#6366F1]">
                        {pagination.totalCount}
                      </span>{" "}
                      bản ghi
                    </>
                  ) : null}
                  {isFetching ? (
                    <span className="text-[#6366F1]"> · Đang làm mới…</span>
                  ) : null}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pageIndex <= 1}
                    className={cn(
                      adminBtnPrimary,
                      pageIndex <= 1 && "opacity-40 shadow-none",
                    )}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pageIndex >= totalPages}
                    className={cn(
                      adminBtnPrimary,
                      pageIndex >= totalPages && "opacity-40 shadow-none",
                    )}
                    onClick={() =>
                      setPageIndex((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
