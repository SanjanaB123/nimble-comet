import express, { type Express } from "express";

import type { DemoAccountsResponse } from "../shared/types";
import { authenticate } from "./auth/authenticate";
import { systemClock, type Clock } from "./domain/clock";
import { DirectoryService } from "./domain/directoryService";
import { createTaskQueryRegistry, TaskQueryEngine, TaskScopeResolver } from "./domain/taskQueries";
import { TaskService } from "./domain/taskService";
import { createFixtureData, type FixtureData } from "./fixtures/data";
import { directoryRoutes } from "./http/directoryRoutes";
import { errorHandler, HttpError } from "./http/errors";
import { taskRoutes } from "./http/taskRoutes";
import {
  FixtureDirectoryRepository,
  FixtureSessionRepository,
  FixtureTaskRepository,
} from "./repository/fixtureRepository";

export interface AppOptions {
  clock?: Clock;
  data?: FixtureData;
}

export function createApp({ clock = systemClock, data = createFixtureData(clock.now()) }: AppOptions = {}): Express {
  const taskRepository = new FixtureTaskRepository(data);
  const directoryRepository = new FixtureDirectoryRepository(data);
  const sessionRepository = new FixtureSessionRepository(data);

  const taskQueries = new TaskQueryEngine(
    createTaskQueryRegistry(),
    new TaskScopeResolver(directoryRepository),
    taskRepository,
    clock,
  );
  const taskService = new TaskService(taskRepository, directoryRepository, taskQueries, clock);
  const directoryService = new DirectoryService(directoryRepository, sessionRepository);

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/demo-accounts", async (_req, res) => {
    res.json({ accounts: await directoryService.listDemoAccounts() } satisfies DemoAccountsResponse);
  });

  const authenticated = express.Router();
  authenticated.use(authenticate(sessionRepository, directoryRepository));
  authenticated.use(directoryRoutes(directoryService));
  authenticated.use("/tasks", taskRoutes(taskService));
  app.use("/api", authenticated);

  app.use("/api", () => {
    throw new HttpError(404, "not_found", "Route not found");
  });
  app.use(errorHandler);

  return app;
}
