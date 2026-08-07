import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/empty.mjs";

test("suniv-scholar refuses without a provider key and reaches nothing", () => {
  const { code, stderr, calls } = runTool("suniv-scholar", ["deep learning"], { fixture: FIXTURE });
  assert.equal(code, 2);
  assert.match(stderr, /will not scrape Google Scholar/);
  assert.equal(calls.length, 0, "a refusal must not have contacted anything");
});

test("suniv-scholar never names scholar.google.com as a route it would take", () => {
  const { json } = runTool("suniv-scholar", ["--status"], { fixture: FIXTURE });
  assert.equal(json.scrapes, false);
  assert.match(json.note, /no API/);
  assert.match(json.alternative, /suniv-search/);
});

test("suniv-indexed explains the campus IP binding rather than blaming the key", () => {
  const { code, stderr } = runTool("suniv-indexed", ["machine learning"], { fixture: FIXTURE });
  assert.equal(code, 1);
  assert.match(stderr, /no subscription index answered/);
  assert.match(stderr, /suniv-search covers most of this literature/);
});

test("suniv-indexed status warns that a Scopus key is bound to an IP range", () => {
  const { json } = runTool("suniv-indexed", ["--status"], { fixture: FIXTURE });
  assert.match(json.scopus.note, /IP ranges/);
  assert.match(json.alternative, /suniv-search/);
});

test("suniv-doc reports which binaries are missing instead of failing opaquely", () => {
  const { json } = runTool("suniv-doc", ["check"], { fixture: FIXTURE, env: { PATH: "/nonexistent" } });
  assert.equal(json.usable, false);
  assert.equal(json.binaries.pandoc.installed, false);
  assert.match(json.note, /Say so plainly/);
});

test("suniv-lib refuses to search an empty index rather than reporting no hits", () => {
  const { code, stderr } = runTool("suniv-lib", ["search", "anything"], {
    fixture: FIXTURE,
    env: { SUNIV_LIBRARY: "/nonexistent/library.json" },
  });
  assert.equal(code, 1);
  assert.match(stderr, /index is empty/);
});

test("every tool answers --help without credentials", () => {
  for (const tool of [
    "suniv-search",
    "suniv-zotero",
    "suniv-indexed",
    "suniv-scholar",
    "suniv-doc",
    "suniv-lib",
    "suniv-patent",
    "suniv-msoffice",
  ]) {
    const { code, stdout } = runTool(tool, ["--help"], { fixture: FIXTURE });
    assert.equal(code, 0, `${tool} --help must succeed`);
    assert.match(stdout, /usage:/, `${tool} --help must print usage`);
  }
});
