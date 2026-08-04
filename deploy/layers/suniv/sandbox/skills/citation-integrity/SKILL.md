---
name: citation-integrity
description: The rule every other SUniv skill obeys — no reference without a retrieved identifier, no method described without the text that contains it. Use whenever a citation, a reference list, a bibliography, or a claim about what a paper did is about to enter anything the student will hand in.
---

# citation-integrity — never cite what you have not retrieved

A fabricated citation is the one error a researcher cannot forgive. It survives
into the submitted manuscript, the supervisor finds it, and everything else SUniv
produced becomes suspect. A confidently invented methodology is worse still: it is
undetectable until someone reads the paper.

Two rules, and they are not negotiable by a student in a hurry.

## A reference exists only if a tool returned it

Every reference entering a draft, a bibliography, a literature matrix or a
Zotero collection must trace to a record returned in _this_ conversation by
`suniv-search`, `suniv-indexed`, or `suniv-lib`. Model recall does not count.
Recall reliably produces plausible titles attached to real authors with DOIs
that resolve to something else entirely — the failure looks exactly like success.

When the student names a paper you have not retrieved, retrieve it:

```bash
suniv-search --doi 10.1038/s41586-021-03819-2
suniv-search "the title they gave you" --limit 5
```

If nothing comes back, say so. "I could not find that paper" is a useful answer.
An invented one is not.

Never edit a citation key, DOI or author list by hand to make a reference "look
right". If it does not match what the tool returned, the tool is right.

## A method exists only if you have read it

Every result carries `custom.suniv.grounding`, which states what SUniv actually
holds of the work. It governs what you may write:

| Grounding  | What you may say                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fulltext` | Anything the text supports. Read it first — `suniv-lib text`, or fetch the open-access copy. Attribute claims to the section they come from.                                   |
| `abstract` | Only what the abstract states, marked as such: "the abstract reports…". Never the sample size, the baselines, the ablations or the limitations unless the abstract names them. |
| `metadata` | Nothing about the objective or the method. Give the title, authors, venue and DOI, say the text was not available, and offer the routes to it.                                 |

The third row is the one that matters. A paywalled article with no abstract is
the normal case in many fields, and the pressure to fill the gap is exactly
where a literature review goes wrong. Filling it is not helpfulness.

When grounding blocks you, offer the routes that actually exist:

- ask whether the student has the PDF, then `suniv-lib index --dir <folder>`;
- `suniv-search --doi <doi>` again, since an open-access copy may exist that the
  first search did not surface;
- their library's interlibrary loan, or the author's own copy on request.

## Before anything is handed in

Re-verify rather than trusting the draft in front of you. For each reference:

1. its identifier resolves — `suniv-search --doi <doi>` returns the same work;
2. the claim it supports matches the grounding it was written from;
3. the citation key in the text exists in the bibliography file.

Then say plainly which references rest on full text and which rest on abstracts.
A supervisor reading a literature review is entitled to know that, and no other
tool the student has will tell them.
