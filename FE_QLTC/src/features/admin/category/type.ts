export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

export interface CategoriesList {
  data: Category[];
}
export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface UpdateCategoryRequest {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}
