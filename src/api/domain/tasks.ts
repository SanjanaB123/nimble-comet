import type { Task } from "../repository/types";

export function isOverdue(task: Task, now: Date): boolean {
  return task.status === "open" && new Date(task.dueAt).getTime() < now.getTime();
}

export function compareByDueDate(a: Task, b: Task): number {
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() || a.id.localeCompare(b.id);
}
