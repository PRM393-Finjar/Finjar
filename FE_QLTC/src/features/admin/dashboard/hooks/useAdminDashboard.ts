import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "../services";

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "admin-summary"],
    queryFn: adminDashboardService.getAdminSummary,
  });
}
