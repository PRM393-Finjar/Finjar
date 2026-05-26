import type { QueryClient } from "@tanstack/react-query";
import { notificationsQueryKeyRoot } from "@/features/notifications/hooks/useNotifications";

/** Sau thao tác ảnh hưởng số dư, hạn mức hoặc thông báo. */
export function invalidateFinanceQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: ["jars"] });
  void queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
  void queryClient.invalidateQueries({ queryKey: ["budget", "limits"] });
  void queryClient.invalidateQueries({ queryKey: notificationsQueryKeyRoot });
}
