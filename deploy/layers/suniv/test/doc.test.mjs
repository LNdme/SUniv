import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTool } from "./harness.mjs";
import { writePdf, NUMBERED_PAPER } from "./fixtures/make-pdf.mjs";

const CSL = [
  {
    id: "dupont2026calibrating",
    type: "article-journal",
    title: "Calibrating Low Cost Particulate Sensors In The Field",
    author: [
      { family: "Dupont", given: "Marie" },
      { family: "Chen", given: "Wei" },
    ],
    issued: { "date-parts": [[2026, 1, 4]] },
    "container-title": "Journal of Atmospheric Measurement",
    DOI: "10.1234/calib.2026",
  },
];

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "suniv-doc-test-"));
  writeFileSync(join(dir, "refs.json"), JSON.stringify(CSL, null, 2));
  writeFileSync(
    join(dir, "draft.md"),
    "# Method\n\nSensors drift with humidity [@dupont2026calibrating].\n\n# References\n",
  );
  return dir;
}

function doc(args) {
  return runTool("suniv-doc", args);
}

test("check finds the binaries this sandbox actually has", () => {
  const { code, json } = doc(["check"]);
  assert.equal(code, 0);
  assert.equal(json.binaries.pandoc.installed, true);
  assert.equal(json.binaries.pdftotext.installed, true);
});

test("a Markdown draft becomes a .docx with its citations rendered", () => {
  const dir = workspace();
  const output = join(dir, "draft.docx");
  const { code, json } = doc([
    "convert",
    "--input",
    join(dir, "draft.md"),
    "--output",
    output,
    "--bib",
    join(dir, "refs.json"),
  ]);

  assert.equal(code, 0);
  assert.equal(json.to, "docx");
  assert.ok(existsSync(output));
  const bytes = readFileSync(output);
  assert.equal(bytes.subarray(0, 2).toString("latin1"), "PK", "a .docx is a zip");
  assert.ok(bytes.length > 4000, "an empty document would mean citeproc silently dropped the body");
});

test("a Markdown draft becomes LaTeX with the citation resolved to the author", () => {
  const dir = workspace();
  const output = join(dir, "draft.tex");
  doc(["convert", "--input", join(dir, "draft.md"), "--output", output, "--bib", join(dir, "refs.json")]);

  const tex = readFileSync(output, "utf8");
  assert.match(tex, /\(Dupont and Chen 2026\)/, "citeproc must have resolved the key against the bibliography");
  assert.doesNotMatch(tex, /\[@dupont2026calibrating\]/, "an unresolved key stays in its bracketed form");
  assert.match(tex, /10\.1234\/calib\.2026/, "the rendered bibliography carries the identifier");
});

test("CSL-JSON converts to BibTeX and keeps the identifiers a citation rests on", () => {
  const dir = workspace();
  const output = join(dir, "refs.bib");
  const { code, json } = doc(["bib", "--input", join(dir, "refs.json"), "--output", output]);

  assert.equal(code, 0);
  assert.equal(json.from, "csljson");
  assert.equal(json.to, "biblatex");
  const bib = readFileSync(output, "utf8");
  assert.match(bib, /dupont2026calibrating/);
  assert.match(bib, /10\.1234\/calib\.2026/);
});

test("BibTeX converts back to CSL-JSON, the direction that had never run", () => {
  const dir = workspace();
  const bibPath = join(dir, "refs.bib");
  doc(["bib", "--input", join(dir, "refs.json"), "--output", bibPath]);

  const back = join(dir, "round-trip.json");
  const { code } = doc(["bib", "--input", bibPath, "--output", back]);
  assert.equal(code, 0);

  const items = JSON.parse(readFileSync(back, "utf8"));
  assert.equal(items[0].id, "dupont2026calibrating");
  assert.equal(items[0].DOI, "10.1234/calib.2026");
  assert.equal(items[0].author[0].family, "Dupont");
});

test("bib leaves nothing behind beside the student's own file", () => {
  const dir = workspace();
  writeFileSync(join(dir, "wrapped.json"), JSON.stringify({ items: CSL }));
  doc(["bib", "--input", join(dir, "wrapped.json"), "--output", join(dir, "wrapped.bib")]);

  const stray = readdirSync(dir).filter((name) => name.includes(".items.json"));
  assert.deepEqual(stray, [], "the unwrapped copy is scratch, and scratch belongs in a temp directory");
});

test("bib refuses an output extension it would otherwise mislabel", () => {
  const dir = workspace();
  const { code, stderr } = doc(["bib", "--input", join(dir, "refs.json"), "--output", join(dir, "refs.docx")]);
  assert.equal(code, 1);
  assert.match(stderr, /must be CSL-JSON \(\.json\) or BibTeX \(\.bib\)/);
  assert.ok(!existsSync(join(dir, "refs.docx")), "no file that claims to be a .docx but holds BibTeX");
});

test("convert refuses a bibliography as a document and names the command that fits", () => {
  const dir = workspace();
  const { code, stderr } = doc(["convert", "--input", join(dir, "refs.json"), "--output", join(dir, "refs.docx")]);
  assert.equal(code, 1);
  assert.match(stderr, /is a bibliography, not a document/);
  assert.match(stderr, /suniv-doc bib/);
});

test("--reference-doc carries a university's Word template into the output", () => {
  const dir = workspace();
  const template = join(dir, "template.docx");
  doc(["convert", "--input", join(dir, "draft.md"), "--output", template]);

  const output = join(dir, "styled.docx");
  const { code } = doc(["convert", "--input", join(dir, "draft.md"), "--output", output, "--reference-doc", template]);
  assert.equal(code, 0);
  assert.ok(existsSync(output));
});

test("a missing reference document is named rather than swallowed by pandoc", () => {
  const dir = workspace();
  const { code, stderr } = doc([
    "convert",
    "--input",
    join(dir, "draft.md"),
    "--output",
    join(dir, "out.docx"),
    "--reference-doc",
    join(dir, "absent.docx"),
  ]);
  assert.equal(code, 1);
  assert.match(stderr, /reference document not found/);
});

test("a missing bibliography stops the conversion instead of dropping every citation", () => {
  const dir = workspace();
  const { code, stderr } = doc([
    "convert",
    "--input",
    join(dir, "draft.md"),
    "--output",
    join(dir, "out.docx"),
    "--bib",
    join(dir, "absent.json"),
  ]);
  assert.equal(code, 1);
  assert.match(stderr, /bibliography not found/);
});

test("PDF export names latexmk and how to install it, not a pandoc failure", () => {
  const dir = workspace();
  const { code, stderr } = doc(["convert", "--input", join(dir, "draft.md"), "--output", join(dir, "draft.pdf")]);
  assert.equal(code, 1);
  assert.match(stderr, /latexmk is not installed/);
  assert.match(stderr, /apt-get install latexmk/);
  assert.match(stderr, /add it to the layer's sandbox image/);
});

test("a PDF is refused as convert input and pointed at the reader", () => {
  const dir = workspace();
  const pdf = writePdf("paper.pdf", NUMBERED_PAPER);
  const { code, stderr } = doc(["convert", "--input", pdf, "--output", join(dir, "out.md")]);
  assert.equal(code, 1);
  assert.match(stderr, /suniv-doc text/);
});

test("text extracts a PDF one page per form feed", () => {
  const pdf = writePdf("paper.pdf", NUMBERED_PAPER);
  const { code, stdout } = doc(["text", "--input", pdf]);
  assert.equal(code, 0);
  const pages = stdout.split("\f").filter((page) => page.trim());
  assert.equal(pages.length, 3);
  assert.match(pages[2], /3\.2 Experimental setup/);
});
