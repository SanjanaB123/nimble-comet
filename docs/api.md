# HTTP API

The API listens on http://localhost:3001 by default. In development the web app
reaches it through the Vite proxy at http://localhost:5173/api.

All responses are JSON. Timestamps are UTC ISO-8601 strings.

## Authentication

Except for `/api/health` and `/api/demo-accounts`, every endpoint requires a
demo session token:

```http
Authorization: Bearer demo-dana
```

| Token | User | Role | Team |
| --- | --- | --- | --- |
| `demo-dana` | Dana Whitfield | manager | North Metro |
| `demo-luis` | Luis Ortega | manager | South Valley |
| `demo-priya` | Priya Raman | manager | Coastal |
| `demo-marcus` | Marcus Bell | rep | North Metro |
| `demo-kai` | Kai Nakamura | rep | Coastal |

A missing or unknown token returns `401`.

## Errors

Errors share one shape:

```json
{ "error": { "code": "forbidden", "message": "That rep is not on a team you manage" } }
```

| Status | `code` | When |
| --- | --- | --- |
| 400 | `invalid_request` | A query parameter or JSON request body is malformed |
| 401 | `unauthenticated` | The session token is missing or unknown |
| 403 | `forbidden` | The request asks for data outside the user's visibility |
| 404 | `not_found` | The route or resource does not exist or is not visible |
| 409 | `conflict` | The change conflicts with the resource's state |
| 500 | `internal_error` | Unexpected server error |

## Task object

```json
{
  "id": "task-1001",
  "title": "Call back about financing options",
  "customerName": "Hernandez residence",
  "status": "open",
  "dueAt": "2026-03-09T09:00:00.000Z",
  "completedAt": null,
  "isOverdue": true,
  "assignee": { "id": "u-marcus", "name": "Marcus Bell" },
  "team": { "id": "team-north", "name": "North Metro" }
}
```

`isOverdue` follows the rules in [domain.md](domain.md#overdue).

## Endpoints

### `GET /api/health`

Returns `{ "status": "ok" }`. No authentication.

### `GET /api/demo-accounts`

Lists the demo accounts the web app offers in its account switcher. No
authentication.

```json
{ "accounts": [{ "token": "demo-dana", "name": "Dana Whitfield", "role": "manager", "teamName": "North Metro" }] }
```

### `GET /api/me`

Describes the signed-in user and the teams they manage (managers) or belong to
(reps).

```json
{
  "user": { "id": "u-dana", "name": "Dana Whitfield", "role": "manager" },
  "teams": [{ "id": "team-north", "name": "North Metro" }]
}
```

### `GET /api/team/reps`

Managers only. Lists reps on the teams the signed-in manager leads, sorted by
name. Reps receive `403`.

```json
{ "reps": [{ "id": "u-alicia", "name": "Alicia Chen", "teamId": "team-north" }] }
```

### `GET /api/tasks`

Lists tasks visible to the signed-in user, ordered by due time (earliest first).

| Query parameter | Description |
| --- | --- |
| `status` | Optional. `open` or `completed`. Omit to include both. |
| `repId` | Optional. Only tasks assigned to this rep. Must be a rep the user can see; otherwise `403`. |

Response: `{ "tasks": [Task, ...] }`

### `GET /api/tasks/overdue`

Lists overdue tasks visible to the signed-in user, ordered by due time
(earliest first).

| Query parameter | Description |
| --- | --- |
| `repId` | Optional. Same rules as for `GET /api/tasks`. |

Response: `{ "tasks": [Task, ...] }`

### `GET /api/tasks/summary`

Managers only. Summarizes open work for every rep on the teams the signed-in
manager leads, including reps with nothing open. Reps receive `403`.

Counts use the same visibility and [overdue](domain.md#overdue) rules as the
task lists, so a rep's `overdueCount` always matches the length of
`GET /api/tasks/overdue?repId=<rep>`.

Reps are ordered most behind first: by `overdueCount` (highest first), then by
`oldestOverdueDueAt` (earliest first, reps with nothing overdue last), then by
name.

```json
{
  "reps": [
    {
      "rep": { "id": "u-jordan", "name": "Jordan Pike" },
      "team": { "id": "team-north", "name": "North Metro" },
      "openCount": 2,
      "overdueCount": 1,
      "oldestOverdueDueAt": "2026-03-07T12:00:00.000Z"
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `openCount` | Open tasks assigned to the rep, overdue ones included |
| `overdueCount` | Open tasks that are overdue |
| `oldestOverdueDueAt` | Due time of the rep's longest-overdue task; `null` when nothing is overdue |

### `POST /api/tasks/:taskId/complete`

Marks an open task as completed. The task must be visible to the signed-in
user; otherwise `404`. Completing a task that is already completed returns
`409`.

Response: `{ "task": Task }`
