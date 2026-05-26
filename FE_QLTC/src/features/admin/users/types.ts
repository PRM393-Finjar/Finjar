/** Matches backend `AccountRole`: User = 1, Admin = 2 */
export const AccountRole = {
  User: 1,
  Admin: 2,
} as const;

export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole];

/** Khớp `AdminUserResponse` từ API (JSON camelCase). */
export interface AdminUserDto {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  preferredCurrency: string;
  isOnboardingCompleted: boolean;
  status: string;
  statusReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUsersPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminUsersPagedResponse {
  data: AdminUserDto[];
  pagination: AdminUsersPagination;
}

export interface GetAdminUsersParams {
  pageIndex: number;
  pageSize: number;
  status?: string;
  keyword?: string;
}

export interface UpdateUserStatusBody {
  userId: string;
  status: string;
  statusReason?: string | null;
}
