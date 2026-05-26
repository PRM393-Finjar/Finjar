import { useEffect } from "react";
import { profileService } from "@/features/profile/services";
import { useAuthStore } from "../store";

/** Đồng bộ `/user/me` khi có token — tránh kẹt onboarding do `auth-storage` cũ. */
export function AuthSessionSync() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    void profileService.getMe().then((me) => {
      if (cancelled) return;
      const state = useAuthStore.getState();
      if (!state.accessToken || !state.user) return;

      setAuthFromMe(state, me);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return null;
}

function setAuthFromMe(
  state: ReturnType<typeof useAuthStore.getState>,
  me: Awaited<ReturnType<typeof profileService.getMe>>,
) {
  const { user, accessToken, role } = state;
  if (!accessToken || !user) return;

  useAuthStore.getState().setAuth({
    accessToken,
    role,
    user: {
      ...user,
      username: me.username || user.username,
      firstName: me.firstName || user.firstName,
      lastName: me.lastName || user.lastName,
      email: me.email || user.email,
      avatarUrl: me.avatarUrl,
      isOnboardingCompleted: me.isOnboardingCompleted,
    },
  });
}
