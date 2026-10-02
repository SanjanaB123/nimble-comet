// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RepWorkload } from "../../shared/types";
import { formatDate } from "../format";
import { TeamSummary } from "./TeamSummary";

const north = { id: "team-north", name: "North Metro" };
const jordan: RepWorkload = {
  rep: { id: "u-jordan", name: "Jordan Pike" },
  team: north,
  openCount: 3,
  overdueCount: 2,
  oldestOverdueDueAt: "2026-03-07T12:00:00.000Z",
};
const alicia: RepWorkload = {
  rep: { id: "u-alicia", name: "Alicia Chen" },
  team: north,
  openCount: 1,
  overdueCount: 0,
  oldestOverdueDueAt: null,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("TeamSummary", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a loading message and then each rep's counts in the order the API sends", async () => {
    const fetchMock = mockFetch(json({ reps: [jordan, alicia] }));

    render(<TeamSummary onSelectRep={() => {}} />);

    expect(screen.getByRole("status").textContent).toBe("Loading team summary…");
    const rows = (await screen.findAllByRole("row")).slice(1);
    expect(rows.map((row) => within(row).getByRole("rowheader").textContent)).toEqual([
      "Jordan PikeNorth Metro",
      "Alicia ChenNorth Metro",
    ]);
    expect(within(rows[0]!).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "2",
      "3",
      `Due ${formatDate(jordan.oldestOverdueDueAt!)}`,
      "View overdue",
    ]);
    expect(within(rows[1]!).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["0", "1", "—", ""]);
    expect(screen.getByText("1 of 2 reps have overdue work.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/summary", expect.anything());
  });

  it("opens a rep's overdue tasks from their row", async () => {
    mockFetch(json({ reps: [jordan, alicia] }));
    const onSelectRep = vi.fn();

    render(<TeamSummary onSelectRep={onSelectRep} />);
    await userEvent.click(await screen.findByRole("button", { name: "View Jordan Pike's overdue tasks" }));

    expect(onSelectRep).toHaveBeenCalledWith("u-jordan");
  });

  it("says when everyone is caught up and offers no overdue links", async () => {
    mockFetch(json({ reps: [alicia] }));

    render(<TeamSummary onSelectRep={() => {}} />);

    expect(await screen.findByText("Everyone is caught up.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /overdue/ })).toBeNull();
  });

  it("shows an empty message when the manager has no reps", async () => {
    mockFetch(json({ reps: [] }));

    render(<TeamSummary onSelectRep={() => {}} />);

    expect(await screen.findByText("There are no reps on your teams yet.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows an error with a retry when the summary fails to load", async () => {
    mockFetch(json({ error: { code: "internal_error", message: "Something went wrong" } }, 500), json({ reps: [jordan] }));

    render(<TeamSummary onSelectRep={() => {}} />);

    expect((await screen.findByRole("alert")).textContent).toContain("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Jordan Pike")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
