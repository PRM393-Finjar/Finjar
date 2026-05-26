import { useQuery } from "@tanstack/react-query";
import { userDashboardService } from "../services";

export function useUserDashboard() {
  return useQuery({
    queryKey: ["dashboard", "user"],
    queryFn: () => userDashboardService.getDashboard(),
  });
}
