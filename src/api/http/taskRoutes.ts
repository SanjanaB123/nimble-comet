import { Router } from "express";

import type { TaskListResponse, TaskResponse } from "../../shared/types";
import { requestContext } from "../auth/authenticate";
import type { TaskService } from "../domain/taskService";
import { optionalString, optionalTaskStatus } from "./query";

export function taskRoutes(taskService: TaskService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const tasks = await taskService.listTasks(requestContext(res), {
      repId: optionalString(req.query.repId, "repId"),
      status: optionalTaskStatus(req.query.status),
    });
    res.json({ tasks } satisfies TaskListResponse);
  });

  router.get("/overdue", async (req, res) => {
    const tasks = await taskService.listOverdueTasks(requestContext(res), {
      repId: optionalString(req.query.repId, "repId"),
    });
    res.json({ tasks } satisfies TaskListResponse);
  });

  router.post("/:taskId/complete", async (req, res) => {
    const task = await taskService.completeTask(requestContext(res), req.params.taskId);
    res.json({ task } satisfies TaskResponse);
  });

  return router;
}
