import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { useGoals } from "@/features/goals";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { parseApiError } from "@/shared/lib/apiErrors";
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
import { useCreateJar, useDeleteJar, useJars, useUpdateJar } from "../hooks/useJars";
import type { JarItem } from "../types";

import { formatVnd } from "@/shared/lib/formatCurrency";

export function JarsPage() {
  const { data, isLoading, isError, refetch } = useJars();
  const { data: goals = [] } = useGoals();
  const {
    mutateAsync: createJar,
    isPending: creating,
    isError: isCreateError,
    error: createError,
  } = useCreateJar();
  const {
    mutateAsync: updateJar,
    isPending: updating,
    isError: isUpdateError,
    error: updateError,
  } = useUpdateJar();
  const { mutateAsync: deleteJar, isPending: deleting } = useDeleteJar();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<JarItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [cName, setCName] = useState("");
  const [cColor, setCColor] = useState("#a8e087");
  const [cIcon, setCIcon] = useState("wallet");

  const [eName, setEName] = useState("");
  const [eColor, setEColor] = useState("#a8e087");
  const [eIcon, setEIcon] = useState("wallet");

  const openCreate = () => {
    setCName("");
    setCColor("#a8e087");
    setCIcon("wallet");
    setCreateOpen(true);
  };

  const openEdit = (jar: JarItem) => {
    setEditItem(jar);
    setEName(jar.name);
    setEColor(jar.color || "#a8e087");
    setEIcon(jar.icon || "wallet");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cName.trim()) return;
    try {
      await createJar({
        name: cName.trim(),
        color: cColor,
        icon: cIcon.trim() || "wallet",
      });
      toast.success("Đã tạo hũ");
      setCreateOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được hũ.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJar(deleteId);
      toast.success("Đã xóa hũ");
      setDeleteId(null);
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editItem || !eName.trim()) return;
    try {
      await updateJar({
        id: editItem.id,
        payload: {
          name: eName.trim(),
          color: eColor,
          icon: eIcon.trim() || "wallet",
        },
      });
      toast.success("Đã cập nhật hũ");
      setEditItem(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được.");
    }
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải hũ...</p>
    );
  }
  if (isError || !data) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được danh sách hũ.</p>
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
        eyebrow="Phân bổ tiền"
        title="Hũ"
        description={
          <>
            Số dư hũ có thể gắn với{" "}
            <Link
              to={ROUTES.GOALS}
              className="font-semibold underline-offset-2 hover:underline"
            >
              mục tiêu tiết kiệm
            </Link>{" "}
            để theo dõi mục tiêu tiết kiệm.
          </>
        }
        actions={
          <Button
            type="button"
            className="brutal-btn-primary shrink-0 cursor-pointer gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Tạo hũ mới
          </Button>
        }
      />

      {data.length === 0 ? (
        <Card className={cn("brutal-card border-0 border-dashed shadow-none")}>
          <CardContent className="py-12 text-center text-sm text-slate-600">
            <p>Chưa có hũ nào.</p>
            <Button
              type="button"
              className="brutal-btn-primary mt-4 cursor-pointer"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Tạo hũ đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((jar) => {
            const jarGoals = goals.filter((g) => g.linkedJarId === jar.id);
            return (
            <Card
              key={jar.id}
              className={cn("brutal-card border-0 shadow-none transition hover:bg-neutral-50")}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#0f172a]">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-neutral-900"
                    style={{ backgroundColor: jar.color }}
                  />
                  <span className="line-clamp-2">{jar.name}</span>
                </CardTitle>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer gap-1"
                    onClick={() => openEdit(jar)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer px-2 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteId(jar.id)}
                    aria-label="Xóa hũ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-slate-600">
                  Số dư:{" "}
                  <span className="font-semibold">
                    {formatVnd(jar.balance)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Phân bổ:{" "}
                  {jar.percentage != null ? `${jar.percentage}%` : "—"} ·{" "}
                  {jar.status}
                </p>
                {jarGoals.length > 0 ? (
                  <div className="mt-3 border-t border-neutral-200 pt-2">
                    <p className="text-xs font-medium text-slate-600">
                      Mục tiêu dùng hũ này
                    </p>
                    <ul className="mt-1 space-y-1">
                      {jarGoals.map((g) => (
                        <li key={g.id}>
                          <Link
                            to={ROUTES.GOALS}
                            className="text-xs font-semibold underline-offset-2 hover:underline"
                          >
                            {g.title} · {g.progressPercentage.toFixed(0)}%
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 border-t border-neutral-200 pt-2 text-xs text-slate-400">
                    Chưa gắn mục tiêu.{" "}
                    <Link
                      to={ROUTES.GOALS}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      Tạo / sửa mục tiêu
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo hũ mới</DialogTitle>
            <DialogDescription>
              Nhập tên hũ, chọn màu và icon hiển thị.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jar-c-name">Tên hũ</Label>
              <Input
                id="jar-c-name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Ví dụ: Du lịch"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jar-c-color">Màu</Label>
                <div className="flex gap-2">
                  <Input
                    id="jar-c-color"
                    type="color"
                    className="h-10 w-14 cursor-pointer p-1"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                  />
                  <Input
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jar-c-icon">Icon (tên gợi ý)</Label>
                <Input
                  id="jar-c-icon"
                  value={cIcon}
                  onChange={(e) => setCIcon(e.target.value)}
                  placeholder="wallet, plane…"
                />
              </div>
            </div>
            {isCreateError ? (
              <p className="text-sm text-red-500">
                {(createError as Error)?.message ?? "Không tạo được hũ."}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="brutal-btn-outline cursor-pointer"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="brutal-btn-primary cursor-pointer"
                disabled={creating}
              >
                {creating ? "Đang tạo…" : "Tạo hũ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editItem !== null}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật hũ</DialogTitle>
            <DialogDescription>
              Đổi tên, màu hoặc icon. Số dư chỉ thay đổi qua giao dịch.
            </DialogDescription>
          </DialogHeader>
          {editItem ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jar-e-name">Tên hũ</Label>
                <Input
                  id="jar-e-name"
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jar-e-color">Màu</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jar-e-color"
                      type="color"
                      className="h-10 w-14 cursor-pointer p-1"
                      value={eColor}
                      onChange={(e) => setEColor(e.target.value)}
                    />
                    <Input
                      value={eColor}
                      onChange={(e) => setEColor(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jar-e-icon">Icon</Label>
                  <Input
                    id="jar-e-icon"
                    value={eIcon}
                    onChange={(e) => setEIcon(e.target.value)}
                  />
                </div>
              </div>
              {isUpdateError ? (
                <p className="text-sm text-red-500">
                  {(updateError as Error)?.message ?? "Không cập nhật được."}
                </p>
              ) : null}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditItem(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="brutal-btn-primary cursor-pointer"
                  disabled={updating}
                >
                  {updating ? "Đang lưu…" : "Lưu"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hũ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa hũ này? Nếu hũ còn giao dịch hoặc mục tiêu, có thể
              không xóa được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "Đang xóa…" : "Xóa hũ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
