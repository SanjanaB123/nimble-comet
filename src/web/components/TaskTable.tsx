import type { TaskView } from "../../shared/types";
import { formatDue } from "../format";

interface TaskTableProps {
  tasks: TaskView[];
  pendingTaskId: string | null;
  onComplete: (task: TaskView) => void;
}

export function TaskTable({ tasks, pendingTaskId, onComplete }: TaskTableProps) {
  return (
    <table className="task-table">
      <thead>
        <tr>
          <th scope="col">Task</th>
          <th scope="col">Customer</th>
          <th scope="col">Rep</th>
          <th scope="col">Due</th>
          <th scope="col">Status</th>
          <th scope="col">
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td>{task.title}</td>
            <td>{task.customerName}</td>
            <td>
              {task.assignee.name}
              <div className="muted">{task.team.name}</div>
            </td>
            <td>{formatDue(task.dueAt)}</td>
            <td>
              <StatusBadge task={task} />
            </td>
            <td className="actions">
              {task.status === "open" && (
                <button type="button" onClick={() => onComplete(task)} disabled={pendingTaskId === task.id}>
                  {pendingTaskId === task.id ? "Saving…" : "Mark complete"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ task }: { task: TaskView }) {
  if (task.status === "completed") {
    return <span className="badge badge-done">Completed</span>;
  }
  if (task.isOverdue) {
    return <span className="badge badge-overdue">Overdue</span>;
  }
  return <span className="badge badge-open">Open</span>;
}
