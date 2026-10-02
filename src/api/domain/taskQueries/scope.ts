import type { AccessScope, RequestContext } from "../../auth/requestContext";
import type { DirectoryRepository, TaskQuery } from "../../repository/types";
import { ForbiddenError } from "../errors";
import type { TaskQueryFilters } from "./types";

/**
 * The tasks a scope may see, as a repository query. This is the single definition of task
 * visibility: listing, summarizing, and completing tasks all go through it.
 */
export function scopeQuery(scope: AccessScope): TaskQuery {
  return scope.kind === "self" ? { assigneeIds: [scope.userId] } : { teamIds: scope.teamIds };
}

/** Narrows a repository query to the records the signed-in user may see. */
export class TaskScopeResolver {
  constructor(private readonly directory: DirectoryRepository) {}

  async resolve(context: RequestContext, filters: Pick<TaskQueryFilters, "repId">): Promise<TaskQuery> {
    const { scope } = context;
    const visible = scopeQuery(scope);

    if (!filters.repId) {
      return visible;
    }

    if (scope.kind === "self") {
      if (filters.repId !== scope.userId) {
        throw new ForbiddenError("Reps can only view their own tasks");
      }
      return visible;
    }

    const rep = await this.directory.findUserById(filters.repId);
    if (!rep || rep.role !== "rep" || rep.teamId === null || !scope.teamIds.includes(rep.teamId)) {
      throw new ForbiddenError("That rep is not on a team you manage");
    }
    return { ...visible, assigneeIds: [rep.id] };
  }
}
