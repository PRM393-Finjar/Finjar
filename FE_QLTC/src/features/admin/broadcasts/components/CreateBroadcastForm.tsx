import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/lib/utils";
import { useCreateBroadcast } from "../hooks/useAdminBroadcasts";
import { ScheduleDateTimePicker } from "@/shared/components/ScheduleDateTimePicker";

const adminBtnPrimary =
  "bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] focus-visible:ring-[#6366F1]";
const adminFocusField =
  "focus-visible:border-[#6366F1]/50 focus-visible:ring-[#6366F1]/30";

const schema = z.object({
  title: z.string().min(1, "Nhập tiêu đề"),
  body: z.string().min(1, "Nhập nội dung"),
  targetAudience: z.string().min(1, "Nhập đối tượng"),
  scheduledAtLocal: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateBroadcastForm() {
  const createMutation = useCreateBroadcast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      body: "",
      targetAudience: "All",
      scheduledAtLocal: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const scheduledAt =
      values.scheduledAtLocal && values.scheduledAtLocal.trim() !== ""
        ? new Date(values.scheduledAtLocal).toISOString()
        : null;

    try {
      await createMutation.mutateAsync({
        title: values.title.trim(),
        body: values.body.trim(),
        targetAudience: values.targetAudience.trim(),
        scheduledAt,
      });
      toast.success(
        scheduledAt
          ? "Đã lên lịch broadcast."
          : "Đã gửi broadcast tới người dùng.",
      );
      reset({
        title: "",
        body: "",
        targetAudience: "All",
        scheduledAtLocal: "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không tạo được broadcast.";
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="broadcast-title">Tiêu đề</Label>
          <Input
            id="broadcast-title"
            placeholder="Ví dụ: Bảo trì hệ thống đêm mai"
            aria-invalid={!!errors.title}
            className={cn("h-10", adminFocusField)}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-audience">Đối tượng</Label>
          <Input
            id="broadcast-audience"
            placeholder="All"
            aria-invalid={!!errors.targetAudience}
            className={cn("h-10", adminFocusField)}
            {...register("targetAudience")}
          />
          {errors.targetAudience && (
            <p className="text-sm text-red-500">
              {errors.targetAudience.message}
            </p>
          )}
          <p className="text-[11px] leading-snug text-muted-foreground">
            Thường dùng <span className="font-medium">All</span> (API{" "}
            <code className="text-[10px]">targetAudience</code>).
          </p>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="broadcast-body">Nội dung</Label>
          <textarea
            id="broadcast-body"
            rows={3}
            className={cn(
              "flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2",
              adminFocusField,
            )}
            placeholder="Nội dung thông báo gửi tới người dùng"
            aria-invalid={!!errors.body}
            {...register("body")}
          />
          {errors.body && (
            <p className="text-sm text-red-500">{errors.body.message}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2 sm:max-w-md">
          <Label htmlFor="broadcast-schedule">Lên lịch (tùy chọn)</Label>
          <Controller
            name="scheduledAtLocal"
            control={control}
            render={({ field }) => (
              <ScheduleDateTimePicker
                id="broadcast-schedule"
                value={field.value ?? ""}
                onChange={field.onChange}
                className={adminFocusField}
              />
            )}
          />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Để trống (Xóa trong lịch) để gửi ngay.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={createMutation.isPending}
        size="sm"
        className={cn(adminBtnPrimary)}
      >
        {createMutation.isPending ? "Đang gửi…" : "Tạo broadcast"}
      </Button>
    </form>
  );
}
