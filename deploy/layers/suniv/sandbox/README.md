# The SUniv agent computer

Six tools and seven skills. The tools are plumbing; the skills are the product.

## Tools

| Tool            | What it reaches                                                               | Credentials                                         |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| `suniv-search`  | OpenAlex, Crossref, arXiv, Semantic Scholar, Europe PMC, HAL, CORE, Unpaywall | none (CORE and Semantic Scholar take optional keys) |
| `suniv-zotero`  | the student's Zotero library                                                  | none to read locally; a web key to write            |
| `suniv-indexed` | Scopus, IEEE Xplore                                                           | the student's institutional keys                    |
| `suniv-scholar` | Google Scholar, through SerpApi only                                          | the student's SerpApi key                           |
| `suniv-patent`  | EPO OPS, USPTO PatentsView                                                    | free credentials from each office                   |
| `suniv-doc`     | pandoc, latexmk                                                               | none                                                |
| `suniv-lib`     | the student's own PDFs                                                        | none                                                |

Each tool is one self-contained executable. The layer build copies
`tools/<id>/<binary>` and nothing beside it, so a tool that imported a sibling
module would lose it in the sandbox image.

## The Dockerfile, and the base it stacks on

`suniv-doc` and `suniv-lib` shell out to `pandoc`, `latexmk` and `pdftotext`,
and the QM sandbox base carries none of them. Without the image, the research
half of SUniv works and the writing half reports missing binaries;
`suniv-doc check` says which are absent.

`Dockerfile` here installs them and copies the seven binaries. **It has never
been built** — it was written where Docker was unavailable, so the only thing
verified is that `qm check` accepts it.

Its `FROM` is `qm-sandbox-base:dev`, which is what `scripts/local-sandbox-build.sh`
tags when it builds `fly/Dockerfile`. So the base must exist before the layer
can stack on it:

```bash
npm run sandbox:local:build     # from the repository root, builds qm-sandbox-base:dev
npm exec qm -- sandbox publish  # from this deployment directory
```

Skipping the first command fails on a missing image rather than on anything
that names the real cause.

A deployment running published images rather than this source checkout pins its
own base: set `sandbox.baseImage` in `qm.config.jsonc` to the digest-pinned
reference and change `FROM` to that same repository without the digest. The CLI
then substitutes the pin at build time. A layer Dockerfile always sets its own
base, so `sandbox publish --from` is ignored once this file exists.

The TeX packages are the bulk of the image. Drop the `latexmk`/`texlive` lines
if the deployment only needs Word and Markdown output; `suniv-doc` will say PDF
export is unavailable rather than failing obscurely.

## Skills

`citation-integrity` is the one the others defer to: no reference that a tool
did not return, and no description of a method beyond what was actually read.
`research-scan`, `literature-matrix` and `paper-deep-read` cover finding,
comparing and understanding; `brainstorm-topic`, `outline-and-draft` and
`thesis-progress` cover choosing a question, writing it up, and holding the
state of a year-long piece of work.

Five more serve a team rather than an individual. `disclosure-guard` is the one
that prevents an irreversible loss: publishing before filing destroys patent
rights in Europe and China outright, and a preprint counts as publishing.
`prior-art-scan` searches patents and papers together, because an examiner
weighs them together. `lab-notebook` keeps the project's shared record — the
same entries serve teammates, the paper, and a patent filing. `team-digest`
reports what moved and what is stuck. `explain-the-brick` explains one member's
component to another, which is what makes the collaboration educational rather
than merely parallel.

## Team libraries

`suniv-zotero --group <id>`, or `ZOTERO_GROUP_ID`, points every read and write
at a shared Zotero group library instead of a personal one, so one member's
literature scan becomes the team's.

Set that id in the **project's own scope**, not in `sandbox.env`. A
deployment-wide value forces every project on the instance into one library,
which suits a single startup and breaks an institution hosting twenty teams.
