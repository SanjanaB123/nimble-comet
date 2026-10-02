import { useEffect, useState } from "react";

import type { TaskStatus } from "../shared/types";
import { api, setSessionToken } from "./api/client";
import { AccountSwitcher } from "./components/AccountSwitcher";
import { RepFilter } from "./components/RepFilter";
import { TaskList, type TaskListView } from "./components/TaskList";
import { useAsync } from "./hooks/useAsync";
import { loadSavedToken, saveToken } from "./session";

const tabs: { id: TaskListView; label: string }[] = [
  { id: "all", label: "Tasks" },
  { id: "overdue", label: "Overdue" },
];

export function App() {
  const accounts = useAsync(async () => (await api.demoAccounts()).accounts, []);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.status !== "success" || token) return;
    const saved = loadSavedToken();
    const initial = accounts.data.find((account) => account.token === saved) ?? accounts.data[0];
    if (initial) selectAccount(initial.token);
  }, [accounts, token]);

  function selectAccount(nextToken: string) {
    setSessionToken(nextToken);
    saveToken(nextToken);
    setToken(nextToken);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Field Operations</h1>
        {accounts.status === "success" && token && (
          <AccountSwitcher accounts={accounts.data} token={token} onChange={selectAccount} />
        )}
      </header>
      <main>
        {accounts.status === "loading" && (
          <p className="state" role="status">
            Connecting…
          </p>
        )}
        {accounts.status === "error" && (
          <div className="state state-error" role="alert">
            <p>Could not reach the API. Is the server running?</p>
            <button type="button" onClick={accounts.reload}>
              Try again
            </button>
          </div>
        )}
        {token && <Workspace key={token} />}
      </main>
    </div>
  );
}

function Workspace() {
  const me = useAsync(() => api.currentUser(), []);
  const isManager = me.status === "success" && me.data.user.role === "manager";
  const reps = useAsync(async () => (isManager ? (await api.teamReps()).reps : []), [isManager]);

  const [view, setView] = useState<TaskListView>("all");
  const [repId, setRepId] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("open");

  if (me.status === "loading") {
    return (
      <p className="state" role="status">
        Loading your workspace…
      </p>
    );
  }
  if (me.status === "error") {
    return (
      <div className="state state-error" role="alert">
        <p>Could not load your account. {me.error.message}</p>
        <button type="button" onClick={me.reload}>
          Try again
        </button>
      </div>
    );
  }

  const teamNames = me.data.teams.map((team) => team.name).join(", ");

  return (
    <section>
      <div className="workspace-heading">
        <h2>{isManager ? `${teamNames} follow-ups` : "My follow-ups"}</h2>
        <nav className="tabs" aria-label="Task views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === view ? "tab tab-active" : "tab"}
              aria-pressed={tab.id === view}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="filters">
        {isManager && reps.status === "success" && <RepFilter reps={reps.data} value={repId} onChange={setRepId} />}
        {view === "all" && (
          <label className="filter">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | "")}>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="">All</option>
            </select>
          </label>
        )}
      </div>

      <TaskList view={view} repId={repId || undefined} status={status || undefined} />
    </section>
  );
}
