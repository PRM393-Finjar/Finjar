import { useQuery } from "@tanstack/react-query";
import { financialAccountService } from "../services";

export function useFinancialAccounts() {
  return useQuery({
    queryKey: ["financial-accounts", "list"],
    queryFn: () => financialAccountService.list(),
  });
}

export function useSePayConnectionStatus() {
  return useQuery({
    queryKey: ["financial-accounts", "sepay", "status"],
    queryFn: () => financialAccountService.getSePayStatus(),
  });
}
