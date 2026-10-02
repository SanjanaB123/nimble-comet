# Coding practical brief

Exercise version: **v1**

Thank you for taking the time to do this exercise. Please read this whole page
before you start the clock.

## The exercise at a glance

- **Timebox:** 75 minutes, hard stop. This includes exploring, changes,
  verification, and your written notes.
- **Post-exercise reflection:** after the clock stops, you answer a few short
  questions about the exercise itself. The questions are in your invitation
  email. The reflection is required and is part of our evaluation. It is
  outside the 75 minutes. See
  [After the clock: post-exercise reflection](#after-the-clock-post-exercise-reflection).
- **Tools:** use the AI coding tools, editors, and accounts you normally work
  with. We expect you to use AI coding tools, as much as you want.
- **Your complete AI work log is required, and we evaluate it.** How you
  direct, question, and check your AI tools is a central part of what we look
  at. See [Your AI work log](#3-your-ai-work-log).
- **No one is available to answer questions during the timebox.** When
  something is unclear, make a reasonable assumption, write it down, and keep
  going.

## Before you start the clock

You may do this before your 75 minutes begin:

1. Make your own **private** copy of this repository: **Use this template** →
   **Create a new repository** in your own account, set to Private. If you
   cannot use the template, clone it and push to a new private repository of
   your own. Please do not fork it.
2. Clone your copy and follow [Running the app](README.md#running-the-app) to
   install dependencies, then confirm that `npm test` passes and `npm run dev`
   opens the app.
3. Make sure your AI tool can export or share its session, or start a screen
   recording (see [Your AI work log](#3-your-ai-work-log)).

If setup itself fails, stop and tell your recruiting contact rather than
spending your timebox on it.

When you are ready, note the time. That is your start time.

## Background

Field Operations is a small internal app that field sales managers use to keep
their teams' customer follow-ups on track. It has been in use for about six
months. The [README](README.md) explains how to run it and how the code is
organized. [docs/domain.md](docs/domain.md) describes the product's rules and
[docs/api.md](docs/api.md) describes its HTTP API.

## What we are asking you to do

You now own this application. Spend up to 75 minutes improving it in whatever
way you believe creates the most value for its users and for the engineers who
will maintain it.

You may use AI coding tools as much as you want. We expect you to.

You will submit your code, a short explanation of your decisions, and your
complete AI work log. We care not only about what you built, but how you
identified the opportunity, prioritized your work, directed your AI tools,
verified the result, and decided what not to do.

There is more worthwhile work in this application than anyone could finish in
75 minutes. Choosing is part of the exercise.

## When the timebox ends

When your 75 minutes are up, stop everything: code, tests, notes, and commits,
even if you are in the middle of something. Unfinished work stays unfinished.

Plan to leave about 10 minutes before the end to write your notes, describe
anything unfinished, and commit. After the timebox ends, the only things left
to do are:

1. push the commits you already made;
2. answer the [post-exercise reflection](#after-the-clock-post-exercise-reflection);
   and
3. [return your submission](#4-return-it).

## After the clock: post-exercise reflection

Once your 75 minutes are over and your commits are pushed, answer the
reflection questions in your invitation email. This reflection is **required
and is part of our evaluation**. It is not part of the 75-minute timebox: it is untimed, but
short. Plan on about 15 to 20 minutes; a few direct sentences per question is
enough.

**Do not change your repository while you answer.** No new code, tests,
notes, or commits. You may look back at your code and your AI work log.

Put your answers in your reply to the invitation email (see
[Return it](#4-return-it)), not in the repository.

## Submitting your work

### 1. Your code

Commit your work to your **private** copy of this repository, in whatever way
reflects how you worked. Keep your commits on a single branch; `main` is fine.
Push them before you return your submission.

Keep the repository and the reviewer's access in place until your recruiting
contact confirms that the review is complete. After that you are welcome to
delete it.

If you cannot use a private GitHub repository, send a patch instead, for
example the output of `git format-patch` from the commit you started on, or
`git diff` against it.

### 2. Your notes

Add a file named `SUBMISSION.md` at the root of the repository, committed with
your code, using this outline. Short, direct answers are best.

```markdown
# Submission

Start time: <when you started the clock>
End time: <when you stopped>

## Opportunities, ranked
A short ranked list of the opportunities you noticed, most valuable first.
For each: one line on what it is, whether you worked on it, and why.

## What you changed
What you changed and why, in a few sentences or bullets.

## What you decided not to do
Things you noticed and deliberately left alone, and why.

## Verification
How you know your changes work and did not break existing behavior.

## Working with AI
How you directed your AI tools, and at least one suggestion you accepted,
changed, rejected, or verified carefully: what it was, what you did, and why.
```

### 3. Your AI work log

Your complete AI work log is a required part of the submission, and it is
evaluated: we read it closely. It shows how you explored, what you asked for,
how you questioned and checked what came back, and where you changed
direction. Your code and notes alone cannot show us that.

- Best: your tool's native session export or share link (for example, Claude
  Code's `/export`, a Codex session file, or a shared chat link), covering the
  whole timebox. If you used more than one tool or session, send each one.
- If your tool cannot export: a screen recording of the timebox, or another
  complete transcript.
- A summary written after the fact is not a substitute for the log.

Send the log separately (as an attachment or a share link) rather than
committing it to the repository. Review it before you send it and remove
anything you would not want to share, such as credentials or personal
information.

### 4. Return it

1. Add the reviewer GitHub account named in your invitation email as a
   collaborator on your private repository. Read access is enough.
2. Reply to the invitation email with:
   - the HTTPS URL of your repository, for example
     `https://github.com/<your-username>/<repository>`;
   - the branch and the final commit SHA you want reviewed;
   - your AI work log files or links;
   - the exercise version at the top of this brief; and
   - your answers to the
     [post-exercise reflection](#after-the-clock-post-exercise-reflection).

If you are sending a patch instead, attach it and mention the commit of this
repository it applies to.

## What happens next

We will read your changes, notes, AI work log, and reflection answers, run
the project along with some checks of our own, and then talk through your work
with you in a follow-up conversation. Expect to be asked why you chose what
you did, what you considered and left alone, how you directed and checked your
AI tools, and how you verified your work. We will also ask you to expand on
your reflection answers.
