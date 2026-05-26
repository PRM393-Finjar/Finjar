import { apiClient } from "@/lib/axios";
import { mockData } from "@/lib/mockData";
import {
  requestWithStrategy,
  type RequestMode,
  wait,
} from "@/lib/requestStrategy";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import { AccountRole } from "./types";
import type {
  AdminUserDto,
  AdminUsersPagedResponse,
  GetAdminUsersParams,
} from "./types";

const ADMIN_USER_STRATEGY = {
  changeRole: "real" as RequestMode,
} as const;

/** Query keys PascalCase — khớp Swagger/`GetAdminUsersRequest` (một số host bind đúng với tên này). */
function buildUserQueryParams(params: GetAdminUsersParams) {
  const q: Record<string, string | number> = {
    PageIndex: params.pageIndex,
    PageSize: params.pageSize,
  };
  if (params.status) q.Status = params.status;
  const kw = params.keyword?.trim();
  if (kw) q.Keyword = kw;
  return q;
}

export const adminUserService = {
  async getUsers(
    params: GetAdminUsersParams,
  ): Promise<AdminUsersPagedResponse> {
    return apiClient.get<AdminUsersPagedResponse>(API_ENDPOINT.ADMIN.USERS, {
      params: buildUserQueryParams(params),
    }) as unknown as Promise<AdminUsersPagedResponse>;
  },

  async getUserById(id: string): Promise<AdminUserDto> {
    return apiClient.get(
      `${API_ENDPOINT.ADMIN.USERS}/${id}`,
    ) as unknown as Promise<AdminUserDto>;
  },

  async updateUserStatus(
    id: string,
    body: { status: string; statusReason?: string | null },
  ): Promise<AdminUserDto> {
    return apiClient.patch(`${API_ENDPOINT.ADMIN.USERS}/${id}/status`, {
      userId: id,
      status: body.status,
      statusReason: body.statusReason ?? null,
    }) as unknown as Promise<AdminUserDto>;
  },

  async changeRole(accountId: string, role: AccountRole): Promise<string> {
    const realRequest = async () => {
      const raw = await apiClient.patch<string | unknown>(
        `${API_ENDPOINT.ADMIN.CHANGE_ROLE}/${accountId}`,
        null,
        { params: { role } },
      );
      return typeof raw === "string" ? raw : String(raw);
    };

    const mockRequest = async () => {
      await wait(200);
      const account = mockData.tables.accounts.find((a) => a.id === accountId);
      if (!account) throw new Error("User not found");
      const row = account as { role_id: number; updated_at: string };
      row.role_id = role === AccountRole.Admin ? 1 : 2;
      row.updated_at = new Date().toISOString();
      return "User role updated successfully";
    };

    return requestWithStrategy(
      ADMIN_USER_STRATEGY.changeRole,
      realRequest,
      mockRequest,
    );
  },
};
