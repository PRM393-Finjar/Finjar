import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { useJars } from "@/features/jars/hooks/useJars";
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from "@/features/goals";
import { goalService } from "@/features/goals/services";
import type { GoalListItem } from "@/features/goals";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";
import { parseApiError } from "@/shared/lib/apiErrors";
import { GOAL_STATUS_LABELS, labelOf } from "@/shared/constants/userCopy";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { formatVnd } from "@/shared/lib/formatCurrency";

function formatDue(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type GoalStatusFilter = "all" | "active" | "completed";

export function UserGoalsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGoals();
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>("all");
  const { data: jars = [] } = useJars();
  const { mutateAsync: createGoal, isPending: creating } = useCreateGoal();
  const { mutateAsync: updateGoal, isPending: updating } = useUpdateGoal();
  const { mutateAsync: deleteGoal, isPending: deleting } = useDeleteGoal();

  const [createOpen, setCreateOpen] = useState(false);
  const [editListItem, setEditListItem] = useState<GoalListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [cTitle, setCTitle] = useState("");
  const [cTarget, setCTarget] = useState("");
  const [cDue, setCDue] = useState(() => toDatetimeLocalValue(new Date()));
  const [cJar, setCJar] = useState("__none__");
  const [cNote, setCNote] = useState("");

  const [eTitle, setETitle] = useState("");
  const [eTarget, setETarget] = useState("");
  const [eDue, setEDue] = useState("");
  const [eJar, setEJar] = useState("__none__");
  const [eNote, setENote] = useState("");
  const [cDueError, setCDueError] = useState<string | null>(null);
  const [eDueError, setEDueError] = useState<string | null>(null);

  const filteredGoals = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data;
    if (statusFilter === "completed") {
      return data.filter((g) => g.status.toLowerCase() === "completed");
    }
    return data.filter((g) => g.status.toLowerCase() !== "completed");
  }, [data, statusFilter]);

  const openEdit = async (g: GoalListItem) => {
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ["goals", "detail", g.id],
        queryFn: () => goalService.getById(g.id),
      });
      setETitle(detail.title);
      setETarget(String(detail.targetAmount));
      const d = detail.dueDate ? new Date(detail.dueDate) : new Date();
      setEDue(toDatetimeLocalValue(Number.isNaN(d.getTime()) ? new Date() : d));
      setEJar(detail.linkedJarId ?? "__none__");
      setENote(detail.note ?? "");
      setEditListItem(g);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không tải được chi tiết mục tiêu.",
      );
    }
  };

  const openCreate = () => {
    setCTitle("");
    setCTarget("");
    setCDue(toDatetimeLocalValue(new Date()));
    setCJar("__none__");
    setCNote("");
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(cTarget);
    if (!cTitle.trim()) return;
    if (!Number.isFinite(target) || target <= 0) {
      toast.error("Mục tiêu tiền phải lớn hơn 0.");
      return;
    }
    const parsedDue = new Date(cDue);
    if (Number.isNaN(parsedDue.getTime())) {
      setCDueError("Hạn không hợp lệ.");
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedDue < todayStart) {
      setCDueError("Hạn mục tiêu không được ở quá khứ.");
      return;
    }
    setCDueError(null);
    try {
      await createGoal({
        title: cTitle.trim(),
        targetAmount: target,
        dueDate: parsedDue.toISOString(),
        linkedJarId: cJar === "__none__" ? null : cJar,
        note: cNote.trim() || null,
      });
      toast.success("Đã tạo mục tiêu");
      setCreateOpen(false);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.field === "dueDate") setCDueError(parsed.message);
      toast.error(parsed.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editListItem) return;
    const target = Number(eTarget);
    if (!eTitle.trim()) return;
    if (!Number.isFinite(target) || target <= 0) {
      toast.error("Mục tiêu tiền phải lớn hơn 0.");
      return;
    }
    const parsedDue = new Date(eDue);
    if (Number.isNaN(parsedDue.getTime())) {
      setEDueError("Hạn không hợp lệ.");
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedDue < todayStart) {
      setEDueError("Hạn mục tiêu không được ở quá khứ.");
      return;
    }
    setEDueError(null);
    try {
      await updateGoal({
        id: editListItem.id,
        payload: {
          title: eTitle.trim(),
          targetAmount: target,
          dueDate: parsedDue.toISOString(),
          linkedJarId: eJar === "__none__" ? null : eJar,
          note: eNote.trim() || null,
        },
      });
      toast.success("Đã cập nhật mục tiêu");
      setEditListItem(null);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.field === "dueDate") setEDueError(parsed.message);
      toast.error(parsed.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGoal(deleteId);
      toast.success("Đã hủy mục tiêu");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không hủy được.");
    }
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải mục tiêu...</p>
    );
  }
  if (isError || !data) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được danh sách mục tiêu.</p>
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
        eyebrow="Tiết kiệm có đích"
        title="Mục tiêu"
        description={
          <>
            Gắn với một{" "}
            <Link
              to={ROUTES.JARS}
              className="font-semibold underline-offset-2 hover:underline"
            >
              hũ tiết kiệm
            </Link>{" "}
            để theo dõi tiến độ theo số tiền trong hũ.
          </>
        }
        actions={
          <Button
            type="button"
            className="brutal-btn-primary cursor-pointer"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo mục tiêu
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tất cả"],
            ["active", "Đang thực hiện"],
            ["completed", "Hoàn thành"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? "default" : "outline"}
            className={
              statusFilter === value
                ? "brutal-btn-primary cursor-pointer"
                : "brutal-btn-outline cursor-pointer"
            }
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredGoals.length === 0 ? (
          <Card className="brutal-card border-0 border-dashed shadow-none md:col-span-2">
            <CardContent className="py-10 text-center text-sm text-slate-600">
              <Target className="mx-auto mb-3 h-10 w-10 text-neutral-400" />
              <p>Chưa có mục tiêu nào.</p>
              <Button
                type="button"
                className="mt-4 brutal-btn-primary cursor-pointer"
                onClick={openCreate}
              >
                Tạo mục tiêu đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredGoals.map((goal) => (
            <Card
              key={goal.id}
              className="brutal-card border-0 shadow-none transition hover:bg-neutral-50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base text-[#0f172a]">
                      {goal.title}
                    </CardTitle>
                    <CardDescription>
                      Gợi ý mỗi tháng:{" "}
                      <span className="font-semibold">
                        {formatVnd(goal.suggestedMonthlyContribution)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="brutal-btn-outline cursor-pointer h-8 px-2"
                      onClick={() => void openEdit(goal)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer h-8 border-neutral-200 px-2 text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={() => setDeleteId(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {goal.linkedJarId && goal.linkedJarName ? (
                  <p className="flex flex-wrap items-center gap-1.5 text-slate-700">
                    <PiggyBank className="h-4 w-4 shrink-0 text-neutral-900" />
                    <span>Tiết kiệm qua hũ</span>
                    <Link
                      to={ROUTES.JARS}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {goal.linkedJarName}
                    </Link>
                  </p>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                    Chưa gắn hũ nên tiến độ đang là 0₫. Bạn có thể chọn hũ khi{" "}
                    <button
                      type="button"
                      className="font-semibold underline-offset-2 hover:underline"
                      onClick={() => void openEdit(goal)}
                    >
                      sửa mục tiêu
                    </button>{" "}
                    để đồng bộ với số dư hũ.
                  </p>
                )}
                <p className="text-slate-600">
                  Đã tiết kiệm:{" "}
                  <span className="font-semibold">
                    {formatVnd(goal.savedAmount)}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium text-slate-800">
                    {formatVnd(goal.targetAmount)}
                  </span>
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-[#a8e087] transition-all"
                    style={{
                      width: `${Math.min(100, goal.progressPercentage)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold">
                    {goal.progressPercentage.toFixed(1)}%
                  </span>
                  {" · "}
                  Hạn: {formatDue(goal.dueDate)} ·{" "}
                  {labelOf(GOAL_STATUS_LABELS, goal.status)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tạo mục tiêu</DialogTitle>
              <DialogDescription>
                Có thể gắn hũ để tự cập nhật tiến độ theo số dư hũ.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="g-c-title">Tên mục tiêu</Label>
                <Input
                  id="g-c-title"
                  value={cTitle}
                  onChange={(ev) => setCTitle(ev.target.value)}
                  placeholder="Du lịch Nhật"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="g-c-target">Số tiền mục tiêu (VND)</Label>
                <Input
                  id="g-c-target"
                  inputMode="numeric"
                  value={cTarget}
                  onChange={(ev) => setCTarget(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="g-c-due">Hạn (ngày giờ)</Label>
                <ScheduleDateTimePicker
                  id="g-c-due"
                  value={cDue}
                  onChange={(v) => {
                    setCDue(v);
                    setCDueError(null);
                  }}
                  disablePast
                  allowClear={false}
                />
                {cDueError ? (
                  <p className="text-sm text-red-500">{cDueError}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Hũ tiết kiệm (tùy chọn)</Label>
                <Select value={cJar} onValueChange={setCJar}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Không gắn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không gắn hũ</SelectItem>
                    {jars.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.name} ({formatVnd(j.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="g-c-note">Ghi chú</Label>
                <Input
                  id="g-c-note"
                  value={cNote}
                  onChange={(ev) => setCNote(ev.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline" className="brutal-btn-outline cursor-pointer"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="cursor-pointer bg-[#a8e087] text-[#0a0a0a]"
                disabled={creating}
              >
                {creating ? "Đang lưu..." : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editListItem !== null}
        onOpenChange={(o) => !o && setEditListItem(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Sửa mục tiêu</DialogTitle>
              <DialogDescription>
                Đổi hũ sẽ làm tiến độ bám theo số dư hũ mới.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên</Label>
                <Input
                  value={eTitle}
                  onChange={(ev) => setETitle(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Số tiền mục tiêu (VND)</Label>
                <Input
                  inputMode="numeric"
                  value={eTarget}
                  onChange={(ev) => setETarget(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Hạn</Label>
                <ScheduleDateTimePicker
                  value={eDue}
                  onChange={(v) => {
                    setEDue(v);
                    setEDueError(null);
                  }}
                  disablePast
                  allowClear={false}
                />
                {eDueError ? (
                  <p className="text-sm text-red-500">{eDueError}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Hũ tiết kiệm</Label>
                <Select value={eJar} onValueChange={setEJar}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không gắn hũ</SelectItem>
                    {jars.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.name} ({formatVnd(j.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ghi chú</Label>
                <Input
                  value={eNote}
                  onChange={(ev) => setENote(ev.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline" className="brutal-btn-outline cursor-pointer"
                onClick={() => setEditListItem(null)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="brutal-btn-primary cursor-pointer"
                disabled={updating}
              >
                {updating ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy mục tiêu?</AlertDialogTitle>
            <AlertDialogDescription>
              Trạng thái sẽ chuyển sang đã hủy trên server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Không</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "..." : "Hủy mục tiêu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
