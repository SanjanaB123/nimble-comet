// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TaskView } from "../../shared/types";
import { TaskList } from "./TaskList";

const task: TaskView = {
  id: "task-1",
  title: "Confirm install date",
  customerName: "Patel residence",
  status: "open",
  dueAt: "2026-03-09T15:00:00.000Z",
  completedAt: null,
  isOverdue: true,
  assignee: { id: "u-marcus", name: "Marcus Bell" },
  team: { id: "team-north", name: "North Metro" },
};

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("TaskList", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a loading message and then the tasks", async () => {
    mockFetch({ tasks: [task] });

    render(<TaskList view="overdue" />);

    expect(screen.getByRole("status")).toHaveProperty("textContent", "Loading tasks…");
    expect(await screen.findByText("Confirm install date")).toBeTruthy();
    expect(screen.getByText("Overdue")).toBeTruthy();
  });

  it("requests the overdue endpoint with the selected rep", async () => {
    const fetchMock = mockFetch({ tasks: [task] });

    render(<TaskList view="overdue" repId="u-marcus" />);

    await screen.findByText("Confirm install date");
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/overdue?repId=u-marcus", expect.anything());
  });

  it("tells the user when there is nothing overdue", async () => {
    mockFetch({ tasks: [] });

    render(<TaskList view="overdue" />);

    expect(await screen.findByText("No overdue tasks. Everyone is caught up.")).toBeTruthy();
  });

  it("shows an error with a retry instead of the empty message when the request fails", async () => {
    const fetchMock = mockFetch({ error: { code: "internal_error", message: "Something went wrong" } }, 500);

    render(<TaskList view="overdue" />);

    expect((await screen.findByRole("alert")).textContent).toContain("Something went wrong");
    expect(screen.queryByText("No overdue tasks. Everyone is caught up.")).toBeNull();

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tasks: [task] }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Confirm install date")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("TaskList completing a task", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const alreadyCompleted = { error: { code: "conflict", message: "Task task-1 is already completed" } };
  const completedTask: TaskView = { ...task, status: "completed", completedAt: "2026-03-10T09:00:00.000Z", isOverdue: false };

  /** Serves `lists` in order for each GET (repeating the last), and `completion` for the POST. */
  function mockServer(lists: TaskView[][], completion: Response) {
    let listCalls = 0;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") return completion;
      return json({ tasks: lists[Math.min(listCalls++, lists.length - 1)] });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("refreshes the list when completing fails, so a task completed elsewhere stops looking open", async () => {
    mockServer([[task], [completedTask]], json(alreadyCompleted, 409));

    render(<TaskList view="all" />);
    await userEvent.click(await screen.findByRole("button", { name: "Mark complete" }));

    expect((await screen.findByRole("alert")).textContent).toContain("already completed");
    expect(await screen.findByText("Completed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Mark complete" })).toBeNull();
  });

  it("keeps the failure message visible when the refreshed list is empty", async () => {
    mockServer([[task], []], json(alreadyCompleted, 409));

    render(<TaskList view="overdue" />);
    await userEvent.click(await screen.findByRole("button", { name: "Mark complete" }));

    expect(await screen.findByText("No overdue tasks. Everyone is caught up.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("already completed");
  });

  it("clears the failure message when the filters change", async () => {
    mockServer([[task]], json(alreadyCompleted, 409));

    const { rerender } = render(<TaskList view="all" />);
    await userEvent.click(await screen.findByRole("button", { name: "Mark complete" }));
    await screen.findByRole("alert");

    rerender(<TaskList view="all" repId="u-alicia" />);

    await screen.findByText("Confirm install date");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
