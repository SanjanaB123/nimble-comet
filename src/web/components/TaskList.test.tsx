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
