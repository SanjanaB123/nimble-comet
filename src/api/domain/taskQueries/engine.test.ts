import { describe, expect, it } from "vitest";

import type { RequestContext } from "../../auth/requestContext";
import { createFixtureData } from "../../fixtures/data";
import { FixtureDirectoryRepository, FixtureTaskRepository } from "../../repository/fixtureRepository";
import type { TaskQuery } from "../../repository/types";
import { fixedClock } from "../clock";
import { allTasksQuery } from "./definitions";
import { TaskQueryEngine } from "./engine";
import { createTaskQueryRegistry } from "./registry";
import { TaskScopeResolver } from "./scope";

const now = new Date("2026-03-10T15:00:00.000Z");

function setup() {
  const data = createFixtureData(now);
  const directory = new FixtureDirectoryRepository(data);
  const engine = new TaskQueryEngine(
    createTaskQueryRegistry(),
    new TaskScopeResolver(directory),
    new FixtureTaskRepository(data),
    fixedClock(now),
  );
  const manager: RequestContext = {
    user: data.users.find((user) => user.id === "u-dana")!,
    scope: { kind: "teams", teamIds: ["team-north"] },
  };
  return { engine, manager };
}

describe("TaskQueryRegistry", () => {
  it("rejects a query registered twice", () => {
    expect(() => createTaskQueryRegistry([allTasksQuery, allTasksQuery])).toThrow(/already registered/);
  });
});

describe("TaskQueryEngine", () => {
  it("ignores filters the query does not accept", async () => {
    const { engine, manager } = setup();

    const overdue = await engine.run("overdue", manager, { status: "completed" });

    expect(overdue.map((task) => task.id)).toEqual(["task-1007", "task-1001", "task-1004"]);
  });

  it("applies the user's scope after the query's own criteria", async () => {
    const { engine, manager } = setup();
    const widen = { name: "widen", narrow: (query: TaskQuery) => ({ ...query, teamIds: ["team-south"] }) };

    const plan = await engine.plan(
      { ...allTasksQuery, criteria: [widen] },
      { now, context: manager, filters: {} },
    );

    expect(plan.repositoryQuery.teamIds).toEqual(["team-north"]);
  });
});
