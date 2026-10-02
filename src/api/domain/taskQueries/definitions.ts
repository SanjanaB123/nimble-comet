import { compareByDueDate } from "../tasks";
import { hasStatus, overdueAtRequestTime, statusFromFilters } from "./criteria";
import type { TaskQueryDefinition } from "./types";

export const allTasksQuery: TaskQueryDefinition = {
  name: "all",
  accepts: ["repId", "status"],
  criteria: [statusFromFilters],
  order: compareByDueDate,
};

export const overdueTasksQuery: TaskQueryDefinition = {
  name: "overdue",
  accepts: ["status"],
  criteria: [hasStatus("open"), overdueAtRequestTime],
  order: compareByDueDate,
};

export const builtInTaskQueries: readonly TaskQueryDefinition[] = [allTasksQuery, overdueTasksQuery];
