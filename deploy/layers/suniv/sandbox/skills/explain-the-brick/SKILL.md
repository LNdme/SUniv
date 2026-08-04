---
name: explain-the-brick
description: Explain the part of the project a teammate built, at the asker's level — the problem it solves, how it works, what it assumes, and what breaks if those assumptions fail. Use when someone asks how a colleague's component works, when onboarding a new member, or before touching code or a method someone else owns.
---

# explain-the-brick — understand your teammate's piece

The most expensive gap in a small research team is not knowledge of the field.
It is that each person understands their own piece and treats the others as
black boxes — until an interface breaks, someone leaves, or the paper has to
describe the whole system coherently.

This is `paper-deep-read` turned inward: the same method, applied to the team's
own work.

## Read the real thing first

Explain from the record, never from the name of the component:

```bash
suniv-lib search "<component terms>"      # internal notes and PDFs
```

plus the project's shared memory and `lab-notebook` — the decisions, the
parameters, the approaches already abandoned — and the code or the protocol
itself where it exists.

If the record is thin, say so and stop. A confident explanation of a teammate's
component, assembled from its name and plausible inference, is worse than no
explanation: the asker will build on it, and the error surfaces at the interface
weeks later. Point them at the person, and suggest what to record afterwards so
the next asker does not need them.

## The order that works

1. **The problem this piece solves**, and what would happen without it. A
   component makes no sense until its absence does.
2. **The idea in one sentence**, no jargon.
3. **The mechanism** — inputs, what happens, outputs. Name each step's purpose
   before its mechanics.
4. **The assumptions.** What must be true for this to work — about the data, the
   equipment, the range, the users? This is the section that prevents the
   integration bug, and the one nobody writes down.
5. **What breaks if they fail**, and how the failure would look. A teammate who
   knows the failure mode can recognise it in their own results.
6. **The interface** — what the rest of the system may rely on, and what is an
   internal detail liable to change.

## Calibrate to the asker

A new master's student joining the project and the co-founder who wrote the
adjacent module need different explanations of the same brick. Ask what they
already know, or infer it from how they asked, and pitch one level below your
guess — being briefly over-explained costs seconds, being lost costs the day.

When the piece rests on published work, use `suniv-search` to retrieve the paper
and `paper-deep-read` to go under it. `citation-integrity` applies here as
everywhere: a method named from memory is a method that may not exist.

## Mark what is yours

Separate what the record says from what you are inferring. "The notebook says the
filter was moved to 5 kHz because of aliasing" and "I would guess the decimation
stage assumes that" are different claims, and only the first is the team's.

Close with what the asker can now do, and with the one or two questions still
worth putting to the person who built it — those questions are the useful output
when the record is incomplete, and asking them is how the record improves.
