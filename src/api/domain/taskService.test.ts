import { beforeEach, describe, expect, it } from "vitest";

import { buildRequestContext, type RequestContext } from "../auth/requestContext";
import { createFixtureData, type FixtureData } from "../fixtures/data";
import { FixtureDirectoryRepository, FixtureTaskRepository } from "../repository/fixtureRepository";
import { fixedClock } from "./clock";
import { ForbiddenError, NotFoundError } from "./errors";
import { createTaskQueryRegistry, TaskQueryEngine, TaskScopeResolver } from "./taskQueries";
import { TaskService } from "./taskService";

const referenceTime = new Date("2026-03-10T15:00:00.000Z");
const hoursFromReference = (hours: number) => new Date(referenceTime.getTime() + hours * 60 * 60 * 1000).toISOString();

let directory: FixtureDirectoryRepository;
let service: TaskService;

function useData(data: FixtureData) {
  directory = new FixtureDirectoryRepository(data);
  const tasks = new FixtureTaskRepository(data);
  const clock = fixedClock(referenceTime);
  const queries = new TaskQueryEngine(createTaskQueryRegistry(), new TaskScopeResolver(directory), tasks, clock);
  service = new TaskService(tasks, directory, queries, clock);
}

async function contextFor(userId: string): Promise<RequestContext> {
  const user = await directory.findUserById(userId);
  return buildRequestContext(user!, directory);
}

describe("TaskService", () => {
  beforeEach(() => {
    useData(createFixtureData(referenceTime));
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

describe("TaskService.summarizeByRep", () => {
  beforeEach(() => {
    useData(createFixtureData(referenceTime));
  });

  const rows = (summary: Awaited<ReturnType<TaskService["summarizeByRep"]>>) =>
    summary.map((row) => [row.rep.name, row.overdueCount, row.openCount]);

  it("counts open and overdue tasks for each rep on the manager's team", async () => {
    const summary = await service.summarizeByRep(await contextFor("u-dana"));

    expect(rows(summary)).toEqual([
      ["Jordan Pike", 1, 2],
      ["Marcus Bell", 1, 2],
      ["Alicia Chen", 1, 2],
    ]);
    expect(summary[0]).toEqual({
      rep: { id: "u-jordan", name: "Jordan Pike" },
      team: { id: "team-north", name: "North Metro" },
      openCount: 2,
      overdueCount: 1,
      oldestOverdueDueAt: hoursFromReference(-75),
    });
  });

  it("breaks ties on overdue count by the longest-overdue task", async () => {
    const summary = await service.summarizeByRep(await contextFor("u-dana"));

    expect(summary.map((row) => row.oldestOverdueDueAt)).toEqual([
      hoursFromReference(-75),
      hoursFromReference(-30),
      hoursFromReference(-6),
    ]);
  });

  it("puts the rep with the most overdue tasks first, even if their oldest is more recent", async () => {
    const data = createFixtureData(referenceTime);
    data.tasks.push({ ...data.tasks.find((task) => task.id === "task-1004")!, id: "task-1010", dueAt: hoursFromReference(-1) });
    useData(data);

    const summary = await service.summarizeByRep(await contextFor("u-dana"));

    expect(rows(summary)[0]).toEqual(["Alicia Chen", 2, 3]);
    expect(summary[0]!.oldestOverdueDueAt).toBe(hoursFromReference(-6));
  });

  it("includes reps with no open work, after everyone who is behind", async () => {
    const dana = await contextFor("u-dana");
    await service.completeTask(dana, "task-1007");
    await service.completeTask(dana, "task-1008");

    const summary = await service.summarizeByRep(dana);

    expect(rows(summary)).toEqual([
      ["Marcus Bell", 1, 2],
      ["Alicia Chen", 1, 2],
      ["Jordan Pike", 0, 0],
    ]);
    expect(summary[2]!.oldestOverdueDueAt).toBeNull();
  });

  it("orders reps who are all caught up by name", async () => {
    const dana = await contextFor("u-dana");
    for (const taskId of ["task-1001", "task-1004", "task-1007"]) {
      await service.completeTask(dana, taskId);
    }

    const summary = await service.summarizeByRep(dana);

    expect(rows(summary)).toEqual([
      ["Alicia Chen", 0, 1],
      ["Jordan Pike", 0, 1],
      ["Marcus Bell", 0, 1],
    ]);
  });

  it("does not count completed tasks, however late they were", async () => {
    const summary = await service.summarizeByRep(await contextFor("u-dana"));
    const openTasks = await service.listTasks(await contextFor("u-dana"), { status: "open" });

    expect(summary.reduce((total, row) => total + row.openCount, 0)).toBe(openTasks.length);
  });

  it("agrees with the overdue list", async () => {
    for (const managerId of ["u-dana", "u-luis", "u-priya"]) {
      const context = await contextFor(managerId);
      const summary = await service.summarizeByRep(context);
      const overdue = await service.listOverdueTasks(context);

      for (const row of summary) {
        expect(row.overdueCount).toBe(overdue.filter((task) => task.assignee.id === row.rep.id).length);
      }
    }
  });

  it("covers every team a manager leads, labelled by team", async () => {
    const data = createFixtureData(referenceTime);
    data.teams.find((team) => team.id === "team-south")!.managerId = "u-dana";
    useData(data);

    const summary = await service.summarizeByRep(await contextFor("u-dana"));

    expect(summary.map((row) => `${row.rep.name} (${row.team.name})`).sort()).toEqual([
      "Alicia Chen (North Metro)",
      "Jordan Pike (North Metro)",
      "Marcus Bell (North Metro)",
      "Rita Alvarez (South Valley)",
      "Sam Okafor (South Valley)",
    ]);
  });

  it("only includes the manager's own reps", async () => {
    const summary = await service.summarizeByRep(await contextFor("u-luis"));

    expect(summary.map((row) => row.rep.id).sort()).toEqual(["u-rita", "u-sam"]);
  });

  it("is not available to reps", async () => {
    await expect(service.summarizeByRep(await contextFor("u-marcus"))).rejects.toThrow(ForbiddenError);
  });
});

describe("TaskService visibility for reads and writes", () => {
  const data = createFixtureData(referenceTime);

  it("lets a user complete a task exactly when it appears in their own task list", async () => {
    const mismatches: string[] = [];

    for (const user of data.users) {
      useData(createFixtureData(referenceTime));
      const visible = new Set((await service.listTasks(await contextFor(user.id))).map((task) => task.id));

      for (const task of data.tasks) {
        useData(createFixtureData(referenceTime));
        const outcome = await service.completeTask(await contextFor(user.id), task.id).then(
          () => "completed",
          (error: unknown) => (error instanceof Error ? error.name : String(error)),
        );
        const expected = !visible.has(task.id) ? "NotFoundError" : task.status === "completed" ? "ConflictError" : "completed";
        if (outcome !== expected) mismatches.push(`${user.id} on ${task.id}: expected ${expected}, got ${outcome}`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("reports another team's task as not found to a manager", async () => {
    useData(createFixtureData(referenceTime));

    await expect(service.completeTask(await contextFor("u-dana"), "task-2001")).rejects.toThrow(NotFoundError);
  });

  it("reports an unknown task as not found", async () => {
    useData(createFixtureData(referenceTime));

    await expect(service.completeTask(await contextFor("u-dana"), "task-9999")).rejects.toThrow(NotFoundError);
  });
});
