import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import { apiClient } from "@/lib/axios";
import type {
  CreateJarPayload,
  DeleteJarResult,
  JarApiRow,
  JarItem,
  JarsOverviewApi,
  UpdateJarPayload,
} from "./types";

function normalizeJarRow(
  row: Partial<JarApiRow> & { id?: unknown },
): JarApiRow {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    balance: Number(row.balance ?? 0),
    color:
      row.color != null && row.color !== "" ? String(row.color) : "#888888",
    icon: row.icon != null && row.icon !== "" ? String(row.icon) : "wallet",
    status: String(row.status ?? "Active"),
  };
}

function normalizeOverview(raw: unknown): JarsOverviewApi {
  const b = raw as Partial<JarsOverviewApi> & {
    data?: Array<Partial<JarApiRow> & { id?: unknown }>;
  };
  const data = (b.data ?? []).map(normalizeJarRow);
  return {
    methodType: String(b.methodType ?? ""),
    totalJarBalance: Number(b.totalJarBalance ?? 0),
    unallocatedBalance: Number(b.unallocatedBalance ?? 0),
    data,
  };
}

function mapRowToItem(row: JarApiRow): JarItem {
  return {
    id: row.id,
    name: row.name,
    percentage: null,
    balance: Number(row.balance),
    color: row.color,
    icon: row.icon,
    status: row.status,
  };
}

export const jarService = {
  async getOverview(): Promise<JarsOverviewApi> {
    const raw = await apiClient.get(API_ENDPOINT.JAR);
    return normalizeOverview(raw);
  },

  async list(): Promise<JarItem[]> {
    const overview = await this.getOverview();
    return overview.data.map(mapRowToItem);
  },

  async create(payload: CreateJarPayload): Promise<JarItem> {
    const row = (await apiClient.post(API_ENDPOINT.JAR, payload)) as {
      id: string;
      name: string;
      balance: number;
      status: string;
    };
    return {
      id: String(row.id),
      name: row.name,
      percentage: null,
      balance: Number(row.balance),
      status: row.status,
      color: payload.color,
      icon: payload.icon,
    };
  },

  async update(id: string, payload: UpdateJarPayload): Promise<JarItem> {
    const row = (await apiClient.patch(
      `${API_ENDPOINT.JAR}/${id}`,
      payload,
    )) as {
      id: string;
      name: string;
      color: string;
      icon: string;
      status: string;
    };
    return {
      id: String(row.id),
      name: row.name,
      percentage: null,
      balance: 0,
      color: row.color,
      icon: row.icon,
      status: row.status,
    };
  },

  async remove(id: string): Promise<DeleteJarResult> {
    return (await apiClient.delete(
      `${API_ENDPOINT.JAR}/${id}`,
    )) as DeleteJarResult;
  },
};
