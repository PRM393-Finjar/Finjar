import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { useUserCategories } from "@/features/categories";
import { useJars } from "@/features/jars/hooks/useJars";
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
import {
  useCreateBudgetLimit,
  useDeleteBudgetLimit,
  useUpdateBudgetLimit,
} from "../hooks/useBudgetMutations";
import { useBudgetLimits } from "../hooks/useBudget";
import {
  BUDGET_STATUS_LABELS,
  getCategoryDisplayName,
  labelOf,
} from "@/shared/constants/userCopy";
import { formatVnd } from "@/shared/lib/formatCurrency";
import type { BudgetLimit } from "../types";

export function BudgetPage() {
  const { data, isLoading, isError, refetch } = useBudgetLimits();
  const { data: jars = [] } = useJars();
  const { data: categories = [] } = useUserCategories();
  const { mutateAsync: createLimit, isPending: creating } = useCreateBudgetLimit();
  const { mutateAsync: updateLimit, isPending: updating } = useUpdateBudgetLimit();
  const { mutateAsync: deleteLimit, isPending: deleting } = useDeleteBudgetLimit();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetLimit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [cTargetType, setCTargetType] = useState<"Jar" | "Category">("Jar");
  const [cTargetId, setCTargetId] = useState("");
  const [cLimit, setCLimit] = useState("");
  const [cPeriod, setCPeriod] = useState<"Daily" | "Monthly">("Monthly");
  const [cAlert, setCAlert] = useState("80");

  const [eLimit, setELimit] = useState("");
  const [eAlert, setEAlert] = useState("");

  const targetOptions = useMemo(() => {
    if (cTargetType === "Jar") {
      return jars.map((j) => ({ id: j.id, label: j.name }));
    }
    return categories.map((c) => ({
      id: c.id,
      label: getCategoryDisplayName(c.name, c.kind),
    }));
  }, [cTargetType, jars, categories]);

  const openCreate = () => {
    setCTargetType("Jar");
    setCTargetId("");
    setCLimit("");
    setCPeriod("Monthly");
    setCAlert("80");
    setCreateOpen(true);
  };

  const openEdit = (item: BudgetLimit) => {
    setEditItem(item);
    setELimit(String(item.limitAmount));
    setEAlert(String(item.alertAtPercentage));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cLimit);
    const alertPct = Number(cAlert);
    if (!cTargetId) {
      toast.error("Chọn đối tượng áp hạn mức.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Hạn mức phải lớn hơn 0.");
      return;
    }
    if (!Number.isFinite(alertPct) || alertPct <= 0 || alertPct > 100) {
      toast.error("Ngưỡng cảnh báo phải từ 1–100%.");
      return;
    }
    try {
      await createLimit({
        targetType: cTargetType,
        targetId: cTargetId,
        limitAmount: amount,
        period: cPeriod,
        alertAtPercentage: alertPct,
      });
      toast.success("Đã tạo hạn mức");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tạo được hạn mức.");
    }
  };

  const handleUpdate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editItem) return;
    const amount = eLimit.trim() === "" ? undefined : Number(eLimit);
    const alertPct = eAlert.trim() === "" ? undefined : Number(eAlert);
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error("Hạn mức không hợp lệ.");
      return;
    }
    if (
      alertPct !== undefined &&
      (!Number.isFinite(alertPct) || alertPct <= 0 || alertPct > 100)
    ) {
      toast.error("Ngưỡng cảnh báo phải từ 1–100%.");
      return;
    }
    try {
      await updateLimit({
        id: editItem.id,
        payload: {
          ...(amount !== undefined ? { limitAmount: amount } : {}),
          ...(alertPct !== undefined ? { alertAtPercentage: alertPct } : {}),
        },
      });
      toast.success("Đã cập nhật hạn mức");
      setEditItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không cập nhật được.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLimit(deleteId);
      toast.success("Đã xóa hạn mức");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được.");
    }
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải ngân sách...</p>
    );
  }
  if (isError || !data) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được hạn mức chi tiêu.</p>
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
        eyebrow="Hạn mức chi tiêu"
        title="Ngân sách"
        description="Hạn mức theo hũ hoặc danh mục, kỳ ngày/tháng và ngưỡng cảnh báo."
        actions={
          <Button
            type="button"
            className="brutal-btn-primary cursor-pointer"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm hạn mức
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 md:col-span-2">
            Chưa có hạn mức nào. Nhấn &quot;Thêm hạn mức&quot; để tạo.
          </p>
        ) : (
          data.map((item) => (
            <Card
              key={item.id}
              className="brutal-card border-0 shadow-none transition hover:bg-neutral-50"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[#0f172a]">
                  {item.targetName}
                </CardTitle>
                <CardDescription>
                  {item.targetType === "Jar" ? "Hũ" : "Danh mục"} · Kỳ{" "}
                  {item.period === "Daily" ? "ngày" : "tháng"} · Cảnh báo khi đạt{" "}
                  {item.alertAtPercentage}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                  <span>
                    Hạn mức:{" "}
                    <span className="font-semibold">
                      {formatVnd(item.limitAmount)}
                    </span>
                  </span>
                  <span>Đã chi: {formatVnd(item.currentSpent)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-[#a8e087] transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.currentPercentage))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {item.currentPercentage.toFixed(1)}% hạn mức ·{" "}
                  {labelOf(BUDGET_STATUS_LABELS, item.status)}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Thêm hạn mức</DialogTitle>
              <DialogDescription>
                Chọn hũ hoặc danh mục, nhập số tiền tối đa trong kỳ.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Loại đối tượng</Label>
                <Select
                  value={cTargetType}
                  onValueChange={(v) => {
                    setCTargetType(v as "Jar" | "Category");
                    setCTargetId("");
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jar">Hũ</SelectItem>
                    <SelectItem value="Category">Danh mục</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Đối tượng</Label>
                <Select value={cTargetId} onValueChange={setCTargetId}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Chọn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-limit">Hạn mức (VND)</Label>
                <Input
                  id="c-limit"
                  inputMode="numeric"
                  value={cLimit}
                  onChange={(ev) => setCLimit(ev.target.value)}
                  placeholder="5000000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Kỳ</Label>
                <Select
                  value={cPeriod}
                  onValueChange={(v) => setCPeriod(v as "Daily" | "Monthly")}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Theo ngày</SelectItem>
                    <SelectItem value="Monthly">Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-alert">Cảnh báo khi đạt (%)</Label>
                <Input
                  id="c-alert"
                  inputMode="numeric"
                  value={cAlert}
                  onChange={(ev) => setCAlert(ev.target.value)}
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
                className="brutal-btn-primary cursor-pointer"
                disabled={creating}
              >
                {creating ? "Đang lưu..." : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Sửa hạn mức</DialogTitle>
              <DialogDescription>
                {editItem?.targetName} — chỉ đổi được số tiền và ngưỡng cảnh báo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="e-limit">Hạn mức (VND)</Label>
                <Input
                  id="e-limit"
                  inputMode="numeric"
                  value={eLimit}
                  onChange={(ev) => setELimit(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-alert">Cảnh báo khi đạt (%)</Label>
                <Input
                  id="e-alert"
                  inputMode="numeric"
                  value={eAlert}
                  onChange={(ev) => setEAlert(ev.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline" className="brutal-btn-outline cursor-pointer"
                onClick={() => setEditItem(null)}
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
            <AlertDialogTitle>Xóa hạn mức?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không hoàn tác. Bạn có chắc muốn xóa hạn mức này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
