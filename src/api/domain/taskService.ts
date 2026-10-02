import type { TaskView } from "../../shared/types";
import type { RequestContext } from "../auth/requestContext";
import type { DirectoryRepository, Task, TaskRepository } from "../repository/types";
import type { Clock } from "./clock";
import { ConflictError, NotFoundError } from "./errors";
import type { TaskQueryEngine, TaskQueryFilters } from "./taskQueries";
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

  async completeTask(context: RequestContext, taskId: string): Promise<TaskView> {
    const task = await this.tasks.findTaskById(taskId);
    if (!task || !this.canAccess(context, task)) {
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

  private canAccess(context: RequestContext, task: Task): boolean {
    return context.scope.kind === "teams"
      ? context.scope.teamIds.includes(task.teamId)
      : task.teamId === context.user.teamId;
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
