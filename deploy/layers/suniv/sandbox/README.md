# The SUniv agent computer

Six tools and seven skills. The tools are plumbing; the skills are the product.

## Tools

| Tool            | What it reaches                                                               | Credentials                                         |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| `suniv-search`  | OpenAlex, Crossref, arXiv, Semantic Scholar, Europe PMC, HAL, CORE, Unpaywall | none (CORE and Semantic Scholar take optional keys) |
| `suniv-zotero`  | the student's Zotero library                                                  | none to read locally; a web key to write            |
| `suniv-indexed` | Scopus, IEEE Xplore                                                           | the student's institutional keys                    |
| `suniv-scholar` | Google Scholar, through SerpApi only                                          | the student's SerpApi key                           |
| `suniv-doc`     | pandoc, latexmk                                                               | none                                                |
| `suniv-lib`     | the student's own PDFs                                                        | none                                                |

Each tool is one self-contained executable. The layer build copies
`tools/<id>/<binary>` and nothing beside it, so a tool that imported a sibling
module would lose it in the sandbox image.

## Document export needs three binaries

`suniv-doc` and `suniv-lib` shell out to `pandoc`, `latexmk` and `pdftotext`.
The QM sandbox base image carries none of them, so without this step the
research half of SUniv works and the writing half reports missing binaries.
`suniv-doc check` says which are absent.

Add them with a `Dockerfile` in this directory:

```dockerfile
FROM <the base image this deployment pins>

RUN apt-get update && apt-get install -y --no-install-recommends \
      pandoc poppler-utils \
      latexmk texlive-latex-recommended texlive-latex-extra texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/*

COPY tools/suniv-doc/suniv-doc /usr/local/bin/suniv-doc
COPY tools/suniv-indexed/suniv-indexed /usr/local/bin/suniv-indexed
COPY tools/suniv-lib/suniv-lib /usr/local/bin/suniv-lib
COPY tools/suniv-scholar/suniv-scholar /usr/local/bin/suniv-scholar
COPY tools/suniv-search/suniv-search /usr/local/bin/suniv-search
COPY tools/suniv-zotero/suniv-zotero /usr/local/bin/suniv-zotero
RUN chmod -R a+rx /usr/local/bin
```

The `FROM` is left blank deliberately: it must name the sandbox base this
deployment actually pins, which differs per operator and is not knowable here.
Set `sandbox.baseImage` in `qm.config.jsonc` to the digest-pinned base and give
`FROM` that same repository without the digest — the CLI then substitutes the
pin at build time. Get it wrong and `qm sandbox publish` builds on the wrong
base, which is why this is a documented step rather than a guessed default.

The TeX packages are the bulk of the image. Drop the `latexmk`/`texlive` line
if the deployment only needs Word and Markdown output; `suniv-doc` will say PDF
export is unavailable rather than failing obscurely.

## Skills

`citation-integrity` is the one the others defer to: no reference that a tool
did not return, and no description of a method beyond what was actually read.
`research-scan`, `literature-matrix` and `paper-deep-read` cover finding,
comparing and understanding; `brainstorm-topic`, `outline-and-draft` and
`thesis-progress` cover choosing a question, writing it up, and holding the
state of a year-long piece of work.
