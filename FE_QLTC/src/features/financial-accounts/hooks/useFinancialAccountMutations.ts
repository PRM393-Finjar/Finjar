import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financialAccountService } from "../services";
import type {
  CreateLinkApiFinancialAccountPayload,
  CreateManualFinancialAccountPayload,
  ConnectSePayFinancialAccountPayload,
  UpdateFinancialAccountPayload,
} from "../types";

const QK = ["financial-accounts"] as const;

export function useCreateManualFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManualFinancialAccountPayload) =>
      financialAccountService.createManual(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useCreateLinkApiFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLinkApiFinancialAccountPayload) =>
      financialAccountService.createLinkApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useConnectSePayFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConnectSePayFinancialAccountPayload) =>
      financialAccountService.connectSePay(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      void queryClient.invalidateQueries({
        queryKey: ["financial-accounts", "sepay"],
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useUpdateFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFinancialAccountPayload;
    }) => financialAccountService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}

export function useDeactivateFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialAccountService.deactivate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
    },
  });
}
