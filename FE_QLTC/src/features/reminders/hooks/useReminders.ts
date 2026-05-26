import { useQuery } from "@tanstack/react-query";
import { reminderService } from "../services";

export function useReminders() {
  return useQuery({
    queryKey: ["reminders", "list"],
    queryFn: () => reminderService.list(),
  });
}
