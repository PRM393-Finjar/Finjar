import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services";
import type {
  NotificationListParams,
  UpdateNotificationStatusPayload,
} from "../types";

export const notificationsQueryKeyRoot = ["notifications"] as const;

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: [...notificationsQueryKeyRoot, "list", params ?? {}],
    queryFn: () => notificationService.list(params),
  });
}

export function useUpdateNotificationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationStatusPayload) =>
      notificationService.updateStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeyRoot });
    },
  });
}

/** Dùng `unreadCount` từ API — chỉ cần 1 item/page để nhẹ. */
export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: [...notificationsQueryKeyRoot, "badge"],
    queryFn: () => notificationService.list({ pageSize: 1, pageIndex: 1 }),
    select: (data) => data.unreadCount,
  });
}
