import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  CreateReminderPayload,
  ReminderItem,
  UpdateReminderPayload,
} from "./types";

function normalizeRow(raw: Record<string, unknown>): ReminderItem {
  const next = raw.nextDueDate;
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    amount: Number(raw.amount ?? 0),
    frequency: String(raw.frequency ?? ""),
    nextDueDate:
      typeof next === "string"
        ? next
        : next != null
          ? new Date(next as string | number).toISOString()
          : "",
    status: String(raw.status ?? ""),
  };
}

export const reminderService = {
  async list(): Promise<ReminderItem[]> {
    const raw = await apiClient.get(API_ENDPOINT.REMINDERS);
    const rows = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)
        ? (raw as { data: Record<string, unknown>[] }).data
        : [];
    return rows.map((r) => normalizeRow(r as Record<string, unknown>));
  },

  async create(payload: CreateReminderPayload): Promise<ReminderItem> {
    const row = (await apiClient.post(API_ENDPOINT.REMINDERS, {
      title: payload.title.trim(),
      amount: payload.amount,
      frequency: payload.frequency,
      dayOfMonth: payload.dayOfMonth ?? undefined,
      startDate: payload.startDate,
      categoryId: payload.categoryId || undefined,
      notifyDaysBefore: payload.notifyDaysBefore ?? undefined,
      note: payload.note?.trim() || undefined,
    })) as Record<string, unknown>;
    return normalizeRow(row);
  },

  async update(
    id: string,
    payload: UpdateReminderPayload,
  ): Promise<ReminderItem> {
    const row = (await apiClient.patch(
      `${API_ENDPOINT.REMINDERS}/${id}`,
      {
        title: payload.title?.trim(),
        amount: payload.amount,
        frequency: payload.frequency,
        dayOfMonth: payload.dayOfMonth ?? undefined,
        status: payload.status,
        notifyDaysBefore: payload.notifyDaysBefore ?? undefined,
        note: payload.note === undefined ? undefined : payload.note?.trim() || null,
      },
    )) as Record<string, unknown>;
    return normalizeRow(row);
  },

  async cancel(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINT.REMINDERS}/${id}`);
  },
};
