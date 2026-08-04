import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/keyed-sources.mjs";
const EMAIL = { SUNIV_CONTACT_EMAIL: "tests@suniv.example" };

function search(args, env = {}) {
  return runTool("suniv-search", args, { fixture: FIXTURE, env: { ...EMAIL, ...env } });
}

test("a Semantic Scholar record becomes CSL-JSON", () => {
  const { code, json } = search(["retrieval", "--sources", "semanticscholar", "--limit", "10", "--csl"], {
    SEMANTIC_SCHOLAR_API_KEY: "k",
  });
  assert.equal(code, 0);
  const complete = json.find((item) => item.title.includes("With Everything"));

  assert.equal(complete.DOI, "10.9/s2complete");
  assert.deepEqual(complete.issued["date-parts"][0], [2022, 11, 4]);
  assert.equal(complete["container-title"], "Journal of Retrieval");
  assert.deepEqual(complete.author, [
    { family: "Dupont", given: "Marie" },
    { family: "Chen", given: "Wei" },
  ]);
  assert.equal(complete.custom.suniv.citedBy, 88);
  assert.equal(complete.custom.suniv.grounding, "fulltext", "an open-access PDF is retrievable text");
});

test("a Semantic Scholar record without identifiers still survives", () => {
  const { json } = search(["retrieval", "--sources", "semanticscholar", "--limit", "10", "--csl"], {
    SEMANTIC_SCHOLAR_API_KEY: "k",
  });
  const bare = json.find((item) => item.title.includes("Without External Identifiers"));
  assert.ok(bare, "a record with no DOI and no arXiv id must not be dropped");
  assert.equal(bare.DOI, undefined);
  assert.deepEqual(bare.issued["date-parts"][0], [2018], "the bare year is enough for a date");
  assert.equal(bare.custom.suniv.grounding, "metadata");
});

test("the Semantic Scholar key travels in the header, not the query string", () => {
  const { calls } = search(["retrieval", "--sources", "semanticscholar", "--limit", "2"], {
    SEMANTIC_SCHOLAR_API_KEY: "secret-key",
  });
  const call = calls.find((entry) => entry.url.includes("api.semanticscholar.org"));
  assert.equal(call.headers["x-api-key"], "secret-key");
  assert.doesNotMatch(call.url, /secret-key/, "a key in a URL leaks into logs and referrers");
});

test("a CORE record becomes CSL-JSON and keeps its download", () => {
  const { json } = search(["repository", "--sources", "core", "--limit", "10", "--csl"], { CORE_API_KEY: "k" });
  const withPdf = json.find((item) => item.title.includes("With A Download"));

  assert.equal(withPdf.DOI, "10.7/coredownload");
  assert.deepEqual(withPdf.author, [{ family: "Bernard", given: "Alice" }]);
  assert.deepEqual(withPdf.issued["date-parts"][0], [2021, 3, 9]);
  assert.equal(withPdf.custom.suniv.pdfUrl, "https://core.example/55501.pdf");
  assert.equal(withPdf.custom.suniv.grounding, "fulltext");
});

test("a CORE record without full text is abstract-grounded, not full text", () => {
  const { json } = search(["repository", "--sources", "core", "--limit", "10", "--csl"], { CORE_API_KEY: "k" });
  const withoutPdf = json.find((item) => item.title.includes("Without Any Full Text"));
  assert.equal(withoutPdf.custom.suniv.grounding, "abstract");
  assert.equal(withoutPdf.custom.suniv.pdfUrl, undefined);
});

test("CORE is queried as a POST carrying its key as a bearer token", () => {
  const { calls } = search(["repository", "--sources", "core", "--limit", "2"], { CORE_API_KEY: "secret-key" });
  const call = calls.find((entry) => entry.url.includes("api.core.ac.uk"));
  assert.equal(call.method, "POST");
  assert.equal(call.headers.authorization, "Bearer secret-key");
  assert.match(call.body, /repository/);
});
