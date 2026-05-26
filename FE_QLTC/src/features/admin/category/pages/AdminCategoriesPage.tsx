import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
  useAdminCategory,
  useDeleteCategoryMutation,
  type AdminCategoryStatusFilter,
} from "../hooks/useAdminCategory";
import type { Category } from "../type";
import { CategoryFormModal } from "../components/CategoryFormModal";
import { CategoryActiveToggle } from "../components/CategoryActiveToggle";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const STATUS_FILTER_OPTIONS: {
  value: AdminCategoryStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Đã tắt" },
];

function IconToken({ icon }: { icon: string }) {
  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border bg-white px-1 text-xs font-medium uppercase text-slate-600">
      {icon.slice(0, 2)}
    </span>
  );
}

export default function AdminCategoriesPage() {
  const [statusFilter, setStatusFilter] =
    useState<AdminCategoryStatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const formNeedsFullList = formOpen && statusFilter !== "all";
  const { data, isLoading, isError } = useAdminCategory(statusFilter);
  const { data: allCategoriesData } = useAdminCategory("all", {
    enabled: formNeedsFullList,
  });
  const deleteMutation = useDeleteCategoryMutation();

  const openCreate = () => {
    setFormMode("create");
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setFormMode("edit");
    setEditingCategory(category);
    setFormOpen(true);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>;
  if (isError || !data) return <p className="text-sm text-red-500">Không thể tải danh mục mặc định.</p>;

  const categories = data.data;
  const categoriesForFormModal =
    statusFilter === "all"
      ? categories
      : (allCategoriesData?.data ?? categories);
  const activeCount = categories.filter((item) => item.isActive).length;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Danh mục quản trị</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục mặc định cho người dùng mới.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {statusFilter === "all" ? "Tổng danh mục" : "Đang hiển thị"}
            </p>
            <p className="mt-1 text-2xl font-semibold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tạm ẩn</p>
            <p className="mt-1 text-2xl font-semibold text-slate-500">
              {categories.length - activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {statusFilter !== "all" ? (
        <p className="text-xs text-muted-foreground">
          Thống kê trên hàng thẻ theo đúng danh sách sau khi lọc (API query{" "}
          <span className="font-mono text-[11px]">isActive</span>).
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle>Danh mục mặc định</CardTitle>
            <p className="text-xs text-muted-foreground">
              Lọc theo trạng thái hiển thị cho người dùng.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:w-56">
            <Label htmlFor="admin-category-status" className="text-xs">
              Trạng thái
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as AdminCategoryStatusFilter)
              }
            >
              <SelectTrigger id="admin-category-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
            onClick={openCreate}
          >
            Thêm danh mục
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có danh mục nào khớp bộ lọc.
            </p>
          ) : null}
          {categories.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-md border bg-white p-3 text-sm md:grid md:grid-cols-[56px_minmax(0,1fr)_120px_72px_88px_minmax(0,auto)] md:items-center md:gap-3"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">#{item.order}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-200"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-xs text-muted-foreground">{item.color}</span>
              </div>
              <div className="flex items-center">
                <IconToken icon={item.icon} />
              </div>
              <div className="flex items-center md:justify-center">
                <CategoryActiveToggle category={item} />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                  Sửa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteTarget(item)}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CategoryFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialCategory={editingCategory}
        categories={categoriesForFormModal}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Danh mục &quot;{deleteTarget?.name}&quot; sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
