import { Router, type RequestHandler } from "express";

import type { TaskListResponse, TaskResponse, TaskSummaryResponse } from "../../shared/types";
import { requestContext } from "../auth/authenticate";
import type { TaskService } from "../domain/taskService";
import { optionalString, optionalTaskStatus } from "./query";

export function taskRoutes(taskService: TaskService, auth: RequestHandler): Router {
  const router = Router();

  router.get("/", auth, async (req, res) => {
    const tasks = await taskService.listTasks(requestContext(res), {
      repId: optionalString(req.query.repId, "repId"),
      status: optionalTaskStatus(req.query.status),
    });
    res.json({ tasks } satisfies TaskListResponse);
  });

  router.get("/overdue", auth, async (req, res) => {
    const tasks = await taskService.listOverdueTasks(requestContext(res), {
      repId: optionalString(req.query.repId, "repId"),
    });
    res.json({ tasks } satisfies TaskListResponse);
  });

  router.get("/summary", auth, async (_req, res) => {
    const reps = await taskService.summarizeByRep(requestContext(res));
    res.json({ reps } satisfies TaskSummaryResponse);
  });

  router.post<"/:taskId/complete", { taskId: string }>("/:taskId/complete", auth, async (req, res) => {
    const task = await taskService.completeTask(requestContext(res), req.params.taskId);
    res.json({ task } satisfies TaskResponse);
  });

  return router;
}
