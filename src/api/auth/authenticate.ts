import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { DirectoryRepository, SessionRepository } from "../repository/types";
import { HttpError } from "../http/errors";
import { buildRequestContext, type RequestContext } from "./requestContext";

const BEARER_PREFIX = "Bearer ";

/**
 * Resolves the bearer token on the request to a signed-in user. Tokens are the
 * demo session tokens from the local fixtures; there is no password flow.
 */
export function authenticate(sessions: SessionRepository, directory: DirectoryRepository): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.get("authorization");
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new HttpError(401, "unauthenticated", "Missing bearer token");
    }

    const session = await sessions.findSessionByToken(header.slice(BEARER_PREFIX.length).trim());
    const user = session ? await directory.findUserById(session.userId) : undefined;
    if (!user) {
      throw new HttpError(401, "unauthenticated", "Session is not valid");
    }

    res.locals.context = await buildRequestContext(user, directory);
    next();
  };
}

export function requestContext(res: Response): RequestContext {
  const context = res.locals.context as RequestContext | undefined;
  if (!context) {
    throw new HttpError(401, "unauthenticated", "Request is not authenticated");
  }
  return context;
}
