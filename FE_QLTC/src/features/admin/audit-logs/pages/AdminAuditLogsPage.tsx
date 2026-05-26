import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAdminAuditLogs } from "../hooks/useAdminAuditLogs";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const adminTitle = "text-[#4F46E5]";
const adminBtnPrimary =
  "bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] focus-visible:ring-[#6366F1]";
const adminFocusField =
  "focus-visible:border-[#6366F1]/50 focus-visible:ring-[#6366F1]/30";

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [adminIdInput, setAdminIdInput] = useState("");
  const [actionTypeInput, setActionTypeInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  const listParams = useMemo(() => {
    const toIso = (local: string) => {
      if (!local?.trim()) return undefined;
      const d = new Date(local);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    };
    return {
      page,
      pageSize: PAGE_SIZE,
      ...(adminIdInput.trim() ? { adminId: adminIdInput.trim() } : {}),
      ...(actionTypeInput.trim() ? { actionType: actionTypeInput.trim() } : {}),
      ...(entityTypeInput.trim() ? { entityType: entityTypeInput.trim() } : {}),
      ...(toIso(fromDateInput) ? { fromDate: toIso(fromDateInput)! } : {}),
      ...(toIso(toDateInput) ? { toDate: toIso(toDateInput)! } : {}),
    };
  }, [
    page,
    adminIdInput,
    actionTypeInput,
    entityTypeInput,
    fromDateInput,
    toDateInput,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset page when filters change
    setPage(1);
  }, [adminIdInput, actionTypeInput, entityTypeInput, fromDateInput, toDateInput]);

  const { data, isLoading, isError, isFetching } = useAdminAuditLogs(listParams);

  const pagination = data?.pagination;
  const logs = data?.items ?? [];
  /** BE có thể trả totalPages = 0 khi không có bản ghi — chuẩn hóa tối thiểu 1 để không hiện "1/0". */
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    const serverTotal = pagination?.totalPages ?? 0;
    const effectiveMax = Math.max(1, serverTotal);
    if (pagination && page > effectiveMax) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp to server totalPages
      setPage(effectiveMax);
    }
  }, [pagination, page]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", adminTitle)}>
          Nhật ký audit
        </h1>
        <p className="text-sm text-slate-600">
          Lọc theo admin, loại hành động, loại thực thể và khoảng thời gian.
        </p>
      </div>

      <Card className="border-slate-200/90 shadow-sm ring-1 ring-[#6366F1]/10">
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className={cn("text-lg font-semibold", adminTitle)}>
            Bộ lọc
          </CardTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="audit-admin-id">Admin ID (UUID)</Label>
              <Input
                id="audit-admin-id"
                placeholder="Tùy chọn"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                className={cn("h-10", adminFocusField)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-action">ActionType</Label>
              <Input
                id="audit-action"
                placeholder="Tùy chọn"
                value={actionTypeInput}
                onChange={(e) => setActionTypeInput(e.target.value)}
                className={cn("h-10", adminFocusField)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-entity">EntityType</Label>
              <Input
                id="audit-entity"
                placeholder="Tùy chọn"
                value={entityTypeInput}
                onChange={(e) => setEntityTypeInput(e.target.value)}
                className={cn("h-10", adminFocusField)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="audit-from">FromDate</Label>
              <ScheduleDateTimePicker
                id="audit-from"
                value={fromDateInput}
                onChange={setFromDateInput}
                disablePast={false}
                className={cn("max-w-none", adminFocusField)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="audit-to">ToDate</Label>
              <ScheduleDateTimePicker
                id="audit-to"
                value={toDateInput}
                onChange={setToDateInput}
                disablePast={false}
                className={cn("max-w-none", adminFocusField)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Không tải được nhật ký audit.</p>
          ) : (
            <>
              <div className="scrollbar-none overflow-x-auto rounded-md border border-indigo-100/90 bg-white">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-indigo-100 bg-indigo-50/90 text-[11px] font-semibold uppercase tracking-wide text-[#4338ca]">
                    <tr>
                      <th className="px-3 py-2.5">Thời điểm</th>
                      <th className="px-3 py-2.5">Admin</th>
                      <th className="px-3 py-2.5">Hành động</th>
                      <th className="px-3 py-2.5">Thực thể</th>
                      <th className="px-3 py-2.5">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          Không có bản ghi phù hợp.
                        </td>
                      </tr>
                    ) : (
                      logs.map((item) => (
                        <tr key={item.id} className="bg-white hover:bg-indigo-50/40">
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {item.adminUsername}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-[#4338ca]">
                              {item.actionType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">{item.entityType}</td>
                          <td className="max-w-[320px] px-3 py-2.5 text-slate-600">
                            {item.description}
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
                        {Math.min(page, totalPages)}
                      </span>{" "}
                      / {totalPages} ·{" "}
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
                    disabled={page <= 1}
                    className={cn(
                      adminBtnPrimary,
                      page <= 1 && "opacity-40 shadow-none",
                    )}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={page >= totalPages}
                    className={cn(
                      adminBtnPrimary,
                      page >= totalPages && "opacity-40 shadow-none",
                    )}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
