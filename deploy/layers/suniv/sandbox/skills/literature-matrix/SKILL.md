---
name: literature-matrix
description: Build the comparison table that turns a pile of papers into a literature review — method, data, metrics, findings and limits, side by side, with the gap made visible. Use when the student has collected sources and must compare them, write a related-work section, or show where their contribution fits.
---

# literature-matrix — the table that unblocks a literature review

Students stall between "I have forty papers" and "I have a literature review".
The matrix is the bridge: once the works sit side by side on the same axes, the
argument writes itself and the gap becomes visible rather than asserted.

## Choose axes that discriminate

The axes are the analysis. Generic columns produce a table nobody learns from;
the right columns make disagreement in the field jump off the page.

Start from the student's question and pick the dimensions on which these papers
actually differ. Usually some of:

- **Objective** — what each set out to establish;
- **Method or design** — the approach, at the granularity that separates them;
- **Data** — corpus, sample, population, size;
- **Evaluation** — metrics, baselines, statistical treatment;
- **Findings** — the result in the authors' terms;
- **Limits** — conceded, and observed;
- **Grounding** — full text, abstract, or metadata.

Keep that last column. A supervisor reading the matrix is entitled to know which
rows rest on a full reading and which on an abstract, and no other tool the
student has will surface it.

Drop an axis that comes out the same for every paper — it is not doing work. Add
one the moment two papers differ on something the existing axes hide.

## Fill it honestly

Each cell comes from a retrieved record, under the rules in `citation-integrity`.
Where a paper is abstract-grounded, cells the abstract does not cover are
`not stated in the abstract` — not blank, and never guessed. An empty-looking
matrix is telling the student something true: they need the texts.

Rows are citation keys from `suniv-search`, so the matrix drops straight into a
draft.

## Read the matrix back

The table is the input to the analysis, not the output. Say what it shows:

- **Clusters** — which papers form a tradition, and on what shared assumption;
- **Disagreements** — where results conflict, and whether the methods explain it;
- **Consensus** — what nobody disputes, and can therefore be asserted with a
  cluster of citations rather than argued;
- **The gap** — the cell that is empty across every row. That is where the
  student's contribution goes, and this is the only defensible way to claim a
  gap: shown, not asserted.

Be careful with the gap. An empty column may mean nobody has done it, or that
the search missed the literature that did. Before the student writes "no prior
work has…", search specifically for the gap itself — that claim gets challenged
in every viva.

## Hand it over in a usable form

Markdown for the conversation. For the dissertation:

```bash
suniv-doc convert --input matrix.md --output matrix.docx --bib refs.json
```

Wide matrices belong in an appendix, with the two or three axes that carry the
argument reproduced in the body. Then offer the prose: a related-work section
follows the clusters, in the order the argument needs them.
