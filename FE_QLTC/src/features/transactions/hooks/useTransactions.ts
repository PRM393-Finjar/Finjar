import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinanceQueries } from "@/shared/lib/invalidateFinanceQueries";
import { transactionService } from "../services";
import type {
  CreateTransactionPayload,
  TransactionListParams,
  UpdateTransactionPayload,
} from "../types";

export function useTransactions(params?: TransactionListParams) {
  return useQuery({
    queryKey: ["transactions", "list", params ?? {}],
    queryFn: () => transactionService.list(params),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => transactionService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      transactionService.create(payload),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransactionPayload;
    }) => transactionService.update(id, payload),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.remove(id),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });
}

export function useRestoreTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.restore(id),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });
}
