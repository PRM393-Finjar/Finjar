import { apiClient } from "@/lib/axios";
import type {
  CategoriesList,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./type";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";

/** Axios interceptor có thể trả về mảng thay vì `{ data }` khi không có `pagination`. */
function normalizeCategoriesList(raw: unknown): CategoriesList {
  if (Array.isArray(raw)) {
    return { data: raw as Category[] };
  }
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as CategoriesList).data)
  ) {
    return raw as CategoriesList;
  }
  return { data: [] };
}

export const adminCategoryService = {
  /** `undefined` = không gửi query (backend trả cả hai trạng thái). */
  getCategories: async (isActive?: boolean): Promise<CategoriesList> => {
    const raw = await apiClient.get(API_ENDPOINT.ADMIN.CATEGORIES, {
      params: isActive === undefined ? {} : { isActive },
    });
    return normalizeCategoriesList(raw);
  },

  addCategory: async (category: CreateCategoryRequest): Promise<Category> => {
    return apiClient.post<Category>(
      API_ENDPOINT.ADMIN.CATEGORIES,
      category,
    ) as unknown as Promise<Category>;
  },

  updateCategory: async (
    category: UpdateCategoryRequest,
  ): Promise<Category> => {
    const { id, ...body } = category;
    return apiClient.patch<Category>(
      `${API_ENDPOINT.ADMIN.CATEGORIES}/${id}`,
      body,
    ) as unknown as Promise<Category>;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINT.ADMIN.CATEGORIES}/${id}`);
  },
};
