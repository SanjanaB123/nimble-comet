import { beforeEach, describe, expect, it } from "vitest";

import { buildRequestContext, type RequestContext } from "../auth/requestContext";
import { createFixtureData } from "../fixtures/data";
import { FixtureDirectoryRepository, FixtureTaskRepository } from "../repository/fixtureRepository";
import { fixedClock } from "./clock";
import { ForbiddenError, NotFoundError } from "./errors";
import { createTaskQueryRegistry, TaskQueryEngine, TaskScopeResolver } from "./taskQueries";
import { TaskService } from "./taskService";

const referenceTime = new Date("2026-03-10T15:00:00.000Z");

describe("TaskService", () => {
  let directory: FixtureDirectoryRepository;
  let service: TaskService;

  async function contextFor(userId: string): Promise<RequestContext> {
    const user = await directory.findUserById(userId);
    return buildRequestContext(user!, directory);
  }

  beforeEach(() => {
    const data = createFixtureData(referenceTime);
    directory = new FixtureDirectoryRepository(data);
    const tasks = new FixtureTaskRepository(data);
    const clock = fixedClock(referenceTime);
    const queries = new TaskQueryEngine(createTaskQueryRegistry(), new TaskScopeResolver(directory), tasks, clock);
    service = new TaskService(tasks, directory, queries, clock);
  });

  it("lists every task on the manager's team, ordered by due time", async () => {
    const tasks = await service.listTasks(await contextFor("u-dana"));

    expect(tasks.length).toBeGreaterThan(0);
    expect(new Set(tasks.map((task) => task.team.name))).toEqual(new Set(["North Metro"]));
    const dueTimes = tasks.map((task) => task.dueAt);
    expect(dueTimes).toEqual([...dueTimes].sort());
  });

  it("narrows a manager's list to a single rep", async () => {
    const tasks = await service.listTasks(await contextFor("u-dana"), { repId: "u-alicia" });

    expect(tasks.map((task) => task.assignee.name)).toEqual(Array(tasks.length).fill("Alicia Chen"));
  });

  it("shows reps only their own tasks", async () => {
    const tasks = await service.listTasks(await contextFor("u-marcus"));

    expect(tasks.map((task) => task.id)).toEqual(["task-1002", "task-1001", "task-1003"]);
  });

  it("lists a rep's overdue work", async () => {
    const tasks = await service.listOverdueTasks(await contextFor("u-marcus"));

    expect(tasks.map((task) => task.id)).toEqual(["task-1001"]);
    expect(tasks.every((task) => task.isOverdue)).toBe(true);
  });

  it("narrows a manager's overdue list to a single rep", async () => {
    const tasks = await service.listOverdueTasks(await contextFor("u-dana"), { repId: "u-alicia" });

    expect(tasks.map((task) => task.id)).toEqual(["task-1004"]);
  });

  it("rejects an overdue request for a rep outside the manager's teams", async () => {
    await expect(service.listOverdueTasks(await contextFor("u-dana"), { repId: "u-sam" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("rejects an overdue request from a rep for someone else's tasks", async () => {
    await expect(service.listOverdueTasks(await contextFor("u-marcus"), { repId: "u-alicia" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("completes a task and records the completion time", async () => {
    const task = await service.completeTask(await contextFor("u-dana"), "task-1006");

    expect(task.status).toBe("completed");
    expect(task.completedAt).toBe(referenceTime.toISOString());
    expect(task.isOverdue).toBe(false);
  });

  it("lets a rep complete their own task", async () => {
    const task = await service.completeTask(await contextFor("u-marcus"), "task-1003");

    expect(task.status).toBe("completed");
  });

  it("reports a teammate's task as not found when a rep tries to complete it", async () => {
    const marcus = await contextFor("u-marcus");

    await expect(service.completeTask(marcus, "task-1004")).rejects.toThrow(NotFoundError);
    const [alicias] = await service.listTasks(await contextFor("u-dana"), { repId: "u-alicia", status: "open" });
    expect(alicias?.id).toBe("task-1004");
  });
});
