import type { TaskStatus } from "../../shared/types";
import { HttpError } from "./errors";

const TASK_STATUSES: readonly TaskStatus[] = ["open", "completed"];

export function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_request", `Query parameter "${name}" must be a single value`);
  }
  return value;
}

export function optionalTaskStatus(value: unknown): TaskStatus | undefined {
  const status = optionalString(value, "status");
  if (status === undefined) {
    return undefined;
  }
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new HttpError(400, "invalid_request", `Query parameter "status" must be one of: ${TASK_STATUSES.join(", ")}`);
  }
  return status as TaskStatus;
}
