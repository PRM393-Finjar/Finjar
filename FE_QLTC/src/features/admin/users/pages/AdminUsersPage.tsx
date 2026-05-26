import { useEffect, useMemo, useState } from "react";
import { Ban, Eye, Search, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  useAdminUserDetail,
  useAdminUsers,
  useChangeUserRoleMutation,
  useUpdateUserStatusMutation,
} from "../hooks/useAdminUsers";
import { cn } from "@/lib/utils";
import { AccountRole, type AdminUserDto } from "../types";

/** Khớp cấu hình backend (cố định 10 bản ghi / trang). */
const PAGE_SIZE = 10;

/** Đồng bộ AdminLayout: logo / nav active */
const adminTitle = "text-[#4F46E5]";
const adminBtnPrimary =
  "bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] focus-visible:ring-[#6366F1]";
const adminBtnOutline =
  "border-[#6366F1]/40 text-[#4F46E5] hover:bg-indigo-50 hover:text-[#4F46E5]";
const adminFocusField =
  "focus-visible:border-[#6366F1]/50 focus-visible:ring-[#6366F1]/30";

function displayName(u: Pick<AdminUserDto, "firstName" | "lastName" | "userName">) {
  const n = `${u.firstName} ${u.lastName}`.trim();
  return n || u.userName;
}

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

export function AdminUsersPage() {
  const [pageIndex, setPageIndex] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "Active" | "Banned">("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const [quickBanUser, setQuickBanUser] = useState<AdminUserDto | null>(null);
  const [quickBanReason, setQuickBanReason] = useState("");
  const [quickUnbanUser, setQuickUnbanUser] = useState<AdminUserDto | null>(null);
  const [roleRowUser, setRoleRowUser] = useState<AdminUserDto | null>(null);
  const [roleRowPick, setRoleRowPick] = useState<AccountRole>(AccountRole.User);

  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(keywordInput), 400);
    return () => window.clearTimeout(t);
  }, [keywordInput]);

  useEffect(() => {
    // Sync: khi đổi bộ lọc, quay lại trang 1 (không phải subscription tới hệ thống bên ngoài).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional derived pagination reset
    setPageIndex(1);
  }, [keyword, statusFilter]);

  const listParams = useMemo(
    () => ({
      pageIndex,
      pageSize: PAGE_SIZE,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
    }),
    [pageIndex, statusFilter, keyword],
  );

  const { data, isLoading, isError, isFetching } = useAdminUsers(listParams);
  const updateStatus = useUpdateUserStatusMutation();
  const changeRole = useChangeUserRoleMutation();

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useAdminUserDetail(detailUserId, { enabled: detailOpen && Boolean(detailUserId) });

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    if (pagination && pageIndex > pagination.totalPages) {
      // Sync: sau khi API báo ít trang hơn, clamp pageIndex (tránh lệch UI/query).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional clamp to server totalPages
      setPageIndex(Math.max(1, pagination.totalPages));
    }
  }, [pagination, pageIndex]);

  function openDetail(id: string) {
    setDetailUserId(id);
    setDetailOpen(true);
  }

  function closeDetail(open: boolean) {
    setDetailOpen(open);
    if (!open) {
      setDetailUserId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", adminTitle)}>
          Quản lý người dùng
        </h1>
        <p className="text-sm text-slate-600">
          Danh sách tài khoản vai trò User — lọc, phân trang, xem chi tiết và cập nhật trạng thái.
        </p>
      </div>

      <Card className="border-slate-200/90 shadow-sm ring-1 ring-[#6366F1]/10">
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className={cn("text-lg font-semibold", adminTitle)}>
            Bộ lọc
          </CardTitle>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="user-keyword">Tìm kiếm</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6366F1]/75" />
                <Input
                  id="user-keyword"
                  placeholder="Email, tên đăng nhập, họ tên…"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className={cn("h-10 pl-9", adminFocusField)}
                />
              </div>
            </div>
            <div className="w-full min-w-[140px] md:w-44">
              <Label htmlFor="user-status-filter">Trạng thái</Label>
              <Select
                value={statusFilter === "" ? "__all__" : statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(
                    v === "__all__" ? "" : (v as "Active" | "Banned"),
                  )
                }
              >
                <SelectTrigger id="user-status-filter" className="mt-1.5">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Không tải được danh sách.</p>
          ) : (
            <>
              <div className="scrollbar-none overflow-x-auto rounded-md border border-indigo-100/90 bg-white">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-indigo-100 bg-indigo-50/90 text-[11px] font-semibold uppercase tracking-wide text-[#4338ca]">
                    <tr>
                      <th className="px-3 py-2.5">Họ tên</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Username</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Tạo lúc</th>
                      <th className="min-w-[220px] px-3 py-2.5 text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          Không có người dùng phù hợp.
                        </td>
                      </tr>
                    ) : (
                      rows.map((item) => {
                        const rowBusyStatus =
                          updateStatus.isPending &&
                          updateStatus.variables?.id === item.id;
                        const rowBusyRole =
                          changeRole.isPending &&
                          changeRole.variables?.accountId === item.id;

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0 transition-colors hover:bg-indigo-50/50"
                          >
                            <td className="px-3 py-2.5 font-medium">
                              {displayName(item)}
                            </td>
                            <td className="max-w-[200px] truncate px-3 py-2.5 text-muted-foreground">
                              {item.email}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {item.userName}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={
                                  item.status === "Active"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex flex-col items-stretch justify-end gap-1 sm:flex-row sm:flex-wrap sm:justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  className={cn("gap-1", adminBtnPrimary)}
                                  onClick={() => openDetail(item.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                  Chi tiết
                                </Button>
                                {item.status === "Active" ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    disabled={rowBusyStatus || rowBusyRole}
                                    onClick={() => {
                                      setQuickBanReason("");
                                      setQuickBanUser(item);
                                    }}
                                  >
                                    <Ban className="h-4 w-4" />
                                    Cấm
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-emerald-700 hover:bg-emerald-50"
                                    disabled={rowBusyStatus || rowBusyRole}
                                    onClick={() => setQuickUnbanUser(item)}
                                  >
                                    Kích hoạt
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={cn("gap-1", adminBtnOutline)}
                                  disabled={rowBusyStatus || rowBusyRole}
                                  onClick={() => {
                                    setRoleRowPick(AccountRole.User);
                                    setRoleRowUser(item);
                                  }}
                                >
                                  <Shield className="h-4 w-4" />
                                  Vai trò
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
                        {pagination.page}
                      </span>{" "}
                      / {pagination.totalPages} ·{" "}
                      <span className="font-semibold text-[#6366F1]">
                        {pagination.totalCount}
                      </span>{" "}
                      tài khoản
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

      <Dialog open={detailOpen} onOpenChange={closeDetail}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-t-[3px] border-t-[#6366F1] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className={adminTitle}>Chi tiết người dùng</DialogTitle>
            <DialogDescription className="text-slate-600">
              Thông tin chi tiết từ API. Cấm, kích hoạt và đổi vai trò thực hiện trên danh sách.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && detailUserId ? (
            <p className="text-sm text-muted-foreground">Đang tải chi tiết…</p>
          ) : detailError || !detail ? (
            <p className="text-sm text-red-600">
              Không tải được chi tiết người dùng.
            </p>
          ) : (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Họ tên</dt>
                <dd className="font-medium">{displayName(detail)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Username</dt>
                <dd>{detail.userName}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{detail.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Điện thoại</dt>
                <dd>{detail.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tiền tệ</dt>
                <dd>{detail.preferredCurrency}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd
                  className={
                    detail.status === "Active" ? "text-green-600" : "text-red-600"
                  }
                >
                  {detail.status}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Onboarding</dt>
                <dd>{detail.isOnboardingCompleted ? "Hoàn tất" : "Chưa"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Đăng nhập gần nhất</dt>
                <dd>{formatDate(detail.lastLoginAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Tạo lúc</dt>
                <dd>{formatDate(detail.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Lý do trạng thái (hiện tại)</dt>
                <dd className="text-muted-foreground">
                  {detail.statusReason ?? "—"}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(quickBanUser)}
        onOpenChange={(open) => {
          if (!open) {
            setQuickBanUser(null);
            setQuickBanReason("");
          }
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-t-[#6366F1]">
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("text-lg font-semibold", adminTitle)}>
              Cấm tài khoản?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quickBanUser
                ? `Người dùng ${displayName(quickBanUser)} (${quickBanUser.email}) sẽ chuyển sang trạng thái Banned.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quick-ban-reason">Lý do (tùy chọn)</Label>
            <Input
              id="quick-ban-reason"
              value={quickBanReason}
              onChange={(e) => setQuickBanReason(e.target.value)}
              placeholder="Ghi chú cho admin"
              className={adminFocusField}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!quickBanUser) return;
                updateStatus.mutate({
                  id: quickBanUser.id,
                  status: "Banned",
                  statusReason: quickBanReason.trim() || null,
                });
                setQuickBanUser(null);
                setQuickBanReason("");
              }}
            >
              Cấm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(quickUnbanUser)}
        onOpenChange={(open) => {
          if (!open) setQuickUnbanUser(null);
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-t-[#6366F1]">
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("text-lg font-semibold", adminTitle)}>
              Kích hoạt lại tài khoản?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quickUnbanUser
                ? `Đặt lại trạng thái Active cho ${displayName(quickUnbanUser)} (${quickUnbanUser.email}).`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={cn(adminBtnPrimary)}
              onClick={() => {
                if (!quickUnbanUser) return;
                updateStatus.mutate({
                  id: quickUnbanUser.id,
                  status: "Active",
                  statusReason: null,
                });
                setQuickUnbanUser(null);
              }}
            >
              Kích hoạt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(roleRowUser)}
        onOpenChange={(open) => {
          if (!open) setRoleRowUser(null);
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-t-[#6366F1]">
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("text-lg font-semibold", adminTitle)}>
              Đổi vai trò hệ thống
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleRowUser
                ? `Tài khoản ${displayName(roleRowUser)} — chọn vai trò mới rồi xác nhận.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="role-row-pick">Vai trò</Label>
            <Select
              value={String(roleRowPick)}
              onValueChange={(v) =>
                setRoleRowPick(Number(v) as AccountRole)
              }
            >
              <SelectTrigger id="role-row-pick" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(AccountRole.User)}>User</SelectItem>
                <SelectItem value={String(AccountRole.Admin)}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={cn(adminBtnPrimary)}
              onClick={() => {
                if (!roleRowUser) return;
                changeRole.mutate({
                  accountId: roleRowUser.id,
                  role: roleRowPick,
                });
                setRoleRowUser(null);
              }}
            >
              Xác nhận đổi vai trò
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
