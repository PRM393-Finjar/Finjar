/** GET /api/v1/user/me — theo docs/apis.md */
export interface CurrentUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  preferredCurrency: string;
  isOnboardingCompleted: boolean;
}

/** PATCH /api/v1/user/me — khớp `User.Request.UpdateUserRequest`. */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  preferredCurrency?: string;
}
