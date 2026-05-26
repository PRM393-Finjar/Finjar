import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services";

export const currentUserQueryKey = ["user", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => profileService.getMe(),
  });
}
