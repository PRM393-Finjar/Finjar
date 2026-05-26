import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  CreateGoalPayload,
  CreateGoalResult,
  GoalDetail,
  GoalListItem,
  UpdateGoalPayload,
  UpdateGoalResult,
} from "./types";

const BASE = API_ENDPOINT.GOALS;

function asRowArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as { data: unknown }).data)
  ) {
    return (raw as { data: Record<string, unknown>[] }).data;
  }
  return [];
}

function mapGoalListItem(row: Record<string, unknown>): GoalListItem {
  const due =
    typeof row.dueDate === "string"
      ? row.dueDate
      : row.dueDate != null
        ? new Date(row.dueDate as string | number).toISOString()
        : "";
  const lid = row.linkedJarId;
  const lname = row.linkedJarName;
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    targetAmount: Number(row.targetAmount ?? 0),
    savedAmount: Number(row.savedAmount ?? 0),
    progressPercentage: Number(row.progressPercentage ?? 0),
    dueDate: due,
    status: String(row.status ?? ""),
    suggestedMonthlyContribution: Number(row.suggestedMonthlyContribution ?? 0),
    linkedJarId: lid != null && lid !== "" ? String(lid) : null,
    linkedJarName:
      lname != null && String(lname).trim() !== "" ? String(lname) : null,
  };
}

function mapGoalDetail(row: Record<string, unknown>): GoalDetail {
  const base = mapGoalListItem(row);
  const n = row.note;
  return {
    ...base,
    daysRemaining: Number(row.daysRemaining ?? 0),
    note: n != null && String(n).trim() !== "" ? String(n) : null,
  };
}

function mapCreateResult(row: Record<string, unknown>): CreateGoalResult {
  const due =
    typeof row.dueDate === "string"
      ? row.dueDate
      : row.dueDate != null
        ? new Date(row.dueDate as string | number).toISOString()
        : "";
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    targetAmount: Number(row.targetAmount ?? 0),
    savedAmount: Number(row.savedAmount ?? 0),
    progressPercentage: Number(row.progressPercentage ?? 0),
    status: String(row.status ?? ""),
    dueDate: due,
  };
}

function mapUpdateResult(row: Record<string, unknown>): UpdateGoalResult {
  const due =
    typeof row.dueDate === "string"
      ? row.dueDate
      : row.dueDate != null
        ? new Date(row.dueDate as string | number).toISOString()
        : "";
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    targetAmount: Number(row.targetAmount ?? 0),
    dueDate: due,
    status: String(row.status ?? ""),
  };
}

export const goalService = {
  async list(): Promise<GoalListItem[]> {
    const raw = await apiClient.get(BASE);
    return asRowArray(raw).map(mapGoalListItem);
  },

  async getById(id: string): Promise<GoalDetail> {
    const raw = (await apiClient.get(`${BASE}/${id}`)) as unknown;
    return mapGoalDetail(raw as Record<string, unknown>);
  },

  async create(payload: CreateGoalPayload): Promise<CreateGoalResult> {
    const body = {
      title: payload.title,
      targetAmount: payload.targetAmount,
      dueDate: payload.dueDate,
      linkedJarId: payload.linkedJarId ?? undefined,
      note: payload.note ?? undefined,
    };
    const raw = (await apiClient.post(BASE, body)) as unknown;
    return mapCreateResult(raw as Record<string, unknown>);
  },

  async update(id: string, payload: UpdateGoalPayload): Promise<UpdateGoalResult> {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined && payload.title !== null) {
      body.title = payload.title;
    }
    if (payload.targetAmount != null) {
      body.targetAmount = payload.targetAmount;
    }
    if (payload.dueDate != null) {
      body.dueDate = payload.dueDate;
    }
    if (payload.linkedJarId !== undefined) {
      body.linkedJarId = payload.linkedJarId;
    }
    if (payload.note !== undefined && payload.note !== null) {
      body.note = payload.note;
    }
    const raw = (await apiClient.patch(`${BASE}/${id}`, body)) as unknown;
    return mapUpdateResult(raw as Record<string, unknown>);
  },

  async remove(id: string): Promise<{ message: string }> {
    return (await apiClient.delete(`${BASE}/${id}`)) as {
      message: string;
    };
  },
};
