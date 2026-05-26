export { goalService } from "./services";
export type {
  GoalListItem,
  GoalDetail,
  CreateGoalPayload,
  UpdateGoalPayload,
  CreateGoalResult,
  UpdateGoalResult,
} from "./types";
export {
  useGoals,
  useGoal,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from "./hooks/useGoals";
