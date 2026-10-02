import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "./app";
import { fixedClock } from "./domain/clock";
import { createFixtureData } from "./fixtures/data";

const referenceTime = new Date("2026-03-10T15:00:00.000Z");

describe("task visibility over HTTP", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ clock: fixedClock(referenceTime), data: createFixtureData(referenceTime) });
  });

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  it("narrows the overdue list to the requested rep", async () => {
    const response = await request(app).get("/api/tasks/overdue?repId=u-alicia").set(as("demo-dana"));

    expect(response.status).toBe(200);
    expect(response.body.tasks.map((task: { id: string }) => task.id)).toEqual(["task-1004"]);
  });

  it("returns 403 for overdue tasks of a rep outside the manager's teams", async () => {
    const response = await request(app).get("/api/tasks/overdue?repId=u-sam").set(as("demo-dana"));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("forbidden");
  });

  it("returns 403 when a rep asks for someone else's overdue tasks", async () => {
    const response = await request(app).get("/api/tasks/overdue?repId=u-alicia").set(as("demo-marcus"));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("forbidden");
  });

  it("returns 404 when a rep completes a teammate's task, and leaves it open", async () => {
    const response = await request(app).post("/api/tasks/task-1004/complete").set(as("demo-marcus"));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("not_found");

    const alicias = await request(app).get("/api/tasks?repId=u-alicia&status=open").set(as("demo-dana"));
    expect(alicias.body.tasks.map((task: { id: string }) => task.id)).toContain("task-1004");
  });

  it("lets a rep complete their own task", async () => {
    const response = await request(app).post("/api/tasks/task-1003/complete").set(as("demo-marcus"));

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("completed");
  });
});

describe("HTTP error responses", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ clock: fixedClock(referenceTime), data: createFixtureData(referenceTime) });
  });

  it("returns 404 for an unknown API route without a token", async () => {
    const response = await request(app).get("/api/nope");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("not_found");
  });

  it("returns 404 for an unknown task route without a token", async () => {
    const response = await request(app).get("/api/tasks/task-1001");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("not_found");
  });

  it("returns 404 for an unknown API route with a token", async () => {
    const response = await request(app).get("/api/nope").set("Authorization", "Bearer demo-dana");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("not_found");
  });

  it.each(["/api/me", "/api/team/reps", "/api/tasks", "/api/tasks/overdue"])(
    "still returns 401 for %s without a token",
    async (path) => {
      const response = await request(app).get(path);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("unauthenticated");
    },
  );

  it("still returns 401 for completing a task without a token", async () => {
    const response = await request(app).post("/api/tasks/task-1001/complete");

    expect(response.status).toBe(401);
  });

  it("returns 400 invalid_request for a malformed JSON body", async () => {
    const response = await request(app)
      .post("/api/tasks/task-1003/complete")
      .set("Authorization", "Bearer demo-marcus")
      .set("Content-Type", "application/json")
      .send("{bad");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_request");
  });

  it("returns a JSON 404 for paths outside /api", async () => {
    const response = await request(app).get("/nope");

    expect(response.status).toBe(404);
    expect(response.type).toBe("application/json");
    expect(response.body.error.code).toBe("not_found");
  });
});
