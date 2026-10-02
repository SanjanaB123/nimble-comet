# Submission

Start time: 3:28 PM
End time: 4:43 PM

## Opportunities, ranked

1. **Visibility rules broken (security).** Reps could complete teammates' tasks, and the Overdue
   view ignored the rep filter, so `403` was never returned there. **Done**: the app broke its own
   documented access rules, and the Overdue filter is what managers rely on.
2. **No "who is falling behind" view.** The README says that's why managers open the app, but they
   had to check reps one at a time. **Done**: new manager-only Team tab with per-rep overdue/open counts.
3. **Stale task list after a failed "Mark complete".** A task completed elsewhere still looked open,
   and the error message lingered across filters. **Done**: small fix, visible to every user.
4. **HTTP errors not matching the API docs.** Unknown routes returned `401`, malformed JSON `500`,
   and non-`/api` paths returned HTML. **Done**: cheap to fix, makes the API predictable for clients.
5. **Rep filter silently disappears if the rep list fails to load.** **Done**: now shows an error with retry.
6. **One shared visibility check for reads and writes.** Bug #1 came from the two drifting apart.
   **Done**: removes the root cause of bug #1, not just the symptom.
7. **README lists an `npm run lint` script that doesn't exist** (no ESLint installed). **Not done**: see below.
8. **Whole table flashes "Loading tasks…" on every reload.** **Not done**: matches the documented
   behaviour; fixing it means changing the shared `useAsync` hook for every view.
9. **Overdue badges go stale while the page stays open** (no refresh). **Not done**: by design per
   `docs/domain.md`, and fine for "open it before the check-in".
10. **Minor API nits:** lowercase `bearer` is rejected; `/api/demo-accounts` shows only a manager's
    first team. **Not done**: negligible impact, demo-only.

## What you changed

- **Fixed rep visibility** (`f7bc212`): the overdue query now accepts `repId`, so the filter works
  and returns `403` outside your visibility. A rep can only complete tasks assigned to them; anything
  else returns `404`.
- **Aligned HTTP errors with `docs/api.md`** (`bd9d5f4`): auth is attached per route so unknown routes
  return `404`; malformed JSON returns `400 invalid_request`; every unmatched path returns a JSON `404`.
- **Task list after a failed completion** (`406d1a9`): always reloads after a completion attempt;
  the error stays visible next to the refreshed list and clears when filters change.
- **Team summary** (`4091eeb`): `GET /api/tasks/summary` (managers only) returns each rep's
  open/overdue counts and oldest overdue due date, most behind first. It reuses the existing query
  engine and `isOverdue`, so its counts can't disagree with the lists. New **Team** tab with a
  **View overdue** button that opens the Overdue view filtered to that rep. Tasks stays the default
  tab. Documented in `docs/api.md` and `docs/domain.md`.
- **Rep list load failure** (`4091eeb`): managers see an error with **Try again** instead
  of a missing filter.
- **One visibility rule** (`7ddd2a6`): `scopeQuery()` is now the only definition of which tasks
  a user can see. Listing, the summary, and completing a task all use it, and the unscoped
  `findTaskById` lookup is gone, so a write path can't skip it. A new test checks every demo user
  against every task: completing must succeed exactly when the task is in that user's list.

## What you decided not to do

- **ESLint:** adding it means new dependencies, config, and fixing whatever it reports, which is
  unrelated to user value. The README row is still inaccurate.
- **Loading flicker, live overdue refresh:** both match the documented behaviour; listed above as follow-ups.
- **Team summary extras:** completion trends, per-team subtotals, making Team the default tab
  (managers have used Tasks as the landing view for six months).
- **Unused CSS** (`.task-summary`, `.badge-warning`): checked whether they hinted at planned work
  (a count strip, a "due soon" badge). Nothing in the code, docs, or history uses them, and a
  "due soon" state would invent a rule `docs/domain.md` doesn't define. Left alone.
- **Demo sign-ins for only 2 of 7 reps:** I questioned whether reps should sign in at all, since
  managers are the main users. The README, `docs/api.md`, and `docs/domain.md` all specify this
  exact demo set (three managers, two reps) and give reps their own visibility rules, so it
  matches the requirements. Left as is.

**Assumption:** where code and `docs/` disagreed, I treated the docs as the intended behaviour.

## Verification

- **Reproduce first:** every fix started as a failing test (service, HTTP via Supertest, or
  component), written before the fix.
- **Revert check:** after each fix I temporarily restored the old code and confirmed the new tests
  failed again, so they actually guard the bug.
- **Suite:** 17 tests at the start, 68 now; `npm test`, `npm run typecheck`, and `npm run build`
  all pass on Node 22.17.1 (`.nvmrc`).
- **Manual checks:** `curl` against the running API for every status code above, and the browser:
  - Overdue filter shows only the selected rep's tasks.
  - A task completed in another session refreshes instead of looking open.
  - The Team tab counts, ordering, click-through, and update after completing a task.
  - Reps don't see the Team tab.
- **Existing behaviour:** the original tests pass unchanged; guard tests check that every real
  endpoint still returns `401` without a token, and that reps can still complete their own tasks.

## Working with AI

I used Claude Code for the whole timebox.

- **How I directed it:**
  - I started by having it read the README and docs and explain the data flow, before touching code.
  - I then asked it to compare the documented rules against `src/api` and `src/web` and list every
    inconsistency.
  - For each fix I used the same loop: reproduce the problem as failing tests, get an implementation
    plan, review it and approve, then implement.
  - I chose the order: the two security bugs first, then the HTTP errors, then the web app bugs,
    then the Team feature, then the refactor.
- **Accepted:** its recommendations on the Team feature: compute the counts on the server rather
  than in the browser, use `/api/tasks/summary`, and keep Tasks as the default tab. I asked it to
  add test coverage at every level.
- **Rejected or changed:**
  - It created a feature branch with a long commit message. I stopped that and had it commit to
    `main` with short messages, which the brief allows.
  - I parked the ESLint fix twice to keep the time on user-facing work.
- **Questioned instead of accepting:**
  - It labelled three web issues "minor". I had it test all three before deciding. Two turned out
    to be documented behaviour (left alone); one was a real silent failure (fixed).
  - I noticed only 2 of 7 reps can sign in and asked whether reps should sign in at all. I had it
    check the docs first; they specify that exact demo set, so nothing changed.
  - I asked whether the unused CSS hinted at planned work. It found no supporting rule or reference,
    so I left it.
- **Corrected:** it said I was on Node 25. That was its own shell; my terminal showed Node 22.17.1
  from `.nvmrc`, and I re-ran the suite there.
- **Verified myself:** I ran `npm test` and `npm run typecheck`, ran every `curl` check against the
  running API, and tested the Overdue filter and the Team feature in the browser before pushing them.
  The final refactor relied on the automated tests, including a check that they fail on the old bug.
- **AI mistake during verification:** while checking the Team tab in the browser, it clicked by
  screen position and accidentally completed a task. It caught and reported this, restarted the
  API to reset the in-memory data, and switched to clicking by element reference.
