import type { TaskStatus } from "../../../shared/types";
import type { RequestContext } from "../../auth/requestContext";
import type { Task, TaskQuery } from "../../repository/types";

export type TaskQueryName = "all" | "overdue";

/** Filters a caller may pass to a task query. Each definition declares which ones it accepts. */
export interface TaskQueryFilters {
  repId?: string;
  status?: TaskStatus;
}

export type TaskQueryFilterName = keyof TaskQueryFilters;

/** Everything a criterion can read while a query runs. */
export interface TaskQueryEnvironment {
  readonly now: Date;
  readonly context: RequestContext;
  readonly filters: Readonly<TaskQueryFilters>;
}

/**
 * A condition every task in a result must meet. A criterion can narrow the
 * repository query (`narrow`), check each fetched task (`test`), or both.
 */
export interface TaskCriterion {
  readonly name: string;
  narrow?(query: TaskQuery, env: TaskQueryEnvironment): TaskQuery;
  test?(task: Task, env: TaskQueryEnvironment): boolean;
}

export type TaskOrdering = (a: Task, b: Task) => number;

export interface TaskQueryDefinition {
  readonly name: TaskQueryName;
  readonly accepts: readonly TaskQueryFilterName[];
  readonly criteria: readonly TaskCriterion[];
  readonly order: TaskOrdering;
}

/** A definition resolved against one request: what to fetch and what to check afterwards. */
export interface TaskQueryPlan {
  readonly definition: TaskQueryDefinition;
  readonly repositoryQuery: TaskQuery;
  readonly predicates: readonly TaskCriterion[];
}
