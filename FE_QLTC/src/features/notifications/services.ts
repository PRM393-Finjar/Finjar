import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  NotificationItem,
  NotificationListParams,
  NotificationListResult,
  UpdateNotificationStatusPayload,
  UpdateNotificationStatusResult,
} from "./types";

const BASE = API_ENDPOINT.NOTIFICATIONS;

function parseMetadata(raw: unknown): NotificationItem["metadata"] {
  if (!raw || typeof raw !== "object") {
    if (typeof raw === "string" && raw.trim()) {
      try {
        return parseMetadata(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        return null;
      }
    }
    return null;
  }
  const m = raw as Record<string, unknown>;
  return {
    goalId: m.goalId != null ? String(m.goalId) : m.GoalId != null ? String(m.GoalId) : undefined,
    jarId: m.jarId != null ? String(m.jarId) : m.JarId != null ? String(m.JarId) : undefined,
    limitId:
      m.limitId != null ? String(m.limitId) : m.LimitId != null ? String(m.LimitId) : undefined,
    transactionId:
      m.transactionId != null
        ? String(m.transactionId)
        : m.TransactionId != null
          ? String(m.TransactionId)
          : undefined,
  };
}

function mapItem(raw: Record<string, unknown>): NotificationItem {
  const id = raw.id ?? raw.Id;
  const occurredAt = raw.occurredAt ?? raw.OccurredAt;
  const metaRaw = raw.metadata ?? raw.Metadata ?? raw.metadataJson ?? raw.MetadataJson;
  return {
    id: String(id ?? ""),
    type: String(raw.type ?? raw.Type ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    body: String(raw.body ?? raw.Body ?? ""),
    isRead: Boolean(raw.isRead ?? raw.IsRead),
    occurredAt:
      typeof occurredAt === "string"
        ? occurredAt
        : occurredAt != null
          ? new Date(occurredAt as string | number).toISOString()
          : "",
    metadata: parseMetadata(metaRaw),
  };
}

function normalizeList(raw: unknown): NotificationListResult {
  const r = raw as Record<string, unknown>;
  const itemsRaw = r.items ?? r.Items;
  const list = Array.isArray(itemsRaw)
    ? itemsRaw.map((x) => mapItem(x as Record<string, unknown>))
    : [];

  return {
    items: list,
    totalItems: Number(r.totalItems ?? r.TotalItems ?? 0),
    pageSize: Number(r.pageSize ?? r.PageSize ?? 10),
    pageIndex: Number(r.pageIndex ?? r.PageIndex ?? 1),
    unreadCount: Number(r.unreadCount ?? r.UnreadCount ?? 0),
  };
}

export const notificationService = {
  async list(params?: NotificationListParams): Promise<NotificationListResult> {
    const query = {
      type: params?.type,
      status: params?.status,
      pageSize: params?.pageSize ?? 10,
      pageIndex: params?.pageIndex ?? 1,
    };
    const raw = (await apiClient.get(BASE, { params: query })) as unknown;
    return normalizeList(raw);
  },

  async updateStatus(
    payload: UpdateNotificationStatusPayload,
  ): Promise<UpdateNotificationStatusResult> {
    const body = {
      ids: payload.ids,
      isRead: payload.isRead,
      markAll: payload.markAll ?? false,
    };
    const raw = (await apiClient.patch(`${BASE}/status`, body)) as unknown;
    const r = raw as Record<string, unknown>;
    return {
      updatedCount: Number(r.updatedCount ?? r.UpdatedCount ?? 0),
      unreadCount: Number(r.unreadCount ?? r.UnreadCount ?? 0),
    };
  },
};
