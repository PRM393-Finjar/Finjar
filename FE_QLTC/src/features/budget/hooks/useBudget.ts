import { useQuery } from "@tanstack/react-query";
import { budgetService } from "../services";

export function useBudgetLimits() {
  return useQuery({
    queryKey: ["budget", "limits"],
    queryFn: budgetService.list,
  });
}
