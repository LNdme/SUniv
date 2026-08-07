import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runTool } from "./harness.mjs";
import { writePdf, NUMBERED_PAPER, UNNUMBERED_PAPER } from "./fixtures/make-pdf.mjs";

function library() {
  return join(mkdtempSync(join(tmpdir(), "suniv-lib-test-")), "library.json");
}

function lib(args, index) {
  return runTool("suniv-lib", args, { env: { SUNIV_LIBRARY: index } });
}

function indexed(pages = NUMBERED_PAPER, name = "paper.pdf") {
  const index = library();
  const pdf = writePdf(name, pages);
  const result = lib(["index", "--dir", dirname(pdf)], index);
  return { index, pdf, result };
}

test("indexing a folder of PDFs reports what it took in", () => {
  const { result } = indexed();
  assert.equal(result.code, 0);
  assert.equal(result.json.seen, 1);
  assert.equal(result.json.added, 1);
  assert.deepEqual(result.json.failed, []);
});

test("a re-index skips a file that has not changed", () => {
  const { index, pdf } = indexed();
  const again = lib(["index", "--dir", dirname(pdf)], index);
  assert.equal(again.json.unchanged, 1);
  assert.equal(again.json.added, 0);
  assert.equal(again.json.indexed, 1, "re-indexing must not duplicate the document");
});

test("the page count is the paper's, not one more for the trailing form feed", () => {
  const { index, pdf } = indexed();
  const { json } = lib(["sections", "--file", pdf], index);
  assert.equal(json.pageCount, 3, "pdftotext ends its output with a form feed, which is not a fourth page");
});

test("the title guess skips the arXiv banner and takes the title line", () => {
  const { index, pdf } = indexed();
  const { json } = lib(["sections", "--file", pdf], index);
  assert.equal(json.titleGuess, "Calibrating Low Cost Particulate Sensors In The Field");
});

test("sections finds the numbered headings and the page each sits on", () => {
  const { index, pdf } = indexed();
  const { code, json } = lib(["sections", "--file", pdf], index);
  assert.equal(code, 0);

  const found = json.sections.map((section) => section.heading);
  assert.ok(found.includes("3.2 Experimental setup"), "the heading a method claim is cited against");
  assert.ok(found.includes("ABSTRACT"));
  assert.ok(found.includes("4. RESULTS"));

  const setup = json.sections.find((section) => section.heading === "3.2 Experimental setup");
  assert.equal(setup.page, 3);
  assert.match(json.note, /Cite a claim by the heading/);
});

test("a paper without conventional numbering yields no headings, and says so", () => {
  const { index, pdf } = indexed(UNNUMBERED_PAPER, "unnumbered.pdf");
  const { json } = lib(["sections", "--file", pdf], index);
  assert.deepEqual(
    json.sections,
    [],
    "the heuristic reads numbering and capitalised keywords, and this paper has neither",
  );
  assert.match(json.note, /rather than inventing a structure/);
});

test("search returns the passage with the page a student can turn to", () => {
  const { index } = indexed();
  const { code, json } = lib(["search", "co located"], index);
  assert.equal(code, 0);
  assert.equal(json.count, 1);
  assert.equal(json.hits[0].page, 3);
  assert.match(json.hits[0].passage, /ninety days/);
});

test("search requires every term, so it does not answer a narrow question loosely", () => {
  const { index } = indexed();
  assert.equal(lib(["search", "humidity", "beta"], index).json.count, 0);
  assert.equal(lib(["search", "humidity"], index).json.count, 1);
});

test("text --page returns one page, and an out-of-range page names the count", () => {
  const { index, pdf } = indexed();
  const page = lib(["text", "--file", pdf, "--page", "2"], index);
  assert.equal(page.code, 0);
  assert.match(page.stdout, /RELATED WORK/);
  assert.doesNotMatch(page.stdout, /Experimental setup/, "page 2 must not carry page 3");

  const beyond = lib(["text", "--file", pdf, "--page", "9"], index);
  assert.equal(beyond.code, 1);
  assert.match(beyond.stderr, /has 3 pages; 9 is out of range/);
});

test("a PDF outside the index is still readable, without being filed", () => {
  const index = library();
  const pdf = writePdf("loose.pdf", NUMBERED_PAPER);
  const { code, json } = lib(["sections", "--file", pdf], index);
  assert.equal(code, 0);
  assert.equal(json.pageCount, 3);
  assert.equal(lib(["list"], index).json.count, 0, "reading a file must not silently add it to the library");
});

test("list names the index file, so a missing library is diagnosable", () => {
  const index = library();
  const { json } = lib(["list"], index);
  assert.equal(json.indexFile, index);
  assert.equal(json.count, 0);
});
