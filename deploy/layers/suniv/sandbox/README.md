# The SUniv agent computer

Eight tools and sixteen skills. The tools are plumbing; the skills are the product.

## Tools

| Tool             | What it reaches                                                               | Credentials                                         |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| `suniv-search`   | OpenAlex, Crossref, arXiv, Semantic Scholar, Europe PMC, HAL, CORE, Unpaywall | none (CORE and Semantic Scholar take optional keys) |
| `suniv-zotero`   | the student's Zotero library                                                  | none to read locally; a web key to write            |
| `suniv-indexed`  | Scopus, IEEE Xplore                                                           | the student's institutional keys                    |
| `suniv-scholar`  | Google Scholar, through SerpApi only                                          | the student's SerpApi key                           |
| `suniv-patent`   | EPO OPS, USPTO PatentsView                                                    | free credentials from each office                   |
| `suniv-msoffice` | Word documents on OneDrive and SharePoint, read only                          | a Microsoft Graph token                             |
| `suniv-doc`      | pandoc, latexmk                                                               | none                                                |
| `suniv-lib`      | the student's own PDFs, and optionally a GROBID server                        | none                                                |

`suniv-msoffice` is the one that is defined by what it refuses. Microsoft Graph
cannot edit a `.docx`: it returns the whole file to replace, and every write
fails with `423 Locked` while anyone has the document open — with no API to ask
about the lock beforehand. Replacing a shared thesis while a supervisor
annotates it destroys their work, so the tool reads, searches and reports
versions, and `suniv-msoffice write` exists only to explain that writing belongs
in the Word add-in, where insertions arrive as tracked changes.

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

Its `FROM` is `registry.fly.io/suniv-sandboxes:dev` — a **registry** reference,
not the `qm-sandbox-base:dev` local tag it first carried. That distinction
decides whether the layer can be published at all: `qm sandbox publish` resolves
its base to an immutable digest by pulling it
(`pinnedByPull`, `cli/src/commands/sandbox.ts`), and a tag that exists only in a
local daemon resolves to `docker.io/library/qm-sandbox-base:dev`, which does not
exist. `qm sandbox build` tolerates a local tag because it neither pushes nor
pins; `publish` does not, and both the docker and fly targets require a published
image (`requiresSandboxApp` in `cli/src/commands/check.ts`).

`scripts/local-sandbox-build.sh` already pushes that exact tag when
`FLY_SANDBOX_APP_NAME` is set — it builds `fly/Dockerfile` on Fly's remote amd64
builder, which is also the one step of the chain that needs no local Docker:

```bash
FLY_SANDBOX_APP_NAME=suniv-sandboxes npm run sandbox:local:build   # repository root
node cli/bin/qm.ts sandbox publish --config deploy/layers/suniv/qm.config.fly.jsonc
```

`publish` records the resulting digest as `sandbox.image`, and the base digest as
`sandbox.baseImage`. Once `baseImage` is recorded, the CLI substitutes it into
this `FROM` at build time, so later builds stop depending on what `:dev` points
at. A layer Dockerfile always sets its own base, so `sandbox publish --from` is
ignored once this file exists.

`.github/workflows/suniv-sandbox-image.yml` runs both commands where Docker
exists. [`../FLY.md`](../FLY.md) is the runbook.

## Reading a paper's structure

`suniv-lib sections` matches headings with a pattern. That works on numbered
papers and on the conventional capitalised words, and it returns nothing at all
on a paper that numbers nothing — which the test suite fixes as a documented
limit rather than leaving as a surprise.

`--grobid <url>`, or `SUNIV_GROBID_URL`, sends the PDF to a GROBID server
instead and reads the TEI it returns: the document's own divisions, its title,
and its reference count. GROBID is itself a container the student or the
deployment runs, so it stays optional; nothing depends on it being there.

The output always carries `source: "grobid" | "headings"`, and a GROBID that is
down or at capacity degrades to the pattern with `grobidError` set rather than
failing the command or, worse, presenting matched headings as a parsed
structure. TEI carries no page numbers, so each heading's page is found by
locating its text in the extracted pages, and is absent when the two do not
line up.

This path has never run against a real GROBID. The TEI fixture is written from
the format, not captured from a server.

## The TeX packages

They are the bulk of the image. Drop the `latexmk`/`texlive` lines
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

Four serve a teacher, and they arrived from a teacher already using SUniv the
other way round — searching IEEE by hand to prepare a course, and learning in
the process. The deliverable is a course rather than a paper and the cycle is
weekly rather than annual, but the material is the same, so no new tool was
needed. Each course is its own scope: three lecture courses are three memories,
three collections, three watches. `course-design` sequences the sessions and
files what each rests on, `lecture-draft` writes one session and exports it as a
handout or as slides, `exercise-set` builds problems on a real paper — up to a
question the field has not answered, which must be verified as still open before
it is set — and `teaching-watch` reports what changed since the course last ran,
including the result that quietly dated a slide.

## Team libraries

`suniv-zotero --group <id>`, or `ZOTERO_GROUP_ID`, points every read and write
at a shared Zotero group library instead of a personal one, so one member's
literature scan becomes the team's.

Set that id in the **project's own scope**, not in `sandbox.env`. A
deployment-wide value forces every project on the instance into one library,
which suits a single startup and breaks an institution hosting twenty teams.
