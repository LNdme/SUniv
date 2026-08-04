import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/scholar.mjs";
const KEY = { SERPAPI_API_KEY: "k" };

function scholar(args) {
  return runTool("suniv-scholar", args, { fixture: FIXTURE, env: KEY });
}

test("a Scholar result parses authors, venue and year out of one summary line", () => {
  const { code, json } = scholar(["attention", "--csl"]);
  assert.equal(code, 0);
  const [first] = json;

  assert.equal(first.title, "Attention Is All You Need");
  assert.deepEqual(first.author.slice(0, 2), [
    { family: "Vaswani", given: "A" },
    { family: "Shazeer", given: "N" },
  ]);
  assert.deepEqual(first.issued["date-parts"][0], [2017]);
  assert.equal(first["container-title"], "Advances in neural information");
  assert.equal(first.custom.suniv.citedBy, 150000);
});

test("a snippet is never presented as an abstract", () => {
  const { json } = scholar(["attention", "--csl"]);
  for (const item of json) {
    assert.equal(item.abstract, undefined, "Scholar returns matched text, which is not an abstract");
  }
  const withoutPdf = json.find((item) => item.title.includes("No Dash"));
  assert.equal(withoutPdf.custom.suniv.grounding, "metadata");
  assert.match(withoutPdf.custom.suniv.groundingNote, /not an abstract/);
});

test("a linked PDF is full text, a bare result is not", () => {
  const { json } = scholar(["attention", "--csl"]);
  assert.equal(json.find((item) => item.title.includes("Attention")).custom.suniv.grounding, "fulltext");
  assert.equal(json.find((item) => item.title.includes("No Dash")).custom.suniv.grounding, "metadata");
});

test("a PDF resource without a declared format is still recognised by its URL", () => {
  const { json } = scholar(["attention", "--csl"]);
  const bare = json.find((item) => item.title.includes("No Publication Info"));
  assert.equal(bare.custom.suniv.pdfUrl, "https://example.com/paper.pdf");
});

test("an unparseable summary degrades instead of inventing a venue", () => {
  const { json } = scholar(["attention", "--csl"]);
  const odd = json.find((item) => item.title.includes("No Dash"));
  assert.equal(odd["container-title"], undefined, "no dash means no venue was stated, not a guessed one");
  assert.deepEqual(odd.issued["date-parts"][0], [2020], "the year is still recoverable");
});

test("a result with no publication info at all carries no fabricated metadata", () => {
  const { json } = scholar(["attention", "--csl"]);
  const bare = json.find((item) => item.title.includes("No Publication Info"));
  assert.deepEqual(bare.author, []);
  assert.equal(bare.issued, undefined);
  assert.equal(bare["container-title"], undefined);
});

test("every result is marked as needing resolution to a real identifier", () => {
  const { json } = scholar(["attention", "--csl"]);
  assert.ok(json.every((item) => !item.DOI));
  assert.ok(json.every((item) => /suniv-search/.test(item.custom.suniv.resolveNote)));
});

test("the envelope repeats that Scholar records carry no DOI", () => {
  const { json } = scholar(["attention"]);
  assert.match(json.note, /no DOI/);
  assert.equal(json.provider, "serpapi");
});
