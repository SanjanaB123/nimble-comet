import type { TaskQueryDefinition, TaskQueryFilters } from "./types";

/**
 * Keeps only the filters a definition accepts and drops empty values, so a
 * criterion never sees a filter that does not apply to its query.
 */
export function normalizeFilters(definition: TaskQueryDefinition, filters: TaskQueryFilters): TaskQueryFilters {
  const normalized: TaskQueryFilters = {};
  for (const name of definition.accepts) {
    const value = filters[name]?.trim();
    if (value) {
      Object.assign(normalized, { [name]: value });
    }
  }
  return normalized;
}
