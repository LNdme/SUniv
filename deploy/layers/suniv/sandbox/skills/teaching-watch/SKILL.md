---
name: teaching-watch
description: Report what moved in a course's field since the last session, and only what moved — the result that dates a slide, the paper worth a mention, the exercise whose open question just closed. Use as a recurring watch on a course scope, or before preparing a session.
---

# teaching-watch — what changed since you last taught this

A course goes stale invisibly. Nothing announces that a result has been
superseded; the slide keeps working, the students keep writing it down, and the
teacher finds out from a question they cannot answer.

This is the watch that prevents that, and it is also how a teacher keeps
learning without setting aside time to. The two are the same activity.

## Set it on the course scope

One cron per course, on that course's scope, so each course's watch reads its
own progression and its own collection. Weekly during term suits most; monthly
out of term is enough.

## What to search, and what to compare against

Read from the course scope: the progression, the sources filed per session, and
the date of the last report.

```bash
suniv-search "<session topic>" --limit 15 --from <last report year>
```

One search per session topic, bounded to what is new. Then compare against what
the course already holds rather than reporting the field at large — the teacher
already knows their field, and a digest that tells them what they know is a
digest they stop opening.

Read `diagnostics`. A skipped source is a missing key, not a quiet field.

## Report four things, and nothing else

- **A result that dates something taught.** The highest-value line and the
  rarest. Name the session, what it currently claims, and what the new work
  says. Do not soften it: a superseded slide is worth an interruption.
- **A paper worth mentioning in class.** Recent, on topic, and — say this
  explicitly — whether students can actually read it. A paywalled paper is a
  mention; an open one is an assignment.
- **An open question that closed.** `exercise-set` rung 4 depends on this. An
  exercise set as open that has since been answered stops being an invitation
  and becomes a trap, and the teacher must know before the term does.
- **A methodological shift** — a benchmark the field has moved to, a practice it
  has abandoned. This is what makes a graduate employable and what a course
  written from a textbook never carries.

## The rule that decides whether this survives

**Report only what changed.** Nothing else. A watch padded with restated context
is skimmed the first week, skipped the second, and filtered by the third — and a
filtered watch is worse than none, because the teacher believes they are current.

If nothing moved, say so in one line. In a slow-moving subject that is the
normal answer, and it is true information.

Never inflate a paper's significance to justify the report. Three quiet weeks
and one that matters is the correct shape of a watch on a real field.

## What may be said about each paper

The grounding ladder applies here as everywhere: full text lets you say what the
work does, an abstract lets you say what it claims, and metadata lets you say it
exists. A watch is read quickly and acted on quickly — a guessed method here
ends up on a slide within the week.

## Keep the course's record current

When a report is acted on — a slide changed, a source added, an exercise
retired — record it in the course scope against the session. That record is what
makes the following year's preparation start from a course that is current
rather than from one that is merely familiar.
