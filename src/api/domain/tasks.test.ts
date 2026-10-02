import { describe, expect, it } from "vitest";

import type { Task } from "../repository/types";
import { compareByDueDate, isOverdue } from "./tasks";

const now = new Date("2026-03-10T15:00:00.000Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Call customer",
    customerName: "Example residence",
    assigneeId: "u-rep",
    teamId: "team-a",
    status: "open",
    dueAt: "2026-03-10T12:00:00.000Z",
    completedAt: null,
    createdAt: "2026-03-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("isOverdue", () => {
  it("is true for an open task whose due time has passed", () => {
    expect(isOverdue(makeTask({ dueAt: "2026-03-09T15:00:00.000Z" }), now)).toBe(true);
  });

  it("is false for an open task due in the future", () => {
    expect(isOverdue(makeTask({ dueAt: "2026-03-11T09:00:00.000Z" }), now)).toBe(false);
  });

  it("is false for an open task due at exactly the current time", () => {
    expect(isOverdue(makeTask({ dueAt: now.toISOString() }), now)).toBe(false);
    expect(isOverdue(makeTask({ dueAt: new Date(now.getTime() - 1).toISOString() }), now)).toBe(true);
  });

  it("is false for a completed task, whether it was completed on time or late", () => {
    const dueAt = "2026-03-09T15:00:00.000Z";

    expect(isOverdue(makeTask({ dueAt, status: "completed", completedAt: "2026-03-09T12:00:00.000Z" }), now)).toBe(false);
    expect(isOverdue(makeTask({ dueAt, status: "completed", completedAt: "2026-03-10T09:00:00.000Z" }), now)).toBe(false);
  });
});

describe("compareByDueDate", () => {
  it("orders tasks by due time, earliest first", () => {
    const later = makeTask({ id: "task-2", dueAt: "2026-03-12T09:00:00.000Z" });
    const earlier = makeTask({ id: "task-3", dueAt: "2026-03-08T09:00:00.000Z" });

    expect([later, earlier].sort(compareByDueDate).map((task) => task.id)).toEqual(["task-3", "task-2"]);
  });
});
