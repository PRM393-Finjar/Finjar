export interface UserCategoryOption {
  id: string;
  name: string;
  kind: "default" | "custom";
  icon?: string | null;
  color?: string | null;
}

export interface UserCategoriesGrouped {
  defaultCategories: UserCategoryOption[];
  customCategories: UserCategoryOption[];
}

export interface CreateUserCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateUserCategoryPayload {
  name?: string;
  icon?: string | null;
  color?: string | null;
}
