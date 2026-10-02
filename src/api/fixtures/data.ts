import type { Session, Task, Team, User } from "../repository/types";

export interface FixtureData {
  users: User[];
  teams: Team[];
  tasks: Task[];
  sessions: Session[];
}

const HOUR = 60 * 60 * 1000;

/**
 * Builds the demo data set. Due dates are expressed relative to `referenceTime`
 * so the local environment always has a realistic mix of past-due, upcoming,
 * and completed work no matter when the server is started.
 */
export function createFixtureData(referenceTime: Date = new Date()): FixtureData {
  const at = (hoursFromReference: number) =>
    new Date(referenceTime.getTime() + hoursFromReference * HOUR).toISOString();

  const users: User[] = [
    { id: "u-dana", name: "Dana Whitfield", email: "dana.whitfield@example.com", role: "manager", teamId: null },
    { id: "u-luis", name: "Luis Ortega", email: "luis.ortega@example.com", role: "manager", teamId: null },
    { id: "u-priya", name: "Priya Raman", email: "priya.raman@example.com", role: "manager", teamId: null },

    { id: "u-marcus", name: "Marcus Bell", email: "marcus.bell@example.com", role: "rep", teamId: "team-north" },
    { id: "u-alicia", name: "Alicia Chen", email: "alicia.chen@example.com", role: "rep", teamId: "team-north" },
    { id: "u-jordan", name: "Jordan Pike", email: "jordan.pike@example.com", role: "rep", teamId: "team-north" },

    { id: "u-sam", name: "Sam Okafor", email: "sam.okafor@example.com", role: "rep", teamId: "team-south" },
    { id: "u-rita", name: "Rita Alvarez", email: "rita.alvarez@example.com", role: "rep", teamId: "team-south" },

    { id: "u-kai", name: "Kai Nakamura", email: "kai.nakamura@example.com", role: "rep", teamId: "team-coastal" },
    { id: "u-erin", name: "Erin Doyle", email: "erin.doyle@example.com", role: "rep", teamId: "team-coastal" },
  ];

  const teams: Team[] = [
    { id: "team-north", name: "North Metro", managerId: "u-dana" },
    { id: "team-south", name: "South Valley", managerId: "u-luis" },
    { id: "team-coastal", name: "Coastal", managerId: "u-priya" },
  ];

  const task = (
    id: string,
    title: string,
    customerName: string,
    assigneeId: string,
    teamId: string,
    dueInHours: number,
    completedInHours: number | null = null,
  ): Task => ({
    id,
    title,
    customerName,
    assigneeId,
    teamId,
    status: completedInHours === null ? "open" : "completed",
    dueAt: at(dueInHours),
    completedAt: completedInHours === null ? null : at(completedInHours),
    createdAt: at(Math.min(dueInHours, completedInHours ?? dueInHours) - 72),
  });

  const tasks: Task[] = [
    // North Metro
    task("task-1001", "Call back about financing options", "Hernandez residence", "u-marcus", "team-north", -30),
    task("task-1002", "Send revised proposal", "Greenleaf Dental", "u-marcus", "team-north", -52, -60),
    task("task-1003", "Confirm install date", "Patel residence", "u-marcus", "team-north", 5),
    task("task-1004", "Collect signed utility authorization", "Brooks residence", "u-alicia", "team-north", -6),
    task("task-1005", "Schedule site survey", "Lakeside Storage", "u-alicia", "team-north", -20, -4),
    task("task-1006", "Follow up after consultation", "Nguyen residence", "u-alicia", "team-north", 28),
    task("task-1007", "Drop off permit paperwork", "Carter residence", "u-jordan", "team-north", -75),
    task("task-1008", "Answer battery backup questions", "Miller residence", "u-jordan", "team-north", 50),
    task("task-1009", "Share financing pre-approval", "Rosen residence", "u-jordan", "team-north", -12, -13),

    // South Valley
    task("task-2001", "Confirm roof inspection results", "Valley Community Church", "u-sam", "team-south", -9),
    task("task-2002", "Send warranty documentation", "Ortiz residence", "u-sam", "team-south", -40, -38),
    task("task-2003", "Review contract changes", "Delgado residence", "u-sam", "team-south", 20),
    task("task-2004", "Reschedule missed appointment", "Kim residence", "u-rita", "team-south", -26),
    task("task-2005", "Follow up on referral", "Foster residence", "u-rita", "team-south", 72),

    // Coastal
    task("task-3001", "Call about panel layout", "Harbor View Cafe", "u-kai", "team-coastal", -18),
    task("task-3002", "Send updated savings estimate", "Walsh residence", "u-kai", "team-coastal", -44, -45),
    task("task-3003", "Book final walkthrough", "Singh residence", "u-kai", "team-coastal", 10),
    task("task-3004", "Confirm HOA approval", "Dunes Townhomes", "u-erin", "team-coastal", -3),
    task("task-3005", "Follow up on signed agreement", "Price residence", "u-erin", "team-coastal", -64, -10),
  ];

  const sessions: Session[] = [
    { token: "demo-dana", userId: "u-dana" },
    { token: "demo-luis", userId: "u-luis" },
    { token: "demo-priya", userId: "u-priya" },
    { token: "demo-marcus", userId: "u-marcus" },
    { token: "demo-kai", userId: "u-kai" },
  ];

  return { users, teams, tasks, sessions };
}
