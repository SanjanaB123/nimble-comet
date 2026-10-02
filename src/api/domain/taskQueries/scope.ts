import type { RequestContext } from "../../auth/requestContext";
import type { DirectoryRepository, TaskQuery } from "../../repository/types";
import { ForbiddenError } from "../errors";
import type { TaskQueryFilters } from "./types";

/** Narrows a repository query to the records the signed-in user may see. */
export class TaskScopeResolver {
  constructor(private readonly directory: DirectoryRepository) {}

  async resolve(context: RequestContext, filters: Pick<TaskQueryFilters, "repId">): Promise<TaskQuery> {
    const { scope } = context;

    if (scope.kind === "self") {
      if (filters.repId && filters.repId !== scope.userId) {
        throw new ForbiddenError("Reps can only view their own tasks");
      }
      return { assigneeIds: [scope.userId] };
    }

    if (!filters.repId) {
      return { teamIds: scope.teamIds };
    }

    const rep = await this.directory.findUserById(filters.repId);
    if (!rep || rep.role !== "rep" || rep.teamId === null || !scope.teamIds.includes(rep.teamId)) {
      throw new ForbiddenError("That rep is not on a team you manage");
    }
    return { teamIds: scope.teamIds, assigneeIds: [rep.id] };
  }
}
