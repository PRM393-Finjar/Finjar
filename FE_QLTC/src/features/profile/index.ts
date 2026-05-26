export { UserProfilePage } from "./pages/UserProfilePage";
export { useCurrentUser, currentUserQueryKey } from "./hooks/useCurrentUser";
export { useUserAvatarUrl } from "./hooks/useUserAvatarUrl";
export { useUpdateProfile } from "./hooks/useUpdateProfile";
export { readImageFileAsDataUrl } from "./lib/avatarFile";
export { profileService, normalizeMePayload } from "./services";
export type { CurrentUser, UpdateProfilePayload } from "./types";
