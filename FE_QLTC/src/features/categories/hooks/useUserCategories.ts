import { useQuery } from "@tanstack/react-query";
import { userCategoryService } from "../services";

export function useUserCategories() {
  return useQuery({
    queryKey: ["categories", "user", "options"],
    queryFn: () => userCategoryService.listOptions(),
  });
}
