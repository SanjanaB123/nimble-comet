import type { TaskStatus, UserRole } from "../../shared/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Home team for reps. Managers are linked to teams through `Team.managerId`. */
  teamId: string | null;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
}

export interface Task {
  id: string;
  title: string;
  customerName: string;
  assigneeId: string;
  teamId: string;
  status: TaskStatus;
  /** ISO-8601 timestamp in UTC. */
  dueAt: string;
  /** ISO-8601 timestamp in UTC; set when the task is completed. */
  completedAt: string | null;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
}

export interface TaskQuery {
  teamIds?: string[];
  assigneeIds?: string[];
  status?: TaskStatus;
}

export interface TaskRepository {
  findTasks(query: TaskQuery): Promise<Task[]>;
  findTaskById(id: string): Promise<Task | undefined>;
  updateTask(id: string, changes: Partial<Pick<Task, "status" | "completedAt">>): Promise<Task>;
}

export interface DirectoryRepository {
  findUserById(id: string): Promise<User | undefined>;
  findUsersByIds(ids: string[]): Promise<User[]>;
  findTeamById(id: string): Promise<Team | undefined>;
  findTeamsByIds(ids: string[]): Promise<Team[]>;
  findTeamsManagedBy(managerId: string): Promise<Team[]>;
  findRepsByTeamIds(teamIds: string[]): Promise<User[]>;
}

export interface SessionRepository {
  findSessionByToken(token: string): Promise<Session | undefined>;
  listSessions(): Promise<Session[]>;
}
