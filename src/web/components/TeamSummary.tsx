import { api } from "../api/client";
import { formatDate } from "../format";
import { useAsync } from "../hooks/useAsync";

interface TeamSummaryProps {
  /** Called with a rep's id to show that rep's overdue tasks. */
  onSelectRep: (repId: string) => void;
}

/** Each rep's open and overdue counts, most behind first, for a manager's check-in. */
export function TeamSummary({ onSelectRep }: TeamSummaryProps) {
  const summary = useAsync(async () => (await api.taskSummary()).reps, []);

  if (summary.status === "loading") {
    return (
      <p className="state" role="status">
        Loading team summary…
      </p>
    );
  }

  if (summary.status === "error") {
    return (
      <div className="state state-error" role="alert">
        <p>We couldn't load the team summary. {summary.error.message}</p>
        <button type="button" onClick={summary.reload}>
          Try again
        </button>
      </div>
    );
  }

  if (summary.data.length === 0) {
    return <p className="state state-empty">There are no reps on your teams yet.</p>;
  }

  const behind = summary.data.filter((row) => row.overdueCount > 0).length;

  return (
    <>
      <p className="muted">
        {behind === 0
          ? "Everyone is caught up."
          : `${behind} of ${summary.data.length} ${summary.data.length === 1 ? "rep has" : "reps have"} overdue work.`}
      </p>
      <table className="task-table">
        <thead>
          <tr>
            <th scope="col">Rep</th>
            <th scope="col">Overdue</th>
            <th scope="col">Open</th>
            <th scope="col">Oldest overdue</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.data.map((row) => (
            <tr key={row.rep.id}>
              <th scope="row">
                {row.rep.name}
                <div className="muted">{row.team.name}</div>
              </th>
              <td>
                <span className={row.overdueCount > 0 ? "badge badge-overdue" : "badge badge-done"}>
                  {row.overdueCount}
                </span>
              </td>
              <td>{row.openCount}</td>
              <td>{row.oldestOverdueDueAt ? `Due ${formatDate(row.oldestOverdueDueAt)}` : "—"}</td>
              <td className="actions">
                {row.overdueCount > 0 && (
                  <button type="button" onClick={() => onSelectRep(row.rep.id)} aria-label={`View ${row.rep.name}'s overdue tasks`}>
                    View overdue
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
