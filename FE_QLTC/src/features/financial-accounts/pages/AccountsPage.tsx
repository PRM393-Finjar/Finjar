import { useState } from "react";
import { Link } from "react-router-dom";
import { Landmark, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { ROUTES } from "@/shared/constants/routes";
import { useFinancialAccounts } from "../hooks/useFinancialAccounts";
import {
  useCreateLinkApiFinancialAccount,
  useCreateManualFinancialAccount,
  useDeactivateFinancialAccount,
  useUpdateFinancialAccount,
} from "../hooks/useFinancialAccountMutations";
import type { FinancialAccountItem } from "../types";

const ACCOUNT_TYPES = ["Cash", "Bank", "EWallet", "Other"] as const;

const formatCurrency = (amount: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

function connectionLabel(mode: string) {
  if (mode === "LinkedApi") return "Liên kết API (SePay)";
  if (mode === "Manual") return "Thủ công";
  return mode;
}

export function AccountsPage() {
  const { data = [], isLoading, isError, refetch } = useFinancialAccounts();
  const { mutateAsync: createManual, isPending: creatingManual } =
    useCreateManualFinancialAccount();
  const { mutateAsync: createLink, isPending: creatingLink } =
    useCreateLinkApiFinancialAccount();
  const { mutateAsync: updateAcc, isPending: updating } =
    useUpdateFinancialAccount();
  const { mutateAsync: deactivate, isPending: deactivating } =
    useDeactivateFinancialAccount();

  const [manualOpen, setManualOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editItem, setEditItem] = useState<FinancialAccountItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [mName, setMName] = useState("");
  const [mType, setMType] = useState<string>(ACCOUNT_TYPES[0]);
  const [mBalance, setMBalance] = useState("0");
  const [mCurrency, setMCurrency] = useState("VND");
  const [mDefault, setMDefault] = useState(false);

  const [lBank, setLBank] = useState("");
  const [lCode, setLCode] = useState("");
  const [lNumber, setLNumber] = useState("");
  const [lHolder, setLHolder] = useState("");
  const [lDefault, setLDefault] = useState(false);

  const [eName, setEName] = useState("");
  const [eBalance, setEBalance] = useState("");
  const [eDefault, setEDefault] = useState(false);

  const openManual = () => {
    setMName("");
    setMType(ACCOUNT_TYPES[0]);
    setMBalance("0");
    setMCurrency("VND");
    setMDefault(false);
    setManualOpen(true);
  };

  const openLink = () => {
    setLBank("");
    setLCode("");
    setLNumber("");
    setLHolder("");
    setLDefault(false);
    setLinkOpen(true);
  };

  const openEdit = (a: FinancialAccountItem) => {
    setEditItem(a);
    setEName(a.name);
    setEBalance(String(a.currentBalance));
    setEDefault(a.isDefault);
  };

  const submitManual = async () => {
    try {
      await createManual({
        name: mName.trim(),
        accountType: mType,
        currentBalance: Number(mBalance) || 0,
        currency: mCurrency.trim().toUpperCase() || "VND",
        isDefault: mDefault,
      });
      toast.success("Đã tạo tài khoản thủ công");
      setManualOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được");
    }
  };

  const submitLink = async () => {
    try {
      await createLink({
        bankName: lBank.trim(),
        bankCode: lCode.trim() || null,
        accountNumber: lNumber.trim(),
        accountHolderName: lHolder.trim() || null,
        isDefault: lDefault,
      });
      toast.success("Đã tạo tài khoản liên kết");
      setLinkOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không liên kết được");
    }
  };

  const submitEdit = async () => {
    if (!editItem) return;
    try {
      await updateAcc({
        id: editItem.id,
        payload: {
          name: eName.trim(),
          currentBalance: Number(eBalance) || 0,
          isDefault: eDefault,
        },
      });
      toast.success("Đã cập nhật");
      setEditItem(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deactivate(deleteId);
      toast.success("Đã ngừng theo dõi tài khoản");
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xóa được");
    }
  };

  const onSyncSePay = () => {
    toast.message("Đồng bộ SePay", {
      description:
        "Webhook SePay sẽ tự cập nhật khi có biến động số dư.",
    });
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải nguồn tiền...</p>
    );
  }

  if (isError) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được danh sách.</p>
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
        eyebrow="Tài khoản"
        title="Nguồn tiền"
        description="Tài khoản thủ công và liên kết ngân hàng qua SePay."
        actions={
          <>
            <Button
              type="button"
              className="brutal-btn-primary cursor-pointer gap-2"
              onClick={openManual}
            >
              <Plus className="h-4 w-4" />
              Thêm thủ công
            </Button>
            <Button
              type="button"
              variant="outline"
              className="brutal-btn-outline cursor-pointer gap-2"
              onClick={openLink}
            >
              <Landmark className="h-4 w-4" />
              Liên kết ngân hàng
            </Button>
          </>
        }
      />

      {data.length === 0 ? (
        <Card className="brutal-card border-0 border-dashed shadow-none">
          <CardContent className="py-12 text-center text-sm text-slate-600">
            <Landmark className="mx-auto mb-3 h-10 w-10 text-neutral-400" />
            <p>Chưa có nguồn tiền nào.</p>
            <p className="mt-1">
              Tạo tài khoản Cash thủ công hoặc liên kết STK ngân hàng.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                className="brutal-btn-primary cursor-pointer"
                onClick={openManual}
              >
                Thêm thủ công
              </Button>
              <Button
                type="button"
                variant="outline"
                className="brutal-btn-outline"
                onClick={openLink}
              >
                Liên kết ngân hàng
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <Card
              key={a.id}
              className="brutal-card border-0 shadow-none transition hover:bg-neutral-50"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <CardDescription>
                      {a.accountType} · {connectionLabel(a.connectionMode)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.isDefault ? (
                      <Badge variant="default">Mặc định</Badge>
                    ) : null}
                    <Badge variant={a.isActive ? "success" : "secondary"}>
                      {a.isActive ? "Đang dùng" : "Ngừng theo dõi"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-2xl font-semibold">
                  {formatCurrency(a.currentBalance, a.currency)}
                </p>
                <dl className="grid gap-1 text-slate-600">
                  <div className="flex justify-between">
                    <dt>Đồng bộ</dt>
                    <dd>{a.syncStatus}</dd>
                  </div>
                  {a.providerName ? (
                    <div className="flex justify-between">
                      <dt>Nhà cung cấp</dt>
                      <dd>{a.providerName}</dd>
                    </div>
                  ) : null}
                  {a.maskedAccountNumber ? (
                    <div className="flex justify-between">
                      <dt>STK</dt>
                      <dd className="font-mono">{a.maskedAccountNumber}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1.5 brutal-btn-outline hover:text-[#4F46E5]"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  {a.connectionMode === "LinkedApi" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5 brutal-btn-outline"
                      onClick={onSyncSePay}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync SePay
                    </Button>
                  ) : null}
                  {a.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5 border-neutral-200 text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={() => setDeleteId(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Ngừng theo dõi
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="brutal-card border-0 py-3 text-center text-sm text-slate-600">
        <Link
          to={ROUTES.TRANSACTIONS_ADD}
          className="font-semibold underline-offset-2 hover:underline"
        >
          Thêm giao dịch
        </Link>{" "}
        — chọn tài khoản nguồn khi ghi nhận thu chi.
      </p>

      {/* Thêm thủ công */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tài khoản thủ công</DialogTitle>
            <DialogDescription>
              Loại: Cash, Bank, EWallet, Other — khớp validation BE.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="acc-m-name">Tên hiển thị</Label>
              <Input
                id="acc-m-name"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder="Ví dụ: Tiền mặt chính"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-m-type">Loại</Label>
              <select
                id="acc-m-type"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={mType}
                onChange={(e) => setMType(e.target.value)}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="acc-m-bal">Số dư hiện tại</Label>
                <Input
                  id="acc-m-bal"
                  type="number"
                  value={mBalance}
                  onChange={(e) => setMBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-m-ccy">Tiền tệ (3 ký tự)</Label>
                <Input
                  id="acc-m-ccy"
                  value={mCurrency}
                  onChange={(e) => setMCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mDefault}
                onChange={(e) => setMDefault(e.target.checked)}
                className="h-4 w-4 accent-[#a8e087]"
              />
              Đặt làm tài khoản mặc định
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="brutal-btn-primary cursor-pointer"
              disabled={creatingManual || !mName.trim()}
              onClick={() => void submitManual()}
            >
              {creatingManual ? "Đang lưu…" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liên kết API */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Liên kết ngân hàng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="acc-l-bank">Tên ngân hàng</Label>
              <Input
                id="acc-l-bank"
                value={lBank}
                onChange={(e) => setLBank(e.target.value)}
                placeholder="Vietcombank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-l-code">Mã ngân hàng (tuỳ chọn)</Label>
              <Input
                id="acc-l-code"
                value={lCode}
                onChange={(e) => setLCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-l-num">Số tài khoản</Label>
              <Input
                id="acc-l-num"
                value={lNumber}
                onChange={(e) => setLNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-l-holder">Chủ tài khoản (tuỳ chọn)</Label>
              <Input
                id="acc-l-holder"
                value={lHolder}
                onChange={(e) => setLHolder(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lDefault}
                onChange={(e) => setLDefault(e.target.checked)}
                className="h-4 w-4 accent-[#a8e087]"
              />
              Đặt làm mặc định
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="brutal-btn-primary cursor-pointer"
              disabled={
                creatingLink || !lBank.trim() || !lNumber.trim()
              }
              onClick={() => void submitLink()}
            >
              {creatingLink ? "Đang lưu…" : "Liên kết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sửa */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa tài khoản</DialogTitle>
            <DialogDescription>
              Tài khoản liên kết: không đổi số dư thủ công (theo BE).
            </DialogDescription>
          </DialogHeader>
          {editItem ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="acc-e-name">Tên</Label>
                <Input
                  id="acc-e-name"
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-e-bal">Số dư</Label>
                <Input
                  id="acc-e-bal"
                  type="number"
                  value={eBalance}
                  onChange={(e) => setEBalance(e.target.value)}
                />
                {editItem.connectionMode === "LinkedApi" ? (
                  <p className="text-xs text-neutral-500">
                    Số dư SePay có thể chỉnh tay; webhook sẽ đồng bộ lại khi có giao dịch.
                  </p>
                ) : null}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={eDefault}
                  onChange={(e) => setEDefault(e.target.checked)}
                  className="h-4 w-4 accent-[#a8e087]"
                />
                Mặc định
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="brutal-btn-primary cursor-pointer"
              disabled={updating || !editItem}
              onClick={() => void submitEdit()}
            >
              {updating ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ngừng theo dõi tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              BE sẽ đánh dấu không còn hoạt động (soft). Bạn có thể xem lại trong
              lịch sử nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Hủy</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deactivating}
                onClick={() => void confirmDelete()}
              >
                {deactivating ? "Đang xử lý…" : "Xác nhận"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
