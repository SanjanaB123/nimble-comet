import type { RepWorkload, TaskView } from "../../shared/types";
import type { RequestContext } from "../auth/requestContext";
import type { DirectoryRepository, Task, TaskRepository } from "../repository/types";
import type { Clock } from "./clock";
import { ConflictError, ForbiddenError, NotFoundError } from "./errors";
import { scopeQuery, type TaskQueryEngine, type TaskQueryFilters } from "./taskQueries";
import { isOverdue } from "./tasks";

export type TaskFilters = TaskQueryFilters;

export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly directory: DirectoryRepository,
    private readonly queries: TaskQueryEngine,
    private readonly clock: Clock,
  ) {}

  async listTasks(context: RequestContext, filters: TaskFilters = {}): Promise<TaskView[]> {
    return this.toViews(await this.queries.run("all", context, filters));
  }

  async listOverdueTasks(context: RequestContext, filters: Pick<TaskFilters, "repId"> = {}): Promise<TaskView[]> {
    return this.toViews(await this.queries.run("overdue", context, filters));
  }

  /**
   * Open and overdue counts for every rep on the manager's teams, most behind first.
   * Uses the same query and overdue rule as the task lists so the numbers always agree with them.
   */
  async summarizeByRep(context: RequestContext): Promise<RepWorkload[]> {
    if (context.scope.kind !== "teams") {
      throw new ForbiddenError("Only managers can view the team summary");
    }

    const now = this.clock.now();
    const [reps, teams, openTasks] = await Promise.all([
      this.directory.findRepsByTeamIds(context.scope.teamIds),
      this.directory.findTeamsByIds(context.scope.teamIds),
      this.queries.run("all", context, { status: "open" }),
    ]);
    const teamNames = new Map(teams.map((team) => [team.id, team.name]));

    const workloads = new Map<string, RepWorkload>(
      reps.map((rep) => [
        rep.id,
        {
          rep: { id: rep.id, name: rep.name },
          team: { id: rep.teamId!, name: teamNames.get(rep.teamId!) ?? "Unknown team" },
          openCount: 0,
          overdueCount: 0,
          oldestOverdueDueAt: null,
        },
      ]),
    );

    // Tasks arrive ordered by due time, so the first overdue task seen for a rep is their oldest.
    for (const task of openTasks) {
      const workload = workloads.get(task.assigneeId);
      if (!workload) continue;
      workload.openCount += 1;
      if (isOverdue(task, now)) {
        workload.overdueCount += 1;
        workload.oldestOverdueDueAt ??= task.dueAt;
      }
    }

    return [...workloads.values()].sort(
      (a, b) =>
        b.overdueCount - a.overdueCount ||
        compareOldestOverdue(a.oldestOverdueDueAt, b.oldestOverdueDueAt) ||
        a.rep.name.localeCompare(b.rep.name),
    );
  }

  async completeTask(context: RequestContext, taskId: string): Promise<TaskView> {
    // Look the task up through the same visibility query the lists use, so a task the user
    // cannot see is indistinguishable from one that does not exist.
    const [task] = await this.tasks.findTasks({ ...scopeQuery(context.scope), ids: [taskId] });
    if (!task) {
      throw new NotFoundError(`Task ${taskId} was not found`);
    }
    if (task.status === "completed") {
      throw new ConflictError(`Task ${taskId} is already completed`);
    }

    const updated = await this.tasks.updateTask(taskId, {
      status: "completed",
      completedAt: this.clock.now().toISOString(),
    });
    const [view] = await this.toViews([updated]);
    return view!;
  }

  private async toViews(tasks: Task[]): Promise<TaskView[]> {
    const now = this.clock.now();
    const users = await this.directory.findUsersByIds([...new Set(tasks.map((task) => task.assigneeId))]);
    const teams = await this.directory.findTeamsByIds([...new Set(tasks.map((task) => task.teamId))]);
    const userNames = new Map(users.map((user) => [user.id, user.name]));
    const teamNames = new Map(teams.map((team) => [team.id, team.name]));

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      customerName: task.customerName,
      status: task.status,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      isOverdue: isOverdue(task, now),
      assignee: { id: task.assigneeId, name: userNames.get(task.assigneeId) ?? "Unknown rep" },
      team: { id: task.teamId, name: teamNames.get(task.teamId) ?? "Unknown team" },
    }));
  }
}

/** Earliest due time first; reps with nothing overdue sort after those with something. */
function compareOldestOverdue(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}
