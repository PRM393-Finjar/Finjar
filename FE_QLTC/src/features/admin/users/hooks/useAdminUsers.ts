import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";
import { adminUserService } from "../services";
import type { AccountRole, GetAdminUsersParams } from "../types";

export function useAdminUsers(params: GetAdminUsersParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminUserService.getUsers(params),
  });
}

export function useAdminUserDetail(
  id: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => adminUserService.getUserById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useUpdateUserStatusMutation() {
  return useMutation<
    Awaited<ReturnType<typeof adminUserService.updateUserStatus>>,
    Error,
    { id: string; status: string; statusReason?: string | null }
  >({
    mutationFn: ({ id, status, statusReason }) =>
      adminUserService.updateUserStatus(id, { status, statusReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Đã cập nhật trạng thái tài khoản");
    },
    onError: (err) => {
      toast.error(err.message || "Không cập nhật được trạng thái");
    },
  });
}

export function useChangeUserRoleMutation() {
  return useMutation<string, Error, { accountId: string; role: AccountRole }>({
    mutationFn: ({ accountId, role }) =>
      adminUserService.changeRole(accountId, role),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(message);
    },
    onError: (err) => {
      toast.error(err.message || "Đổi vai trò thất bại");
    },
  });
}
