FROM registry.fly.io/suniv-sandboxes:dev

RUN apt-get update && apt-get install -y --no-install-recommends \
      pandoc \
      poppler-utils \
      latexmk \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/*

COPY tools/suniv-doc/suniv-doc /usr/local/bin/suniv-doc
COPY tools/suniv-indexed/suniv-indexed /usr/local/bin/suniv-indexed
COPY tools/suniv-lib/suniv-lib /usr/local/bin/suniv-lib
COPY tools/suniv-patent/suniv-patent /usr/local/bin/suniv-patent
COPY tools/suniv-scholar/suniv-scholar /usr/local/bin/suniv-scholar
COPY tools/suniv-search/suniv-search /usr/local/bin/suniv-search
COPY tools/suniv-zotero/suniv-zotero /usr/local/bin/suniv-zotero

RUN chmod -R a+rx /usr/local/bin \
  && pandoc --version >/dev/null \
  && pdftotext -v 2>/dev/null || true
