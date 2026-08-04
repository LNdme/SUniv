---
name: paper-deep-read
description: Explain one difficult paper at the student's level — its objective, its method step by step, its mathematics, its hidden assumptions and what is reproducible. Use when the student asks what a paper did, how a method works, why it is hard, or says they do not understand an article.
---

# paper-deep-read — make one hard paper genuinely understood

The student is not asking for a summary. They are asking to be brought to the
point where they could explain the paper to their supervisor, or build on it.
Those are different outputs, and only one of them is worth their time.

## Get the text first

You cannot deep-read a paper you have not read. Check grounding before starting:

```bash
suniv-search --doi <doi>                      # is there an open-access copy?
suniv-lib search "<title words>"              # does the student already hold it?
suniv-lib sections --file <path>              # the structure, with page numbers
suniv-lib text --file <path> --page 4         # one page at a time
```

If only the abstract exists, say so and offer what an abstract can support: the
question, the claimed contribution, the venue. Do not walk through a method you
have not seen. If nothing but metadata exists, this skill does not apply yet —
help the student obtain the text.

## Calibrate to the person

Ask what they already have, or infer it from how they asked. A first-year
master's student meeting variational inference and a doctoral student who knows
it but not this variant need different explanations, and giving the wrong one
wastes the session. When unsure, start one level below where you think they are
and move fast — being briefly over-explained costs seconds, being lost costs the
afternoon.

## The order that works

1. **The problem, before the solution.** What was broken or unknown, and why did
   existing approaches not settle it? A method makes no sense until the student
   feels the difficulty it answers.
2. **The idea in one sentence,** in plain language, no notation.
3. **The method, step by step.** What goes in, what happens to it, what comes
   out. Name each step's purpose before its mechanics.
4. **The mathematics, once the shape is clear.** Define every symbol on first
   use. Say what each equation _does_ — this term penalises that, this
   expectation is over that distribution. An equation restated in words is not
   an explanation; an equation whose role is explained is.
5. **The evaluation.** What is compared to what, on which data, and does the
   comparison actually support the claim? This is where papers are weakest and
   where a student learns to read critically.
6. **Assumptions and limits.** What must be true for this to work? What do the
   authors concede, and what do they pass over quietly? Distinguish the two —
   only the first is on the record.
7. **Reproducibility.** Is there code, data, hyperparameters, compute? What
   would the student need to run it themselves?

## Attribute everything

Every claim about the paper points to where it is: a section heading, a page, an
equation number. "§3.2 defines attention as…" lets the student check you and
find it again. "The paper says…" does not, and is where a misreading becomes
theirs.

When you are inferring rather than reporting — reading between the lines,
connecting to something the paper does not say — mark it as your reading. That
distinction is the difference between teaching and misleading.

## Close usefully

- what the student should now be able to do that they could not before;
- the two or three papers this one rests on, if they need the foundation —
  retrieve them with `suniv-search`, do not name them from memory;
- the honest verdict on quality: what this paper establishes, and what it only
  suggests.

Then offer to file the notes into Zotero against the item, so the reading
survives the conversation.
