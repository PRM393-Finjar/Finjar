import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type {
  CreateUserCategoryPayload,
  UpdateUserCategoryPayload,
  UserCategoriesGrouped,
  UserCategoryOption,
} from "./types";

interface CategoryRow {
  id?: unknown;
  name?: unknown;
  icon?: unknown;
  color?: unknown;
}

interface CategoriesApiBody {
  defaultCategories?: CategoryRow[];
  customCategories?: CategoryRow[];
  DefaultCategories?: CategoryRow[];
  CustomCategories?: CategoryRow[];
}

function mapRow(row: CategoryRow, kind: "default" | "custom"): UserCategoryOption {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    kind,
    icon: row.icon != null && row.icon !== "" ? String(row.icon) : null,
    color: row.color != null && row.color !== "" ? String(row.color) : null,
  };
}

function mergeGrouped(body: CategoriesApiBody): UserCategoriesGrouped {
  const def = body.defaultCategories ?? body.DefaultCategories ?? [];
  const cust = body.customCategories ?? body.CustomCategories ?? [];
  return {
    defaultCategories: def.map((c) => mapRow(c, "default")),
    customCategories: cust.map((c) => mapRow(c, "custom")),
  };
}

export const userCategoryService = {
  async getGrouped(): Promise<UserCategoriesGrouped> {
    const body = (await apiClient.get(
      API_ENDPOINT.CATEGORIES.LIST,
    )) as CategoriesApiBody;
    return mergeGrouped(body);
  },

  /** Gộp default + custom, sắp xếp tên — dùng cho dropdown giao dịch. */
  async listOptions(): Promise<UserCategoryOption[]> {
    const { defaultCategories, customCategories } = await this.getGrouped();
    return [...defaultCategories, ...customCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "vi"),
    );
  },

  async create(payload: CreateUserCategoryPayload): Promise<UserCategoryOption> {
    const row = (await apiClient.post(API_ENDPOINT.CATEGORIES.LIST, {
      name: payload.name.trim(),
      icon: payload.icon?.trim() || null,
      color: payload.color?.trim() || null,
    })) as CategoryRow;
    return mapRow(row, "custom");
  },

  async update(
    id: string,
    payload: UpdateUserCategoryPayload,
  ): Promise<UserCategoryOption> {
    const row = (await apiClient.patch(
      API_ENDPOINT.CATEGORIES.DETAIL(id),
      {
        name: payload.name?.trim(),
        icon: payload.icon === undefined ? undefined : payload.icon?.trim() || null,
        color:
          payload.color === undefined ? undefined : payload.color?.trim() || null,
      },
    )) as CategoryRow;
    return mapRow(row, "custom");
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINT.CATEGORIES.DETAIL(id));
  },
};
