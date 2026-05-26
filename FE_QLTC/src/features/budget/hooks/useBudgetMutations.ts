import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "../services";
import type { CreateBudgetLimitPayload, UpdateBudgetLimitPayload } from "../types";

export function useCreateBudgetLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetLimitPayload) => budgetService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["budget", "limits"] });
    },
  });
}

export function useUpdateBudgetLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBudgetLimitPayload;
    }) => budgetService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["budget", "limits"] });
    },
  });
}

export function useDeleteBudgetLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["budget", "limits"] });
    },
  });
}
