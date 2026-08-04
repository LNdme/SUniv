import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/search.mjs";
const EMAIL = { SUNIV_CONTACT_EMAIL: "tests@suniv.example" };

function search(args, env = {}) {
  return runTool("suniv-search", args, { fixture: FIXTURE, env: { ...EMAIL, ...env } });
}

function bySources(items) {
  const counts = {};
  for (const item of items) for (const source of item.custom.suniv.sources) counts[source] = (counts[source] ?? 0) + 1;
  return counts;
}

test("a record without a DOI survives deduplication", () => {
  const { code, json } = search(["query", "--sources", "arxiv", "--limit", "10"]);
  assert.equal(code, 0);
  assert.equal(json.count, 2, "both DOI-less preprints must come back");
  assert.ok(json.items.every((item) => !item.DOI));
});

test("records from different sources merge on a shared DOI", () => {
  const { json } = search(["query", "--sources", "openalex,crossref", "--limit", "10"]);
  const shared = json.items.filter((item) => item.DOI === "10.1/shared");
  assert.equal(shared.length, 1, "the same DOI must appear once");
  assert.deepEqual(shared[0].custom.suniv.sources.sort(), ["crossref", "openalex"]);
});

test("a publisher landing page is not full text", () => {
  const { json } = search(["query", "--sources", "openalex", "--limit", "10"]);
  const byDoi = Object.fromEntries(json.items.map((item) => [item.DOI, item]));

  assert.equal(byDoi["10.1/shared"].custom.suniv.grounding, "fulltext", "a retrievable PDF is full text");
  assert.equal(
    byDoi["10.2/paywalled"].custom.suniv.grounding,
    "abstract",
    "a paywalled work with an abstract is abstract-grounded, never full text",
  );
  assert.equal(byDoi["10.3/bare"].custom.suniv.grounding, "metadata");
  assert.match(byDoi["10.3/bare"].custom.suniv.groundingNote, /Do not describe/);
});

test("the limit spans every source instead of exhausting the first", () => {
  const { json } = search(["query", "--sources", "openalex,arxiv", "--limit", "2"]);
  assert.equal(json.count, 2);
  const counts = bySources(json.items);
  assert.ok(counts.openalex >= 1 && counts.arxiv >= 1, `expected both sources, got ${JSON.stringify(counts)}`);
});

test("citation keys are usable and collisions are suffixed", () => {
  const { json } = search(["query", "--sources", "arxiv", "--limit", "10"]);
  const keys = json.items.map((item) => item.id);
  assert.ok(
    keys.every((key) => /^[a-z]+(\d{4}|nd)[a-z0-9]+$/.test(key)),
    `keys must be plain pandoc citekeys, got ${keys.join(", ")}`,
  );
  assert.equal(new Set(keys).size, keys.length, "colliding keys must be made unique");
  assert.ok(
    keys.some((key) => /b$/.test(key)),
    `expected a suffixed collision, got ${keys.join(", ")}`,
  );
});

test("--csl emits a bare array for pandoc", () => {
  const { json } = search(["query", "--sources", "openalex", "--limit", "2", "--csl"]);
  assert.ok(Array.isArray(json));
  assert.ok(json[0].id && json[0].type && json[0].title);
});

test("a source skipped for a missing key is not an empty result", () => {
  const { code, stderr, json } = search(["query", "--sources", "core", "--limit", "5"]);
  assert.equal(code, 1, "nothing was searched, so this must not exit successfully");
  assert.equal(json, undefined);
  assert.match(stderr, /no source answered/);
  assert.match(stderr, /CORE_API_KEY/);
});

test("the polite pool email reaches the sources that ask for it", () => {
  const { calls } = search(["query", "--sources", "openalex", "--limit", "2"]);
  const openalex = calls.find((call) => call.url.includes("api.openalex.org"));
  assert.match(openalex.url, /mailto=tests%40suniv.example/);
});

test("an unset contact email is reported rather than silently degrading", () => {
  const { json } = runTool("suniv-search", ["query", "--sources", "openalex", "--limit", "2"], { fixture: FIXTURE });
  assert.ok(json.diagnostics.notes?.some((note) => note.includes("SUNIV_CONTACT_EMAIL")));
});
