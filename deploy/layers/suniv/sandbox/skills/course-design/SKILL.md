---
name: course-design
description: Turn a syllabus into a session-by-session progression, each session backed by the literature it actually rests on and filed in the course's own Zotero collection. Use when a teacher is preparing a course, restructuring one, or asking how to sequence a subject.
---

# course-design — from a syllabus line to a defensible progression

A syllabus says what a course covers. It does not say in what order, on what
evidence, or where the students will get lost. That is the work, and it is
close to a literature review: the teacher is establishing what is known, how
firmly, and in what order it makes sense.

## One course, one scope

Set up each course as its own project scope before anything else. A teacher
with three lecture courses has three, and the separation is the point: the
memory, the Zotero collection, the notebook and the watch all belong to one
course, not to the teacher.

What belongs in the scope's memory, recorded as it is settled:

- the **institution, level and hours** — a 24-hour master's course and a
  lycée module are different objects, and every later judgement depends on it;
- the **prerequisites students actually have**, which is rarely what the
  official prerequisite says;
- the **assessment** — what the exam or project asks, because a progression
  that does not land there is a progression that fails its students;
- what happened **last year**: what ran long, what fell flat, what the cohort
  turned out not to know.

That last item is why this is worth doing in a durable scope rather than in a
document. A course is run again, and the second run should start from the first.

## Sequence, don't enumerate

Work from the syllabus to a session list, and for each session settle:

- the **one thing** a student should be able to do afterwards that they could
  not before. If it takes a paragraph, the session is doing two things;
- what it **depends on** — which earlier session, which prerequisite;
- the **obstacle**: the misconception, the notation, the leap that this
  particular topic reliably breaks on. Naming it is most of teaching it;
- the **evidence** it rests on.

Order by dependency, then check the whole for a shape a student could describe
in three sentences. A course a student cannot summarise is a list of topics.

## Ground each session in the literature

```bash
suniv-search "<topic>" --limit 20 --sort citations   # what the field is built on
suniv-search "<topic>" --limit 20 --from 2023        # what has moved since
```

Two searches per session, and they serve different purposes. The citation-sorted
one gives the foundational result to teach. The recent one is what lets the
teacher say "and this was still open as of last year" — which is what turns a
lecture into an invitation.

Read `diagnostics` rather than assuming a thin result is a thin literature.

File as you go, so the collection is the course's real bibliography:

```bash
suniv-search "<topic>" --limit 20 --csl > /tmp/session.json
suniv-zotero add --file /tmp/session.json --collection "<course> — <session>" --tag "foundational"
```

Tag by the role in teaching — `foundational`, `current`, `readable-by-students`,
`for-the-exercise` — not by topic. Topic is the collection. Role is what the
teacher needs when writing the session, and again when writing the exercises.

`readable-by-students` deserves its own judgement: a paper a teacher can read in
an evening may be unreadable for a second-year cohort, and assigning it teaches
them that research is impenetrable. Prefer open-access full text for anything
students are meant to open themselves.

## What may be claimed about a paper

`custom.suniv.grounding` governs this exactly as it governs a literature review,
and a course is where a mistake propagates furthest: a class of eighty carries
away whatever is asserted from the front of the room. Full text: describe the
method and cite the section. Abstract only: report what the abstract states,
marked as such. Metadata only: give the reference and say the text was not
available. `citation-integrity` applies without exception.

## Hand back

The progression, session by session, with for each: the one capability, the
obstacle, the two or three sources, and the reason it sits where it sits. Then,
separately, what the design assumes about the students — because that is the
assumption most likely to be wrong, and the teacher is the only one who can
check it.

Record the progression in the course scope. `lecture-draft` writes the sessions
from it, `exercise-set` builds on its sources, and `teaching-watch` reports
against it.
