import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderService } from "../services";
import type { CreateReminderPayload, UpdateReminderPayload } from "../types";

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReminderPayload) => reminderService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reminders", "list"] });
    },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateReminderPayload;
    }) => reminderService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reminders", "list"] });
    },
  });
}

export function useCancelReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reminderService.cancel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reminders", "list"] });
    },
  });
}
