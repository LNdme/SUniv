---
name: lab-notebook
description: Keep the project's shared record — decisions and why, results including negative ones, dead ends, parameters, and who did what. Use when the team decides something, gets a result, abandons an approach, or asks what was decided and when.
---

# lab-notebook — write it down once, use it three times

Research teams lose the same week twice. Someone tries an approach, it fails,
nobody records why, and four months later a teammate tries it again. Meanwhile
the paper gets written from memory, and the methods section is thinner than the
work deserved.

One record, kept as the work happens, serves three purposes at once: teammates
know, the paper writes itself from the trace, and the dated record supports a
patent filing. None of the three justifies the effort alone; together they do.

## What goes in the notebook

Write to the project's shared memory — the notebook belongs to the project scope,
so every member reads the same one.

- **Decisions, with the reason and the alternatives rejected.** The reason is the
  part that matters. A decision without its rationale gets re-litigated the first
  time someone new is unconvinced.
- **Results, including negative ones.** A failed approach is a finding. Record
  what was tried, under what conditions, and how it failed — that is what stops
  the repeat, and it belongs in the paper's discussion.
- **Dead ends, explicitly labelled as closed**, so nobody reopens them by accident.
- **Parameters and versions**: settings, data versions, commits, equipment. This
  is what makes the methods section reproducible six months later, when nobody
  remembers.
- **Open questions and who owns them.**

Write self-contained entries. "Switched to the 5 kHz sampling rate" means nothing
in November; "switched from 2 kHz to 5 kHz because aliasing appeared above 800 Hz
in the bench data" still does.

## Who did what

Record contribution as it happens, using the **CRediT** roles — conceptualisation,
methodology, software, validation, formal analysis, investigation, resources, data
curation, writing (original draft), writing (review and editing), visualisation,
supervision, project administration, funding acquisition.

Doing this continuously changes the authorship conversation from a negotiation
about memory and status into a reading of the record. That conversation damages
more research groups than any technical problem, and this is the cheapest
available defence against it.

## Reading it back

The notebook is as valuable read as written:

- "What did we decide about the calibration approach?" — with the date and reason;
- "Has anyone tried X?" — including the failures, which is the point;
- "What did we use for the sensor experiments?" — parameters, for the methods
  section;
- when drafting, `outline-and-draft` pulls the methods and results from here
  rather than from anyone's recollection.

Answer from the notebook, and say when it is silent. An invented recollection of
what a team decided is the same failure as an invented citation, with the same
consequence: they will act on it.

## Two honest limits

The notebook records what people tell it. It does not observe the lab, the
repository or the instruments, so it is only as complete as the team's habit of
writing to it. When it is thin, say so instead of presenting a partial record as
the full picture.

And it is **not a countersigned laboratory notebook**. It has no witness, no
tamper-evidence, and none of the evidentiary weight an institution's formal
notebook or a proper invention disclosure carries. It is a real, dated, useful
trace that helps a patent attorney reconstruct events — it does not replace the
record their process requires. Say this plainly the first time a team treats it
as proof.
