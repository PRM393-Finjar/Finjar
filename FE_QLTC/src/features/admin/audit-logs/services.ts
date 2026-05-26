import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  AdminAuditLogItem,
  AdminAuditLogListResult,
  AdminAuditLogParams,
} from "./types";

/** Query PascalCase — khớp Swagger (`AdminId`, `Page`, …). */
function buildAuditQueryParams(params?: AdminAuditLogParams) {
  const q: Record<string, string | number> = {
    Page: params?.page ?? 1,
    PageSize: params?.pageSize ?? 50,
  };
  const aid = params?.adminId?.trim();
  if (aid) q.AdminId = aid;
  const at = params?.actionType?.trim();
  if (at) q.ActionType = at;
  const et = params?.entityType?.trim();
  if (et) q.EntityType = et;
  if (params?.fromDate) q.FromDate = params.fromDate;
  if (params?.toDate) q.ToDate = params.toDate;
  return q;
}

function normalizeItem(row: Record<string, unknown>): AdminAuditLogItem {
  const id = row.id ?? row.Id;
  const created = row.createdAt ?? row.CreatedAt;
  return {
    id: String(id),
    adminUsername: String(row.adminUsername ?? row.AdminUsername ?? ""),
    actionType: String(row.actionType ?? row.ActionType ?? ""),
    entityType: String(row.entityType ?? row.EntityType ?? ""),
    description: String(row.description ?? row.Description ?? ""),
    createdAt:
      typeof created === "string"
        ? created
        : created != null
          ? String(created)
          : "",
  };
}

function normalizeList(raw: unknown): AdminAuditLogListResult {
  if (!raw || typeof raw !== "object") {
    return {
      items: [],
      pagination: {
        pageIndex: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }
  const o = raw as Record<string, unknown>;
  const rawItems = (o.items ?? o.Items) as unknown[] | undefined;
  const rawPag = (o.pagination ?? o.Pagination) as Record<string, unknown> | undefined;
  const items = Array.isArray(rawItems)
    ? rawItems.map((x) =>
        normalizeItem(x && typeof x === "object" ? (x as Record<string, unknown>) : {}),
      )
    : [];
  const pageIndex = Number(rawPag?.pageIndex ?? rawPag?.PageIndex ?? 1);
  const pageSize = Number(rawPag?.pageSize ?? rawPag?.PageSize ?? 50);
  const totalCount = Number(rawPag?.totalCount ?? rawPag?.TotalCount ?? items.length);
  const totalPages = Number(
    rawPag?.totalPages ??
      rawPag?.TotalPages ??
      Math.max(1, Math.ceil(totalCount / pageSize)),
  );
  return {
    items,
    pagination: { pageIndex, pageSize, totalCount, totalPages },
  };
}

export const adminAuditLogService = {
  async list(params?: AdminAuditLogParams): Promise<AdminAuditLogListResult> {
    const raw = await apiClient.get<unknown>(API_ENDPOINT.ADMIN.AUDIT_LOGS, {
      params: buildAuditQueryParams(params),
    });
    return normalizeList(raw);
  },
};
