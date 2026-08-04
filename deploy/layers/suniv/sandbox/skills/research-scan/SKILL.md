---
name: research-scan
description: Find, filter and file the literature on a question, and hand back a briefing on each paper rather than a list of titles. Use when the student asks what has been written on a topic, wants recent work in their field, needs sources for a section, or is starting a literature review.
---

# research-scan — from a question to a filed, briefed set of papers

A list of titles is not a result. The student needs to know, for each paper,
what the authors were trying to do and how they went about it — otherwise they
must open twenty PDFs to find the three that matter.

## Frame before searching

A vague question returns vague literature. Settle three things first, asking
only what you cannot infer:

- the **claim or question**, narrow enough to be answerable;
- the **field's vocabulary** — the terms this literature actually uses, which
  are often not the student's words. A first broad search reveals them: read the
  titles that come back and re-search with their language;
- the **boundaries** — years, venues, languages, and whether reviews count.

## Search

```bash
suniv-search "<terms>" --limit 25 --from 2020
suniv-search "<terms>" --limit 25 --sort citations   # the works the field is built on
suniv-search "<terms>" --limit 25 --sort year        # what is happening now
```

Two searches, one weighted to citations and one to recency, catch the two things
a student needs: the foundations they must cite, and the recent work that shows
their question is still open.

Read `diagnostics`. A source under `skipped` needs a key nobody supplied; one
under `failed` was reachable but errored. Neither means the literature is absent
— say which happened rather than presenting a thin result as a complete picture.

Add `suniv-indexed` when the student has Scopus or IEEE credentials and the
department expects an indexed source. Add `suniv-scholar` only if asked for by
name; it costs the student money and returns no DOIs.

## Filter, and say why

Cut to what answers the question. For each paper kept, say in one line why it
survived; for the notable ones cut, say why they did not. A student who cannot
see the filter cannot trust it, and cannot defend the review to a supervisor.

Watch for the trap in citation-sorted results: a hugely cited paper adjacent to
the topic is not more relevant than a modest paper on it.

## Brief each paper

For every kept paper, write:

- **Objective** — the question the authors set themselves;
- **Method** — design, data, and how the claim is evaluated;
- **Result** — what they found, in their terms;
- **Limits** — what the authors concede, and what they do not;
- **Why you** — the specific bearing on the student's question.

Everything here is governed by `custom.suniv.grounding`. Full text: read it and
cite sections. Abstract only: report what the abstract states, marked as such,
and stop. Metadata only: give the reference, say the text was not available, and
offer the routes to it — never fill the gap. `citation-integrity` has the detail;
it applies here without exception.

## File it, or it is lost

A scan that lives only in the conversation dies with the conversation.

```bash
suniv-search "<terms>" --limit 25 --csl > /tmp/scan.json
suniv-zotero add --file /tmp/scan.json --collection "<topic>" --tag "<subtopic>"
```

Tag by the role each paper plays in the argument — `method`, `baseline`,
`contradicts`, `to-read` — not by topic alone. Topic is already the collection;
role is what the student needs when writing the section six weeks from now.

Record in memory what the scan established: the question, the vocabulary that
worked, the boundaries, and what remains unread. The next session starts there
rather than from the beginning.

## Hand back

Lead with the answer to the question, not with the corpus. Then the briefs,
ordered by how much they bear on it. Then, explicitly: how many papers rest on
full text, how many on abstracts alone, and what could not be reached. Close
with what the scan suggests is genuinely open — that is where the student's own
contribution goes.
