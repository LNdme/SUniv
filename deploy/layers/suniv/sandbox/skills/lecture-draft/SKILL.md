---
name: lecture-draft
description: Write one teaching session — the thread, the worked examples, the board work and the handout — from the course progression and its sources, and export it in the format the teacher actually presents from. Use when a teacher is preparing next week's class or rewriting one that did not land.
---

# lecture-draft — one session, written to be taught

A lecture is not a document read aloud. It is a sequence of moments in which a
room either follows or stops following, and the draft has to be built for that
rather than for completeness.

## Start from the session, not from the topic

Read the course scope: the progression `course-design` recorded, the session's
one capability, its named obstacle, the level of the cohort, and what happened
when this session ran last year. If any of that is missing, ask for the one
piece that matters — usually the level — rather than the whole list.

## Build a thread

Order the session so each step is answerable with what came before:

1. **The question it opens with.** Not the definition — the problem the
   definition exists to solve. A student who does not know what problem is being
   solved memorises rather than understands.
2. **The simplest case that shows the idea**, worked all the way through.
3. **The general form**, arrived at from the simple case rather than announced
   before it.
4. **Where it breaks** — the assumption that, removed, changes the answer. This
   is the part most lectures omit and most exams test.
5. **What is still open**, from the recent literature in the course collection.

Around step 3, plan for the obstacle the progression named. It is the point the
room stops following, and it needs a second explanation ready — a different
representation, not the same words more slowly.

## Say what the teacher does, not only what is true

For each step, write both the content and the delivery:

- what goes **on the board**, and in what order it is written;
- the **question put to the room**, and what a wrong answer would reveal;
- the **worked example**, with numbers that come out cleanly, because a session
  derailed by arithmetic teaches nothing about the method;
- a **timing estimate**, honest rather than optimistic. Sessions run long, and
  the material that gets cut is always the last item — so put nothing essential
  there.

## Cite what the session claims

Every substantive claim traces to a source in the course's Zotero collection.
When the session describes a study's method, `custom.suniv.grounding` decides
what may be said: the section for full text, the abstract's own words when
that is all there is, and the reference alone when there is no text. A lecture
hall is the worst place for an invented methodology — nobody in the room is
positioned to catch it, and it will be repeated in eighty exam papers.

Where the source is readable by students, say so in the handout. A cited paper
students can actually open is an invitation; one behind a paywall is a wall.

## Export where the teacher already works

```bash
suniv-doc convert --input session.md --output session.docx --bib course.json
suniv-doc convert --input session.md --output slides.tex --bib course.json
```

Markdown holds the draft, with maths in TeX notation. `.docx` for a handout —
add `--reference-doc` when the institution imposes a template. Beamer via
`.tex` for slides. `suniv-doc check` first, and if a binary is missing say which
rather than promising an export that will not arrive.

Keep the handout and the slides distinct. A handout carries what a student
rereads a month later; slides carry what supports speech. Producing one from the
other gives a bad version of both.

## Record what happened

After the session, record in the course scope what ran long, what the room did
not follow, and which question worked. That note is what makes next year's
version better rather than merely the same. It is a small habit with a large
compounding return, and it is the reason the course lives in a durable scope.
