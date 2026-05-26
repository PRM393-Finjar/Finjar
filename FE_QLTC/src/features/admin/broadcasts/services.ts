import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  AdminBroadcast,
  AdminBroadcastListParams,
  AdminBroadcastListResult,
  CreateBroadcastPayload,
} from "./types";

function normalizeBroadcast(row: Record<string, unknown>): AdminBroadcast {
  const id = row.id ?? row.Id;
  return {
    id: String(id),
    title: String(row.title ?? row.Title ?? ""),
    body: String(row.body ?? row.Body ?? ""),
    targetAudience: String(row.targetAudience ?? row.TargetAudience ?? "All"),
    status: String(row.status ?? row.Status ?? ""),
    scheduledAt: (row.scheduledAt ?? row.ScheduledAt ?? null) as string | null,
    sentAt: (row.sentAt ?? row.SentAt ?? null) as string | null,
    targetCount: Number(row.targetCount ?? row.TargetCount ?? 0),
    deliveredCount: Number(row.deliveredCount ?? row.DeliveredCount ?? 0),
  };
}

function normalizeList(raw: unknown): AdminBroadcastListResult {
  if (!raw || typeof raw !== "object") {
    return {
      items: [],
      pagination: {
        pageIndex: 1,
        pageSize: 10,
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
        normalizeBroadcast(x && typeof x === "object" ? (x as Record<string, unknown>) : {}),
      )
    : [];
  const pageIndex = Number(rawPag?.pageIndex ?? rawPag?.PageIndex ?? 1);
  const pageSize = Number(rawPag?.pageSize ?? rawPag?.PageSize ?? 10);
  const totalCount = Number(rawPag?.totalCount ?? rawPag?.TotalCount ?? items.length);
  const totalPages = Number(
    rawPag?.totalPages ?? rawPag?.TotalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)),
  );
  return {
    items,
    pagination: { pageIndex, pageSize, totalCount, totalPages },
  };
}

export const adminBroadcastService = {
  async list(params?: AdminBroadcastListParams): Promise<AdminBroadcastListResult> {
    const raw = await apiClient.get<unknown>(API_ENDPOINT.ADMIN.BROADCASTS, {
      params: {
        pageIndex: params?.pageIndex ?? 1,
        pageSize: params?.pageSize ?? 10,
        status: params?.status ?? "Queued",
      },
    });
    return normalizeList(raw);
  },

  async create(payload: CreateBroadcastPayload): Promise<AdminBroadcast> {
    const raw = (await apiClient.post(API_ENDPOINT.ADMIN.BROADCASTS, {
      title: payload.title,
      body: payload.body,
      targetAudience: payload.targetAudience ?? "All",
      scheduledAt: payload.scheduledAt ?? null,
    })) as unknown;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return normalizeBroadcast(raw as Record<string, unknown>);
    }
    throw new Error("Phản hồi tạo broadcast không hợp lệ");
  },
};
