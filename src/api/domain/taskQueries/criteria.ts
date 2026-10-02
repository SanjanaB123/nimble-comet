import type { TaskStatus } from "../../../shared/types";
import { isOverdue } from "../tasks";
import type { TaskCriterion } from "./types";

export function hasStatus(status: TaskStatus): TaskCriterion {
  return {
    name: `status:${status}`,
    narrow: (query) => ({ ...query, status }),
  };
}

export const statusFromFilters: TaskCriterion = {
  name: "status:from-filters",
  narrow: (query, env) => (env.filters.status ? { ...query, status: env.filters.status } : query),
};

export const overdueAtRequestTime: TaskCriterion = {
  name: "overdue",
  test: (task, env) => isOverdue(task, env.now),
};
