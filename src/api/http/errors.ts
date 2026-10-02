import type { ErrorRequestHandler } from "express";

import type { ApiErrorBody } from "../../shared/types";
import { DomainError } from "../domain/errors";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const statusByDomainCode: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  conflict: 409,
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: "internal_error", message: "Something went wrong" } };

  if (error instanceof HttpError) {
    status = error.status;
    body = { error: { code: error.code, message: error.message } };
  } else if (error instanceof DomainError) {
    status = statusByDomainCode[error.code] ?? 400;
    body = { error: { code: error.code, message: error.message } };
  } else if (isBodyParseError(error)) {
    status = 400;
    body = { error: { code: "invalid_request", message: "Request body must be valid JSON" } };
  } else {
    console.error(error);
  }

  res.status(status).json(body);
};

/** `express.json()` reports an unparseable body as an error with this `type`. */
function isBodyParseError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { type?: unknown }).type === "entity.parse.failed";
}
