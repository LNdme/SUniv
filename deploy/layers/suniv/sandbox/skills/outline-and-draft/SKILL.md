---
name: outline-and-draft
description: Structure a paper or dissertation and write it section by section, every claim tied to a retrieved source, exporting to the format the supervisor expects. Use when the student needs a plan, is stuck on a section, asks for help writing, or must produce a .docx or .tex.
---

# outline-and-draft — structure first, then prose, always sourced

## The structure is the argument

Do not start writing until the shape is agreed. A student who begins at
"Introduction" and writes forward produces a document that wanders, and the
rewrite costs more than the plan would have.

For an article, IMRaD holds in most fields: Introduction, Methods, Results,
Discussion. A memoir or thesis usually runs context, literature review, method,
results, discussion, conclusion — but the department's template wins over any
convention, so ask whether one exists.

Build the outline as claims, not headings. Under each section, the specific
thing being asserted and the evidence for it. "2.3 Related work" plans nothing;
"2.3 — existing methods fail on small corpora (papers A, B); C fixed it for
images but not text" plans a paragraph. Where a claim has no source yet, mark it
`[needs source]` and run `research-scan` before that section is written.

Agree the outline explicitly before drafting. It is far cheaper to move a
section now.

## Draft with the student, not for them

This is their work, and they must be able to defend every line of it. Draft one
section at a time and stop for reaction — a whole chapter arriving at once gets
accepted passively, and passive acceptance is how a student ends up defending
prose they do not understand.

Where the student's own words exist, keep them. Improve the argument and the
clarity; do not overwrite their voice with a house style. A memoir that reads
like a different person raises a question nobody wants asked.

When their draft is wrong about a source, say so directly and show the passage.

## Every claim carries its source

Cite with the keys `suniv-search` produced: `[@kalebic2021crispr]`. They are
already the keys in the bibliography file, so nothing needs renaming later.

Under `citation-integrity`: no reference that was not retrieved, and no claim
about a paper's method beyond its grounding. When the argument needs a source
that does not exist, tell the student the claim is unsupported rather than
attaching the nearest plausible citation — a citation that does not support its
sentence is found by exactly one reader, and that reader is the examiner.

Keep the bibliography beside the draft:

```bash
suniv-zotero items --collection <key> > refs.json
```

## Sections have known failure modes

- **Introduction** — write it last, or rewrite it last. It must promise exactly
  what the paper delivers.
- **Literature review** — organised by argument, never one-paragraph-per-paper.
  `literature-matrix` gives the structure.
- **Method** — the test is reproducibility: could a competent stranger repeat
  this? Anything they would have to guess is missing.
- **Results** — findings only, no interpretation. Report what did not work too.
- **Discussion** — interpretation, limits, and what follows. Limits stated by
  the student are a strength; limits found by the examiner are a weakness.
- **Abstract** — last, and it must survive being read alone.

## Get it out in their format

```bash
suniv-doc convert --input draft.md --output memoire.docx --bib refs.json --csl apa.csl
suniv-doc convert --input draft.md --output article.tex --bib refs.json
suniv-doc convert --input draft.md --output draft.pdf --bib refs.json
```

Use `--reference-doc` to keep the university's Word template rather than
handing back an unstyled file. Check the required citation style before the
final export; converting styles late is easy, but only if someone asks.

The student keeps working in Word, LaTeX or Overleaf. SUniv moves the document
between those worlds — it does not ask them to leave.
