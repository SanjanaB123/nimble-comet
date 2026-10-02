import type {
  ApiErrorBody,
  CurrentUserResponse,
  DemoAccountsResponse,
  TaskListResponse,
  TaskResponse,
  TaskStatus,
  TeamRepsResponse,
} from "../../shared/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let sessionToken: string | null = null;

export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const response = await fetch(path, { ...init, headers });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(response.status, error?.code ?? "http_error", error?.message ?? `Request failed (${response.status})`);
  }
  return body as T;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export interface TaskListParams {
  repId?: string;
  status?: TaskStatus;
}

export const api = {
  demoAccounts: () => request<DemoAccountsResponse>("/api/demo-accounts"),
  currentUser: () => request<CurrentUserResponse>("/api/me"),
  teamReps: () => request<TeamRepsResponse>("/api/team/reps"),
  listTasks: (params: TaskListParams = {}) => request<TaskListResponse>(withQuery("/api/tasks", { ...params })),
  listOverdueTasks: (params: Pick<TaskListParams, "repId"> = {}) =>
    request<TaskListResponse>(withQuery("/api/tasks/overdue", { ...params })),
  completeTask: (taskId: string) =>
    request<TaskResponse>(`/api/tasks/${encodeURIComponent(taskId)}/complete`, { method: "POST" }),
};
