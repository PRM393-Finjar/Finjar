import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userCategoryService } from "../services";
import type { CreateUserCategoryPayload, UpdateUserCategoryPayload } from "../types";

export function useCreateUserCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserCategoryPayload) =>
      userCategoryService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories", "user"] });
    },
  });
}

export function useUpdateUserCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserCategoryPayload;
    }) => userCategoryService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories", "user"] });
    },
  });
}

export function useDeleteUserCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userCategoryService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories", "user"] });
    },
  });
}
