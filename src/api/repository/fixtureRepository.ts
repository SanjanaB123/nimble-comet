import type { FixtureData } from "../fixtures/data";
import type {
  DirectoryRepository,
  Session,
  SessionRepository,
  Task,
  TaskQuery,
  TaskRepository,
  Team,
  User,
} from "./types";

/**
 * In-memory repositories backed by fixture data. Each instance works on its own
 * copy of the data, so changes made while the server runs are discarded on restart.
 */
export class FixtureTaskRepository implements TaskRepository {
  private readonly tasks: Task[];

  constructor(data: FixtureData) {
    this.tasks = data.tasks.map((task) => ({ ...task }));
  }

  async findTasks(query: TaskQuery): Promise<Task[]> {
    return this.tasks
      .filter((task) => !query.teamIds || query.teamIds.includes(task.teamId))
      .filter((task) => !query.assigneeIds || query.assigneeIds.includes(task.assigneeId))
      .filter((task) => !query.status || task.status === query.status)
      .map((task) => ({ ...task }));
  }

  async findTaskById(id: string): Promise<Task | undefined> {
    const task = this.tasks.find((candidate) => candidate.id === id);
    return task ? { ...task } : undefined;
  }

  async updateTask(id: string, changes: Partial<Pick<Task, "status" | "completedAt">>): Promise<Task> {
    const task = this.tasks.find((candidate) => candidate.id === id);
    if (!task) {
      throw new Error(`Task ${id} does not exist`);
    }
    Object.assign(task, changes);
    return { ...task };
  }
}

export class FixtureDirectoryRepository implements DirectoryRepository {
  private readonly users: User[];
  private readonly teams: Team[];

  constructor(data: FixtureData) {
    this.users = data.users.map((user) => ({ ...user }));
    this.teams = data.teams.map((team) => ({ ...team }));
  }

  async findUserById(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async findUsersByIds(ids: string[]): Promise<User[]> {
    return this.users.filter((user) => ids.includes(user.id));
  }

  async findTeamById(id: string): Promise<Team | undefined> {
    return this.teams.find((team) => team.id === id);
  }

  async findTeamsByIds(ids: string[]): Promise<Team[]> {
    return this.teams.filter((team) => ids.includes(team.id));
  }

  async findTeamsManagedBy(managerId: string): Promise<Team[]> {
    return this.teams.filter((team) => team.managerId === managerId);
  }

  async findRepsByTeamIds(teamIds: string[]): Promise<User[]> {
    return this.users.filter((user) => user.role === "rep" && user.teamId !== null && teamIds.includes(user.teamId));
  }
}

export class FixtureSessionRepository implements SessionRepository {
  private readonly sessions: Session[];

  constructor(data: FixtureData) {
    this.sessions = data.sessions.map((session) => ({ ...session }));
  }

  async findSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.find((session) => session.token === token);
  }

  async listSessions(): Promise<Session[]> {
    return this.sessions.map((session) => ({ ...session }));
  }
}
