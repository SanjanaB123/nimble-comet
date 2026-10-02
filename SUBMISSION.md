# Submission

Start time: TODO
End time: TODO

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
   **Not done**: a refactor; regression tests now cover the drift instead.
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

## What you decided not to do

- **Shared visibility function for reads and writes:** the right long-term fix for bug #1, but a
  larger refactor than the timebox allowed. Regression tests now pin both paths.
- **ESLint:** adding it means new dependencies, config, and fixing whatever it reports, which is
  unrelated to user value. The README row is still inaccurate.
- **Loading flicker, live overdue refresh:** both match the documented behaviour; listed above as follow-ups.
- **Team summary extras:** completion trends, per-team subtotals, making Team the default tab
  (managers have used Tasks as the landing view for six months).
- **Unused CSS** (`.task-summary`, `.badge-warning`): left alone, unrelated to the changes.

**Assumption:** where code and `docs/` disagreed, I treated the docs as the intended behaviour.

## Verification

- **Reproduce first:** every fix started as a failing test (service, HTTP via Supertest, or
  component), written before the fix.
- **Revert check:** after each fix I temporarily restored the old code and confirmed the new tests
  failed again, so they actually guard the bug.
- **Suite:** 17 tests at the start, 65 now; `npm test`, `npm run typecheck`, and `npm run build`
  all pass on Node 22.17.1 (`.nvmrc`).
- **Manual checks:** `curl` against the running API for every status code above, and the browser:
  - Overdue filter shows only the selected rep's tasks.
  - A task completed in another session refreshes instead of looking open.
  - The Team tab counts, ordering, click-through, and update after completing a task.
  - Reps don't see the Team tab.
- **Existing behaviour:** the original tests pass unchanged; guard tests check that every real
  endpoint still returns `401` without a token, and that reps can still complete their own tasks.

## Working with AI

<!-- DRAFT NOTES: rewrite this section in your own words; reviewers read it as your account. -->

- TODO: how you directed the work. For example: asked for a read of the docs first, then a
  docs-vs-code comparison, and for every fix: reproduce as failing tests → plan → approve → implement.
- TODO: suggestions you **rejected or changed**:
  - Claude created a feature branch with a long commit message; you stopped it and committed to
    `main` with short messages, as the brief allows.
  - You parked the lint fix.
- TODO: a claim you **corrected**: Claude said you were on Node 25 (that was its own shell); you
  showed you were on 22.17.1.
- TODO: what you **verified yourself** rather than trusting: you re-ran the tests and the `curl`
  checks and tested the Overdue filter in the browser before pushing.
- TODO (optional): **an AI mistake during verification**: Claude clicked by screen position in the
  browser and accidentally completed a task. Claude noticed, reported it, reset the in-memory data,
  and switched to clicking by element reference.
