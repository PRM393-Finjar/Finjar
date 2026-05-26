import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/shared/types";
import { profileService } from "../services";
import type { UpdateProfilePayload } from "../types";
import { currentUserQueryKey } from "./useCurrentUser";

function appRoleFromApiRole(apiRole: string): UserRole {
  const r = apiRole.trim().toLowerCase();
  return r.includes("admin") ? "admin" : "user";
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationKey: ["user", "me", "update"],
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateMe(payload),
    onSuccess: async (me) => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      const { accessToken, role, user } = useAuthStore.getState();
      if (accessToken && user) {
        setAuth({
          accessToken,
          role: role ?? appRoleFromApiRole(user.role),
          user: {
            ...user,
            username: me.username,
            firstName: me.firstName,
            lastName: me.lastName,
            email: me.email,
            avatarUrl: me.avatarUrl,
            isOnboardingCompleted: me.isOnboardingCompleted,
          },
        });
      }
    },
  });
}
