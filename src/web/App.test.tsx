// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DemoAccount, RepWorkload, TaskView } from "../shared/types";
import { App } from "./App";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const dana: DemoAccount = { token: "demo-dana", name: "Dana Whitfield", role: "manager", teamName: "North Metro" };
const marcus: DemoAccount = { token: "demo-marcus", name: "Marcus Bell", role: "rep", teamName: "North Metro" };
const north = { id: "team-north", name: "North Metro" };

const aliciasTask: TaskView = {
  id: "task-1004",
  title: "Collect signed utility authorization",
  customerName: "Brooks residence",
  status: "open",
  dueAt: "2026-03-10T09:00:00.000Z",
  completedAt: null,
  isOverdue: true,
  assignee: { id: "u-alicia", name: "Alicia Chen" },
  team: north,
};
const aliciasWorkload: RepWorkload = {
  rep: { id: "u-alicia", name: "Alicia Chen" },
  team: north,
  openCount: 2,
  overdueCount: 1,
  oldestOverdueDueAt: aliciasTask.dueAt,
};

/**
 * A fake API that answers as the given account and records every request path.
 * `repsFailures` makes the first N requests for the rep list fail.
 */
function mockApi(account: DemoAccount, { repsFailures = 0 } = {}) {
  let repsRequests = 0;
  const fetchMock = vi.fn(async (path: string) => {
    if (path === "/api/demo-accounts") return json({ accounts: [account] });
    if (path === "/api/me") {
      return json({ user: { id: `u-${account.token.slice(5)}`, name: account.name, role: account.role }, teams: [north] });
    }
    if (path === "/api/team/reps") {
      if (repsRequests++ < repsFailures) {
        return json({ error: { code: "internal_error", message: "Something went wrong" } }, 500);
      }
      return json({ reps: [{ id: "u-alicia", name: "Alicia Chen", teamId: north.id }] });
    }
    if (path === "/api/tasks/summary") return json({ reps: [aliciasWorkload] });
    if (path.startsWith("/api/tasks")) return json({ tasks: [aliciasTask] });
    return json({ error: { code: "not_found", message: "Route not found" } }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("App team summary", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("keeps Tasks as the manager's default view and offers a Team tab", async () => {
    mockApi(dana);

    render(<App />);

    expect(await screen.findByText("Collect signed utility authorization")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tasks" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Team" })).toBeTruthy();
  });

  it("hides the task filters on the Team tab", async () => {
    mockApi(dana);

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Team" }));

    expect(await screen.findByText("1 of 1 rep has overdue work.")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /^Rep/ })).toBeNull();
    expect(screen.queryByRole("combobox", { name: /^Status/ })).toBeNull();
  });

  it("goes from a rep's summary row to their overdue tasks", async () => {
    const fetchMock = mockApi(dana);

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Team" }));
    await userEvent.click(await screen.findByRole("button", { name: "View Alicia Chen's overdue tasks" }));

    expect(screen.getByRole("button", { name: "Overdue" }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByRole("combobox", { name: /^Rep/ }) as HTMLSelectElement).value).toBe("u-alicia");
    expect(await screen.findByText("Collect signed utility authorization")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/overdue?repId=u-alicia", expect.anything());
  });

  it("does not offer the Team tab to reps", async () => {
    const fetchMock = mockApi(marcus);

    render(<App />);

    expect(await screen.findByText("My follow-ups")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Team" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/tasks/summary", expect.anything());
  });
});

describe("App rep filter", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("tells a manager when the rep list fails to load and lets them retry", async () => {
    mockApi(dana, { repsFailures: 1 });

    render(<App />);
    await screen.findByText("Collect signed utility authorization");

    expect((await screen.findByRole("alert")).textContent).toContain("Could not load reps");
    expect(screen.queryByRole("combobox", { name: /^Rep/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Retry loading reps" }));

    expect(await screen.findByRole("combobox", { name: /^Rep/ })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not show a rep-list error to reps, who have no rep filter", async () => {
    const fetchMock = mockApi(marcus);

    render(<App />);
    await screen.findByText("Collect signed utility authorization");

    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/team/reps", expect.anything());
  });
});
