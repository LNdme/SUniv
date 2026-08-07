---
name: exercise-set
description: Build exercises anchored on real papers from the course collection, from a routine check up to a question the field has not answered, each with a marking scheme that separates what the paper establishes from what it assumes. Use when a teacher needs problem sets, lab work, a project brief or exam questions.
---

# exercise-set — exercises that reach the edge of the field

Textbook exercises rehearse a method on data chosen so the method works. That is
worth something early and worth very little afterwards, because it never shows a
student what the method is for or where it fails.

An exercise built on a real paper does. And a student who has once formulated a
question the literature has not settled knows something they cannot be told:
that the edge of the field is reachable from where they are sitting.

## Anchor on a paper, and read it

Take the session's sources from the course's Zotero collection, tagged
`for-the-exercise` by `course-design` if that pass was done.

**The anchor paper must be full text.** Check `custom.suniv.grounding`, and if it
is not `fulltext`, either find the open version or choose another paper.

```bash
suniv-search "<topic>" --limit 20 --from 2022        # arXiv, PMC and HAL versions
suniv-lib sections --file <the teacher's own PDF>    # the copy they already hold
```

This is not a formality. An exercise built on a guessed method is an exercise
with no correct answer, and the students who work hardest at it suffer most.
`citation-integrity` governs here, and here the stakes are a grade.

Read the method — `paper-deep-read` if the teacher wants it explained first —
and note the section each exercise will send students to.

## Four rungs, and every set should span them

1. **Check.** Apply the method to numbers from the paper. Answerable in ten
   minutes; the point is that the machinery works in their hands.
2. **Transfer.** The same method on a different case, where one thing is
   deliberately not as convenient. Most learning happens here.
3. **Critique.** Hand them the paper's own §-numbered method and ask what it
   assumes. Then: which conclusion changes if that assumption fails? This is the
   rung that turns a reader into a reviewer, and it is the one most sets omit.
4. **Open.** A question the paper leaves unanswered — the limitation the authors
   concede, the dataset they could not obtain, the condition they did not test.

Rung 4 is the one the teacher asked for, and it has one rule: **it must actually
be open.** Check with a recent search before setting it. Setting a solved problem
as open teaches students that the literature is not worth checking; and if a
student does solve it, that is a result, and they should be told so rather than
graded against a rubric.

Say for each exercise which rung it is and roughly how long it should take.
Students calibrate effort by that, and a rung-4 question mistaken for a rung-1
question produces a demoralised cohort.

## Write the marking scheme with the exercise

Never afterwards. A criterion that cannot be written is a question that cannot
be marked, and the fix is to change the question.

For rungs 1 and 2, the scheme is the reasoning steps, not the final number.
For rung 3, it is whether the assumption named is a real assumption of the
method and whether the consequence follows — a defensible wrong answer scores.
For rung 4, mark the formulation: is the question answerable, is the proposed
approach coherent, do they know what evidence would settle it. Not whether they
answered it.

## Say what students may not be able to reach

If the anchor paper is paywalled and the students have no institutional access,
the exercise fails for exactly the students least able to work around it. Say so
to the teacher and offer the open alternative. Where an open version exists,
give students that link rather than the publisher's.

## Hand back

The set, by rung, with the marking scheme, the section of the anchor paper each
question sends students to, and the full reference. Then, for the teacher alone:
what each exercise is actually testing, and which one you expect to go wrong.

Record the set in the course scope with what it was anchored on. Next year the
paper may have been superseded — `teaching-watch` will say so — and the exercise
should move with the field rather than fossilise.
