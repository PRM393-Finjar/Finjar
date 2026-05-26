import { useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { useUserCategories } from "@/features/categories";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";
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
  useCancelReminder,
  useCreateReminder,
  useUpdateReminder,
} from "../hooks/useReminderMutations";
import { useReminders } from "../hooks/useReminders";
import {
  labelOf,
  REMINDER_FREQUENCY_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/shared/constants/userCopy";
import { formatVnd } from "@/shared/lib/formatCurrency";
import type { ReminderFrequency, ReminderItem, ReminderStatus } from "../types";

const FREQ_OPTIONS: ReminderFrequency[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
];

export function RemindersPage() {
  const { data, isLoading, isError, refetch } = useReminders();
  const { data: categories = [] } = useUserCategories();
  const { mutateAsync: createR, isPending: creating } = useCreateReminder();
  const { mutateAsync: updateR, isPending: updating } = useUpdateReminder();
  const { mutateAsync: cancelR, isPending: cancelling } = useCancelReminder();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ReminderItem | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const [cTitle, setCTitle] = useState("");
  const [cAmount, setCAmount] = useState("");
  const [cFreq, setCFreq] = useState<ReminderFrequency>("Monthly");
  const [cDay, setCDay] = useState("");
  const [cCategory, setCCategory] = useState("__none__");
  const [cNotify, setCNotify] = useState("1");
  const [cNote, setCNote] = useState("");
  const [cStart, setCStart] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [eTitle, setETitle] = useState("");
  const [eAmount, setEAmount] = useState("");
  const [eFreq, setEFreq] = useState<ReminderFrequency>("Monthly");
  const [eDay, setEDay] = useState("");
  const [eStatus, setEStatus] = useState<ReminderStatus>("Active");
  const [eNotify, setENotify] = useState("");
  const [eNote, setENote] = useState("");

  const list = useMemo(() => data ?? [], [data]);

  const openCreate = () => {
    setCTitle("");
    setCAmount("");
    setCFreq("Monthly");
    setCDay("");
    setCCategory("__none__");
    setCNotify("1");
    setCNote("");
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setCStart(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
    setCreateOpen(true);
  };

  const openEdit = (r: ReminderItem) => {
    setEditItem(r);
    setETitle(r.title);
    setEAmount(String(r.amount));
    setEFreq((r.frequency as ReminderFrequency) || "Monthly");
    setEDay("");
    setEStatus((r.status as ReminderStatus) || "Active");
    setENotify("");
    setENote("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cAmount);
    if (!cTitle.trim()) return;
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Số tiền không hợp lệ.");
      return;
    }
    const parsedStart = new Date(cStart);
    if (Number.isNaN(parsedStart.getTime())) {
      toast.error("Ngày bắt đầu không hợp lệ.");
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedStart < todayStart) {
      toast.error("Ngày bắt đầu phải từ hôm nay trở đi.");
      return;
    }
    const dayNum = cDay.trim() === "" ? undefined : Number(cDay);
    if (dayNum !== undefined && (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31)) {
      toast.error("Ngày trong tháng phải từ 1–31.");
      return;
    }
    const notify = cNotify.trim() === "" ? undefined : Number(cNotify);
    if (notify !== undefined && (!Number.isFinite(notify) || notify < 0)) {
      toast.error("Số ngày nhắc trước không hợp lệ.");
      return;
    }
    try {
      await createR({
        title: cTitle.trim(),
        amount,
        frequency: cFreq,
        dayOfMonth: dayNum,
        startDate: parsedStart.toISOString(),
        categoryId: cCategory === "__none__" ? null : cCategory,
        notifyDaysBefore: notify ?? null,
        note: cNote.trim() || null,
      });
      toast.success("Đã tạo nhắc lịch");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tạo được.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const amount = eAmount.trim() === "" ? undefined : Number(eAmount);
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      toast.error("Số tiền không hợp lệ.");
      return;
    }
    const dayNum = eDay.trim() === "" ? undefined : Number(eDay);
    if (dayNum !== undefined && (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31)) {
      toast.error("Ngày trong tháng phải từ 1–31.");
      return;
    }
    const notify = eNotify.trim() === "" ? undefined : Number(eNotify);
    if (notify !== undefined && (!Number.isFinite(notify) || notify < 0)) {
      toast.error("Số ngày nhắc trước không hợp lệ.");
      return;
    }
    try {
      await updateR({
        id: editItem.id,
        payload: {
          title: eTitle.trim(),
          ...(amount !== undefined ? { amount } : {}),
          frequency: eFreq,
          ...(dayNum !== undefined ? { dayOfMonth: dayNum } : {}),
          status: eStatus,
          ...(notify !== undefined ? { notifyDaysBefore: notify } : {}),
          note: eNote,
        },
      });
      toast.success("Đã cập nhật nhắc lịch");
      setEditItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không cập nhật được.");
    }
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelR(cancelId);
      toast.success("Đã hủy nhắc nhở");
      setCancelId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không hủy được.");
    }
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải nhắc lịch...</p>
    );
  }
  if (isError || data === undefined) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được nhắc lịch.</p>
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
        eyebrow="Thanh toán định kỳ"
        title="Nhắc lịch"
        description="Nhắc thanh toán định kỳ (điện, học phí…)."
        actions={
          <Button
            type="button"
            className="brutal-btn-primary cursor-pointer"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo nhắc lịch
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {list.length === 0 ? (
          <Card className="brutal-card border-0 border-dashed shadow-none md:col-span-2">
            <CardContent className="py-10 text-center text-sm text-slate-600">
              Chưa có nhắc lịch nào. Nhấn &quot;Tạo nhắc lịch&quot; để thêm.
            </CardContent>
          </Card>
        ) : (
          list.map((r) => (
            <Card
              key={r.id}
              className="brutal-card border-0 shadow-none transition hover:bg-neutral-50"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[#0f172a]">{r.title}</CardTitle>
                <CardDescription className="text-slate-600">
                  {labelOf(REMINDER_FREQUENCY_LABELS, r.frequency)} ·{" "}
                  {labelOf(REMINDER_STATUS_LABELS, r.status)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>
                  Số tiền:{" "}
                  <span className="font-semibold">
                    {formatVnd(r.amount)}
                  </span>
                </p>
                <p>
                  Lần tới:{" "}
                  <span className="font-medium text-slate-800">
                    {r.nextDueDate
                      ? format(new Date(r.nextDueDate), "PPp", { locale: vi })
                      : "—"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer"
                    onClick={() => openEdit(r)}
                  >
                    Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer text-red-600 hover:bg-red-50"
                    onClick={() => setCancelId(r.id)}
                  >
                    Hủy nhắc nhở
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tạo nhắc lịch</DialogTitle>
              <DialogDescription>
                Đặt tần suất và ngày bắt đầu. Có thể gắn danh mục tùy chọn.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="r-title">Tiêu đề</Label>
                <Input
                  id="r-title"
                  value={cTitle}
                  onChange={(ev) => setCTitle(ev.target.value)}
                  placeholder="Tiền điện tháng"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-amt">Số tiền (VND)</Label>
                <Input
                  id="r-amt"
                  inputMode="numeric"
                  value={cAmount}
                  onChange={(ev) => setCAmount(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tần suất</Label>
                <Select
                  value={cFreq}
                  onValueChange={(v) => setCFreq(v as ReminderFrequency)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQ_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {labelOf(REMINDER_FREQUENCY_LABELS, f)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-day">Ngày trong tháng (1–31, tùy chọn)</Label>
                <Input
                  id="r-day"
                  inputMode="numeric"
                  value={cDay}
                  onChange={(ev) => setCDay(ev.target.value)}
                  placeholder="Để trống = theo ngày bắt đầu"
                />
              </div>
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <ScheduleDateTimePicker
                  value={cStart}
                  onChange={setCStart}
                  disablePast
                  allowClear={false}
                />
              </div>
              <div className="grid gap-2">
                <Label>Danh mục (tùy chọn)</Label>
                <Select value={cCategory} onValueChange={setCCategory}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Không chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không chọn</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-notify">Nhắc trước (ngày)</Label>
                <Input
                  id="r-notify"
                  inputMode="numeric"
                  value={cNotify}
                  onChange={(ev) => setCNotify(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-note">Ghi chú</Label>
                <Input
                  id="r-note"
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
                Đóng
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Sửa nhắc lịch</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={eTitle}
                  onChange={(ev) => setETitle(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Số tiền (VND)</Label>
                <Input
                  inputMode="numeric"
                  value={eAmount}
                  onChange={(ev) => setEAmount(ev.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tần suất</Label>
                <Select
                  value={eFreq}
                  onValueChange={(v) => setEFreq(v as ReminderFrequency)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQ_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {labelOf(REMINDER_FREQUENCY_LABELS, f)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ngày trong tháng (tùy chọn)</Label>
                <Input
                  inputMode="numeric"
                  value={eDay}
                  onChange={(ev) => setEDay(ev.target.value)}
                  placeholder="Giữ nguyên nếu để trống"
                />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={eStatus}
                  onValueChange={(v) => setEStatus(v as ReminderStatus)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      {REMINDER_STATUS_LABELS.Active}
                    </SelectItem>
                    <SelectItem value="Paused">
                      {REMINDER_STATUS_LABELS.Paused}
                    </SelectItem>
                    <SelectItem value="Completed">
                      {REMINDER_STATUS_LABELS.Completed}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nhắc trước (ngày, để trống = không đổi)</Label>
                <Input
                  inputMode="numeric"
                  value={eNotify}
                  onChange={(ev) => setENotify(ev.target.value)}
                />
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
                onClick={() => setEditItem(null)}
              >
                Đóng
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

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy nhắc nhở?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhắc lịch sẽ chuyển sang trạng thái đã hủy và biến khỏi danh sách.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Không</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              onClick={() => void confirmCancel()}
              disabled={cancelling}
            >
              {cancelling ? "Đang xử lý..." : "Hủy nhắc nhở"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
