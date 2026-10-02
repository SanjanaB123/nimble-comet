// Types shared by the API responses and the web client.

export type UserRole = "manager" | "rep";

export type TaskStatus = "open" | "completed";

export interface UserSummary {
  id: string;
  name: string;
  role: UserRole;
}

export interface TeamSummary {
  id: string;
  name: string;
}

export interface CurrentUserResponse {
  user: UserSummary;
  teams: TeamSummary[];
}

export interface DemoAccount {
  token: string;
  name: string;
  role: UserRole;
  teamName: string;
}

export interface DemoAccountsResponse {
  accounts: DemoAccount[];
}

export interface RepSummary {
  id: string;
  name: string;
  teamId: string;
}

export interface TeamRepsResponse {
  reps: RepSummary[];
}

export interface TaskView {
  id: string;
  title: string;
  customerName: string;
  status: TaskStatus;
  dueAt: string;
  completedAt: string | null;
  isOverdue: boolean;
  assignee: { id: string; name: string };
  team: { id: string; name: string };
}

export interface TaskListResponse {
  tasks: TaskView[];
}

export interface TaskResponse {
  task: TaskView;
}

/** One rep's open work, as counted for the manager's team summary. */
export interface RepWorkload {
  rep: { id: string; name: string };
  team: TeamSummary;
  /** Open tasks, overdue ones included. */
  openCount: number;
  overdueCount: number;
  /** Due time of the rep's longest-overdue task; `null` when nothing is overdue. */
  oldestOverdueDueAt: string | null;
}

export interface TaskSummaryResponse {
  reps: RepWorkload[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
