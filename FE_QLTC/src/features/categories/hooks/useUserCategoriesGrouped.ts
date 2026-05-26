import { useQuery } from "@tanstack/react-query";
import { userCategoryService } from "../services";

export function useUserCategoriesGrouped() {
  return useQuery({
    queryKey: ["categories", "user", "grouped"],
    queryFn: () => userCategoryService.getGrouped(),
  });
}
