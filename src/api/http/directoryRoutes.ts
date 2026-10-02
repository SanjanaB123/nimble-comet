import { Router, type RequestHandler } from "express";

import type { TeamRepsResponse } from "../../shared/types";
import { requestContext } from "../auth/authenticate";
import type { DirectoryService } from "../domain/directoryService";

export function directoryRoutes(directoryService: DirectoryService, auth: RequestHandler): Router {
  const router = Router();

  router.get("/me", auth, async (_req, res) => {
    res.json(await directoryService.currentUser(requestContext(res)));
  });

  router.get("/team/reps", auth, async (_req, res) => {
    const reps = await directoryService.listTeamReps(requestContext(res));
    res.json({ reps } satisfies TeamRepsResponse);
  });

  return router;
}
