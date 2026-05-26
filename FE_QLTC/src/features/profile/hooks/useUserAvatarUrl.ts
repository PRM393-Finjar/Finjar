import { useCurrentUser } from "./useCurrentUser";

/** Ảnh đại diện từ BE — dùng chung header, dashboard, hồ sơ. */
export function useUserAvatarUrl(): string | null {
  const { data } = useCurrentUser();
  return data?.avatarUrl ?? null;
}
