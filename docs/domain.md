# Domain

## People and teams

**Reps** are field salespeople. Each rep belongs to exactly one team.

**Managers** lead teams. A team has one manager, recorded on the team as
`managerId`. A manager may lead more than one team; in the demo data each
manager leads one.

| Team | Manager | Reps |
| --- | --- | --- |
| North Metro | Dana Whitfield | Marcus Bell, Alicia Chen, Jordan Pike |
| South Valley | Luis Ortega | Sam Okafor, Rita Alvarez |
| Coastal | Priya Raman | Kai Nakamura, Erin Doyle |

## Follow-up tasks

A task is a follow-up a rep owes a customer.

| Field | Meaning |
| --- | --- |
| `assigneeId` | The rep who owns the task |
| `teamId` | The team the task belongs to (the assignee's team) |
| `dueAt` | When the follow-up is due, as a UTC ISO-8601 timestamp |
| `status` | `open` or `completed` |
| `completedAt` | When the task was completed; `null` while open |

Completing a task sets `status` to `completed` and records `completedAt`.
Completed tasks cannot be completed again. There is no way to reopen a task.

## Overdue

A task is **overdue** when it is still open and its due time is earlier than
the current time. Completed tasks are never overdue, no matter when they were
completed. A task due at exactly the current time is not overdue yet.

Overdue status is calculated by the API when a response is produced, and each
task in a response carries an `isOverdue` flag. The web app displays that flag
rather than recalculating it.

## Signing in

The app does not implement real authentication. Each demo account has a fixed
session token, and the web app sends the selected account's token as a bearer
token on every API request. The API resolves the token to a user and builds a
request context holding the user and what they are allowed to see.

## Visibility

What a signed-in user can see is decided by the API from their request
context, never from values the client sends:

- **Managers** see tasks on the teams they manage.
- **Reps** see only tasks assigned to them.

Filters such as `repId` narrow results within that visible set. They never
widen it: a manager who asks for a rep outside their teams gets `403
Forbidden`, as does a rep who asks for anyone else's tasks. Tasks outside a
user's visibility are reported as not found when they try to act on them.

## Web app views

- **Tasks** lists the visible tasks, filtered by status (open by default) and,
  for managers, by rep.
- **Overdue** lists visible overdue tasks, optionally filtered by rep.

Each view shows a loading message while it fetches, the tasks when some are
returned, an empty message when the request succeeds with no tasks, and an
error message with a retry button when the request fails.
