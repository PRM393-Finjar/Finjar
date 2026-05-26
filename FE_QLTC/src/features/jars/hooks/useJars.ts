import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinanceQueries } from "@/shared/lib/invalidateFinanceQueries";
import { jarService } from "../services";
import type { CreateJarPayload, UpdateJarPayload } from "../types";

export function useJarsOverview() {
  return useQuery({
    queryKey: ["jars", "overview"],
    queryFn: () => jarService.getOverview(),
  });
}

export function useJars() {
  return useQuery({
    queryKey: ["jars", "list"],
    queryFn: () => jarService.list(),
  });
}

export function useCreateJar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJarPayload) => jarService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jars"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useUpdateJar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJarPayload }) =>
      jarService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jars"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useDeleteJar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jarService.remove(id),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });
}
