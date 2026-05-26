import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBroadcastService } from "../services";
import type { AdminBroadcastListParams, CreateBroadcastPayload } from "../types";

export function useAdminBroadcasts(params?: AdminBroadcastListParams) {
  return useQuery({
    queryKey: ["admin", "broadcasts", params ?? {}],
    queryFn: () => adminBroadcastService.list(params),
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => adminBroadcastService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "broadcasts"] });
    },
  });
}
