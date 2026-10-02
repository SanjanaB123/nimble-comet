import { useState } from "react";

import type { TaskStatus, TaskView } from "../../shared/types";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { TaskTable } from "./TaskTable";

export type TaskListView = "all" | "overdue";

interface TaskListProps {
  view: TaskListView;
  repId?: string;
  status?: TaskStatus;
}

const emptyMessages: Record<TaskListView, string> = {
  all: "No tasks match these filters.",
  overdue: "No overdue tasks. Everyone is caught up.",
};

export function TaskList({ view, repId, status }: TaskListProps) {
  const tasks = useAsync(
    async () => {
      const response = view === "overdue" ? await api.listOverdueTasks({ repId }) : await api.listTasks({ repId, status });
      return response.tasks;
    },
    [view, repId, status],
  );
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function completeTask(task: TaskView) {
    setPendingTaskId(task.id);
    setActionError(null);
    try {
      await api.completeTask(task.id);
      tasks.reload();
    } catch (error) {
      setActionError(`Could not complete "${task.title}": ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPendingTaskId(null);
    }
  }

  const rows = tasks.status === "success" ? tasks.data : [];
  const loadError = tasks.status === "error" ? tasks.error : null;

  if (tasks.status === "loading") {
    return (
      <p className="state" role="status">
        Loading tasks…
      </p>
    );
  }

  if (loadError) {
    return (
      <div className="state state-error" role="alert">
        <p>We couldn't load tasks. {loadError.message}</p>
        <button type="button" onClick={tasks.reload}>
          Try again
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="state state-empty">{emptyMessages[view]}</p>;
  }

  return (
    <>
      {actionError && (
        <p className="state state-error" role="alert">
          {actionError}
        </p>
      )}
      <p className="muted">
        {rows.length} {rows.length === 1 ? "task" : "tasks"}
      </p>
      <TaskTable tasks={rows} pendingTaskId={pendingTaskId} onComplete={completeTask} />
    </>
  );
}
