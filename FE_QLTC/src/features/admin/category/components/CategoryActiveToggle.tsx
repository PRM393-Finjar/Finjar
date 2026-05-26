import { cn } from "@/lib/utils";
import type { Category } from "../type";
import { useUpdateCategoryMutation } from "../hooks/useAdminCategory";

export function CategoryActiveToggle({ category }: { category: Category }) {
  const updateMutation = useUpdateCategoryMutation();
  const busy =
    updateMutation.isPending && updateMutation.variables?.id === category.id;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={category.isActive}
      aria-label={category.isActive ? "Đang hoạt động" : "Đã tắt"}
      disabled={busy}
      onClick={() =>
        updateMutation.mutate({
          ...category,
          isActive: !category.isActive,
        })
      }
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50",
        category.isActive ? "bg-violet-500" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          category.isActive ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
