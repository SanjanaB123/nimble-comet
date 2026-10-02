export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super("not_found", message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super("forbidden", message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("conflict", message);
  }
}
