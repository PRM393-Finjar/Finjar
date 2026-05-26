import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";
import { adminAiSettingsService } from "../services";
import type { UpdateAdminAiSettingsPayload } from "../types";

export function useAdminAiSettingsQuery() {
  return useQuery({
    queryKey: ["admin", "ai-settings"],
    queryFn: () => adminAiSettingsService.get(),
  });
}

export function useUpdateAdminAiSettingsMutation() {
  return useMutation({
    mutationFn: (payload: UpdateAdminAiSettingsPayload) =>
      adminAiSettingsService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ai-settings"] });
      toast.success("Đã lưu cấu hình AI.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không cập nhật được cấu hình AI.");
    },
  });
}
