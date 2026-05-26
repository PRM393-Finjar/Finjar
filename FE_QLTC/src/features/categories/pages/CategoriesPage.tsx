import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
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
import { CategoryAppearancePicker } from "@/shared/components/CategoryAppearancePicker";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  isValidHexColor,
} from "@/shared/components/categoryAppearance";
import { getCategoryDisplayName } from "@/shared/constants/userCopy";
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
import {
  useCreateUserCategory,
  useDeleteUserCategory,
  useUpdateUserCategory,
} from "../hooks/useCategoryMutations";
import { useUserCategoriesGrouped } from "../hooks/useUserCategoriesGrouped";
import type { UserCategoryOption } from "../types";

export function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useUserCategoriesGrouped();
  const { mutateAsync: createCat, isPending: creating } = useCreateUserCategory();
  const { mutateAsync: updateCat, isPending: updating } = useUpdateUserCategory();
  const { mutateAsync: deleteCat, isPending: deleting } = useDeleteUserCategory();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserCategoryOption | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [cName, setCName] = useState("");
  const [cIcon, setCIcon] = useState("");
  const [cColor, setCColor] = useState("");

  const [eName, setEName] = useState("");
  const [eIcon, setEIcon] = useState("");
  const [eColor, setEColor] = useState("");

  const openCreate = () => {
    setCName("");
    setCIcon(CATEGORY_ICON_OPTIONS[0].id);
    setCColor(CATEGORY_COLOR_OPTIONS[0]);
    setCreateOpen(true);
  };

  const openEdit = (c: UserCategoryOption) => {
    setEditItem(c);
    setEName(c.name);
    setEIcon(c.icon ?? "");
    setEColor(c.color ?? "");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    if (!cIcon.trim()) {
      toast.error("Chọn icon cho danh mục.");
      return;
    }
    if (cColor.trim() && !isValidHexColor(cColor)) {
      toast.error("Màu không hợp lệ. Chọn từ bảng màu có sẵn.");
      return;
    }
    try {
      await createCat({
        name: cName.trim(),
        icon: cIcon.trim() || null,
        color: cColor.trim() || null,
      });
      toast.success("Đã tạo danh mục");
      setCreateOpen(false);
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !eName.trim()) return;
    if (eColor.trim() && !isValidHexColor(eColor)) {
      toast.error("Màu không hợp lệ. Chọn từ bảng màu có sẵn.");
      return;
    }
    try {
      await updateCat({
        id: editItem.id,
        payload: {
          name: eName.trim(),
          icon: eIcon.trim() || null,
          color: eColor.trim() || null,
        },
      });
      toast.success("Đã cập nhật danh mục");
      setEditItem(null);
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCat(deleteId);
      toast.success("Đã xóa danh mục");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được.");
    }
  };

  if (isLoading) {
    return (
      <p className="brutal-loading text-sm">Đang tải danh mục...</p>
    );
  }
  if (isError || !data) {
    return (
      <div className="brutal-error-box space-y-3">
        <p className="text-sm text-red-600">Không tải được danh mục.</p>
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
    <section className="space-y-8">
      <BrutalPageHeader
        eyebrow="Phân loại"
        title="Danh mục"
        description="Danh mục hệ thống (chỉ xem) và danh mục của bạn."
        actions={
          <Button
            type="button"
            className="brutal-btn-primary cursor-pointer"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo danh mục
          </Button>
        }
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">
          Danh mục mặc định
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.defaultCategories.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có danh mục mặc định.</p>
          ) : (
            data.defaultCategories.map((c) => (
              <span
                key={c.id}
                className="brutal-pill inline-flex items-center px-3 py-1 text-sm text-slate-700"
              >
                {getCategoryDisplayName(c.name, "default")}
              </span>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">
          Danh mục của bạn
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.customCategories.length === 0 ? (
            <p className="text-sm text-slate-500 sm:col-span-2">
              Chưa có danh mục tùy chỉnh.
            </p>
          ) : (
            data.customCategories.map((c) => (
              <Card
                key={c.id}
                className="brutal-card border-0 shadow-none transition hover:bg-neutral-50"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#0f172a]">{c.name}</CardTitle>
                  <CardDescription>
                    {c.color ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: c.color }}
                        />
                        Danh mục của bạn
                      </span>
                    ) : (
                      "Danh mục của bạn"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="brutal-btn-outline cursor-pointer text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Xóa
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tạo danh mục</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cc-name">Tên</Label>
                <Input
                  id="cc-name"
                  value={cName}
                  onChange={(ev) => setCName(ev.target.value)}
                  placeholder="Ví dụ: Ăn ngoài"
                />
              </div>
              <CategoryAppearancePicker
                icon={cIcon}
                color={cColor}
                onIconChange={setCIcon}
                onColorChange={setCColor}
              />
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
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Sửa danh mục</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ee-name">Tên</Label>
                <Input
                  id="ee-name"
                  value={eName}
                  onChange={(ev) => setEName(ev.target.value)}
                />
              </div>
              <CategoryAppearancePicker
                icon={eIcon}
                color={eColor}
                onIconChange={setEIcon}
                onColorChange={setEColor}
              />
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
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Các giao dịch đang dùng danh mục này có thể bị ảnh hưởng. Tiếp tục?
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
