import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { Category } from "../type";
import {
  useAddCategoryMutation,
  useUpdateCategoryMutation,
} from "../hooks/useAdminCategory";

const categoryModalSchema = z.object({
  name: z.string().min(1, "Nhập tên danh mục"),
  icon: z.string().min(1, "Nhập icon"),
  color: z.string().min(1, "Nhập màu"),
  order: z.number().int().min(1, "Thứ tự tối thiểu là 1"),
  isActive: z.boolean(),
});

type CategoryModalFormValues = z.infer<typeof categoryModalSchema>;

type CategoryFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialCategory: Category | null;
  categories: Category[];
};

function computeNextOrder(list: Category[]): number {
  if (list.length === 0) return 1;
  return Math.max(...list.map((c) => c.order)) + 1;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  mode,
  initialCategory,
  categories,
}: CategoryFormModalProps) {
  const addMutation = useAddCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CategoryModalFormValues>({
    resolver: zodResolver(categoryModalSchema),
    defaultValues: {
      name: "",
      icon: "",
      color: "#6366F1",
      order: 1,
      isActive: true,
    },
  });

  const isActive = useWatch({ control, name: "isActive", defaultValue: true });
  const colorValue = useWatch({ control, name: "color", defaultValue: "#6366F1" });

  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      reset({
        name: "",
        icon: "",
        color: "#6366F1",
        order: computeNextOrder(categories),
        isActive: true,
      });
      return;
    }

    if (initialCategory) {
      reset({
        name: initialCategory.name,
        icon: initialCategory.icon,
        color: initialCategory.color,
        order: initialCategory.order,
        isActive: initialCategory.isActive,
      });
    }
  }, [open, mode, initialCategory, categories, reset]);

  const pending = addMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: CategoryModalFormValues) => {
    try {
      if (mode === "create") {
        await addMutation.mutateAsync({
          name: values.name,
          icon: values.icon,
          color: values.color,
          order: values.order,
        });
      } else if (initialCategory) {
        await updateMutation.mutateAsync({
          id: initialCategory.id,
          name: values.name,
          icon: values.icon,
          color: values.color,
          order: values.order,
          isActive: values.isActive,
        });
      }
      onOpenChange(false);
    } catch {
      // toast đã xử lý trong hook (nếu có); giữ modal mở khi lỗi
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Thêm danh mục mặc định" : "Sửa danh mục"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Danh mục mới dùng cho người dùng mới sau khi đăng ký."
              : "Cập nhật thông tin danh mục hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Tên</Label>
            <Input id="cat-name" {...register("name")} disabled={pending} />
            {errors.name ? (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-icon">Icon (keyword)</Label>
            <Input id="cat-icon" {...register("icon")} disabled={pending} placeholder="food" />
            {errors.icon ? (
              <p className="text-xs text-red-600">{errors.icon.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cat-color-hex">Màu</Label>
              <div className="flex gap-2">
                <input
                  id="cat-color-picker"
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded-md border p-1"
                  value={colorValue?.startsWith("#") ? colorValue : "#6366F1"}
                  disabled={pending}
                  onChange={(e) =>
                    setValue("color", e.target.value, { shouldValidate: true, shouldDirty: true })
                  }
                  aria-label="Chọn màu"
                />
                <Input
                  id="cat-color-hex"
                  {...register("color")}
                  disabled={pending}
                  className="flex-1 font-mono text-xs"
                />
              </div>
              {errors.color ? (
                <p className="text-xs text-red-600">{errors.color.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Thứ tự</Label>
              <Input
                id="cat-order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
                disabled={pending}
              />
              {errors.order ? (
                <p className="text-xs text-red-600">{errors.order.message}</p>
              ) : null}
            </div>
          </div>

          {mode === "edit" ? (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm font-medium">Đang hoạt động</span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                disabled={pending}
                onClick={() => setValue("isActive", !isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
                    isActive ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
