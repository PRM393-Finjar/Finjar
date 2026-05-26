import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinanceQueries } from "@/shared/lib/invalidateFinanceQueries";
import { goalService } from "../services";
import type { CreateGoalPayload, UpdateGoalPayload } from "../types";

export function useGoals() {
  return useQuery({
    queryKey: ["goals", "list"],
    queryFn: () => goalService.list(),
  });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: ["goals", "detail", id],
    queryFn: () => goalService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => goalService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
      queryClient.invalidateQueries({ queryKey: ["jars"] });
      invalidateFinanceQueries(queryClient);
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      goalService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
      queryClient.invalidateQueries({ queryKey: ["jars"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
      queryClient.invalidateQueries({ queryKey: ["jars"] });
    },
  });
}
