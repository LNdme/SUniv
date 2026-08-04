---
name: thesis-progress
description: Hold the state of a long piece of work across months — what is done, what is next, what is slipping — and run a standing watch for new literature on the student's topic. Use when the student asks where they are, what to do next, wants a schedule, or asks to be kept up to date on their field.
---

# thesis-progress — the part that spans months, not sessions

A dissertation runs for a year; a conversation runs for an hour. What makes an
agent worth having here is that it remembers between the two.

## What to keep in memory

Write these down as they are established, not at the end:

- the research question and its scope conditions, as currently worded;
- the supervisor, their expectations, and the date of the next meeting;
- deadlines: submission, ethics, conference, defence;
- the required citation style and document template;
- the section-by-section state: drafted, revised, approved, untouched;
- what has been read and what is queued;
- decisions already taken, and why — a student who re-opens a settled question
  in month seven loses a week;
- what is blocked, and on whom.

The wording of the question changes over a dissertation. Keep the current
version and note when it moved; the drift itself is often what the supervisor
needs to see.

## Reporting where they are

Lead with the honest state, not with encouragement. A student who is behind
needs to know now, while it is still recoverable.

- what has moved since last time;
- what is next, as a concrete action with a date;
- what is at risk, and what it would take to save it;
- what needs the supervisor's decision.

When they are behind, say what to cut. Scope is nearly always the variable —
narrowing the question, dropping a study, moving a chapter to future work.
Working faster is not a plan.

## The standing watch

Set a cron so new literature arrives without being asked. Weekly is right for
most fields; a fast-moving one may want more.

```bash
suniv-search "<question terms>" --from <current year> --sort year --limit 15
```

Report only what is genuinely new since last time and genuinely bears on the
question — a digest that is mostly noise gets ignored within a month, and then
the watch is worthless. For each item worth surfacing: why it matters to *this*
dissertation. A paper that threatens the gap claim is urgent and should be said
so; a paper that merely shares vocabulary is not.

File what survives:

```bash
suniv-search "<terms>" --from <year> --csl > /tmp/watch.json
suniv-zotero add --file /tmp/watch.json --collection "<topic>" --tag "watch-<date>"
```

## Before a supervision meeting

Offer to prepare it: what changed, what the student needs decided, the specific
questions to ask, and anything the supervisor asked for last time. A prepared
meeting is worth several unprepared ones, and this is where the agent earns its
place.

## When the pressure shows

Deadlines and dissertations produce real distress. Be direct and practical about
what can still be done, and do not manufacture reassurance — a student who is
two weeks from submission with no results chapter is helped by a plan to cut
scope, not by encouragement. Their supervisor and their institution's support
services exist for what sits outside the work itself.
