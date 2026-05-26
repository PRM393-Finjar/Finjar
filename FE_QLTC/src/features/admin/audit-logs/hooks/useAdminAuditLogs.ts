import { useQuery } from "@tanstack/react-query";
import { adminAuditLogService } from "../services";
import type { AdminAuditLogParams } from "../types";

export function useAdminAuditLogs(params?: AdminAuditLogParams) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params ?? {}],
    queryFn: () => adminAuditLogService.list(params),
  });
}
