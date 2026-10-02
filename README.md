# Field Operations

## Getting started with the coding practical

Exercise version: **v1**

If you were sent a link to this repository for a coding practical, start here.

1. **Make your own private copy.** Click **Use this template** → **Create a
   new repository**, choose your own GitHub account, and set it to
   **Private**. If you cannot use the template, clone this repository and push
   it to a new private repository of your own. Please do not fork it or open
   issues or pull requests here.
2. **Set up before the clock starts.** Clone your copy, then follow
   [Running the app](#running-the-app) below: `npm ci`, `npm test`, and
   `npm run dev`. Make sure your AI tool can export or share its session, or
   start a screen recording.
3. **Read [BRIEF.md](BRIEF.md) in full.** It is the exercise.
4. **Time yourself.** You have **75 minutes**. Write down your start time when
   you begin and stop when 75 minutes have passed. Record both times in
   `SUBMISSION.md`. At 75 minutes, stop all coding, tests, notes, and commits.
5. **Submit, in your private repository:** your code commits and a
   `SUBMISSION.md` (template in the brief) with your ranked list of
   opportunities, committed before the clock stops. Then push.
6. **Answer the post-exercise reflection.** After the clock stops, answer the
   short reflection questions in your invitation email. The reflection is
   required and is part of our evaluation, but it is outside the 75 minutes.
   Do not change your repository while you answer.
7. **Return it.**
   - Add the reviewer GitHub account named in your invitation email as a
     collaborator on your private repository (read access is enough).
   - Reply to the invitation email with your repository URL, the final commit
     SHA, your complete AI work log (export file or share link), the exercise
     version above, and your reflection answers. The log is required and is
     part of what we evaluate. Put the reflection answers in the email, not in
     the repository.

## About the app

Field Operations helps field sales managers keep their teams' customer
follow-ups on track. Reps own follow-up tasks (call a customer back, send a
revised proposal, confirm an install date), and managers review their team's
open work and what has slipped past its due time. Most managers open the app
before their weekly team check-in to see who is falling behind.

The project is a single TypeScript package containing:

- a React + Vite web app in `src/web`;
- an Express API in `src/api`, backed by in-memory fixture data; and
- API response types shared by both in `src/shared`.

No database, cloud account, or external service is required.

## Requirements

- Node.js 22 (22.12 or later), Node.js 24, or Node.js 26 and newer. Odd-numbered
  releases such as 23 and 25 are not supported by the test tooling. `nvm use`
  picks up the version in `.nvmrc`.
- npm 10 or newer. pnpm 9 or newer also works if you prefer it.

## Running the app

```sh
npm ci          # or: pnpm install
npm run dev     # or: pnpm dev
```

Recent npm and pnpm versions may report that an install script for `esbuild`
was skipped. That is expected; the project runs without it.

`dev` starts both processes:

| Process | URL | Notes |
| --- | --- | --- |
| Web app | http://localhost:5173 | Vite dev server; proxies `/api` to the API |
| API | http://localhost:3001 | Restarts automatically when API files change |

Open http://localhost:5173. Use the **Signed in as** menu in the header to
switch between the demo accounts (three managers and two reps). The choice is
remembered in local storage.

Fixture data is regenerated each time the API starts, with due times relative
to the start time, so there is always a mix of past-due, upcoming, and
completed work. Changes such as completing a task are kept in memory and reset
when the API restarts.

## Scripts

Every script works with `npm run <script>` or `pnpm <script>`.

| Script | Description |
| --- | --- |
| `dev` | Start the API and web app together |
| `dev:api` | Start only the API (watch mode) |
| `dev:web` | Start only the web app |
| `start:api` | Start the API without watch mode |
| `test` | Run the test suite once |
| `test:watch` | Run tests in watch mode |
| `lint` | Lint the source with ESLint |
| `typecheck` | Type-check the whole project |
| `build` | Type-check and build the web app into `dist/` |

Set `PORT` to change the API port. If you do, point the web dev server at it
with `API_URL`, for example `PORT=4000 API_URL=http://localhost:4000 npm run dev`.

## Project layout

```text
src/
├── api/
│   ├── server.ts          process entry point
│   ├── app.ts             wires repositories, services, and routes
│   ├── http/              Express routes, query parsing, error responses
│   ├── auth/              session lookup and the per-request user context
│   ├── domain/            services and business rules
│   ├── repository/        repository interfaces and fixture-backed implementations
│   └── fixtures/          demo users, teams, sessions, and tasks
├── shared/                API response types used by the API and the web app
└── web/
    ├── main.tsx, App.tsx  application shell, account switcher, views and filters
    ├── api/               fetch client for the API
    ├── hooks/             data-loading hook
    └── components/        task list, table, and filter components
docs/
├── domain.md              concepts and business rules
└── api.md                 HTTP API reference
```

Requests flow in one direction on the server:
route → authenticated request context → service → repository.

## Testing

Tests use [Vitest](https://vitest.dev). API tests call the Express app in
process with Supertest, and component tests render with Testing Library in
jsdom. Test files sit next to the code they cover (`*.test.ts`, `*.test.tsx`).

```sh
npm test
```

## Further reading

- [BRIEF.md](BRIEF.md) — the coding practical: the exercise and how to submit
- [docs/domain.md](docs/domain.md) — users, teams, tasks, visibility, and overdue rules
- [docs/api.md](docs/api.md) — endpoints, parameters, and error format
