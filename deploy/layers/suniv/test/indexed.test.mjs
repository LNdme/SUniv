import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/indexed.mjs";
const KEYS = { ELSEVIER_API_KEY: "k", IEEE_API_KEY: "k" };

function indexed(args, env = KEYS) {
  return runTool("suniv-indexed", args, { fixture: FIXTURE, env });
}

test("a Scopus record becomes CSL-JSON", () => {
  const { code, json } = indexed(["calibration", "--source", "scopus", "--csl"]);
  assert.equal(code, 0);
  const [first] = json;

  assert.equal(first.type, "article-journal");
  assert.equal(first.title, "Calibration Of Low-Cost Air Quality Sensors");
  assert.deepEqual(first.author, [{ family: "Dupont", given: "M." }]);
  assert.deepEqual(first.issued["date-parts"][0], [2023, 7, 15]);
  assert.equal(first["container-title"], "Sensors and Actuators B");
  assert.equal(first.page, "133-145");
  assert.equal(first.DOI, "10.1016/j.snb.2023.133145");
  assert.equal(first.custom.suniv.citedBy, 37);
});

test("Scopus error entries are dropped rather than turned into references", () => {
  const { json } = indexed(["calibration", "--source", "scopus", "--csl"]);
  assert.equal(json.length, 3, "the error entry must not become a citable record");
  assert.ok(json.every((item) => item.title));
});

test("Scopus puts the surname first, so its names must not be read as given-name-first", () => {
  const { json } = indexed(["calibration", "--source", "scopus", "--csl"]);
  const authorOf = (fragment) => json.find((item) => item.title.includes(fragment)).author[0];

  assert.deepEqual(authorOf("Calibration"), { family: "Dupont", given: "M." });
  assert.deepEqual(
    authorOf("Neither DOI"),
    { family: "Van Der Berg", given: "A.B." },
    "a multi-word surname must survive",
  );
  assert.deepEqual(authorOf("Carries A Comma"), { family: "Bernard", given: "Alice" });
});

test("a Scopus record without an abstract is metadata-grounded", () => {
  const { json } = indexed(["calibration", "--source", "scopus", "--csl"]);
  const bare = json.find((item) => item.title === "A Record With Neither DOI Nor Abstract");
  assert.equal(bare.custom.suniv.grounding, "metadata");
  assert.match(bare.custom.suniv.groundingNote, /Do not describe the objective or method/);
  assert.equal(bare.DOI, undefined);
});

test("an IEEE conference paper and journal article get different CSL types", () => {
  const { json } = indexed(["graph", "--source", "ieee", "--csl"]);
  const conference = json.find((item) => item.title.includes("Conference Paper"));
  const article = json.find((item) => item.title.includes("Journal Article"));

  assert.equal(conference.type, "paper-conference");
  assert.equal(conference.page, "10-18");
  assert.equal(conference.custom.suniv.citedBy, 12);
  assert.deepEqual(conference.author, [
    { family: "Chen", given: "Wei" },
    { family: "Lovelace", given: "Ada" },
  ]);
  assert.equal(conference.custom.suniv.grounding, "abstract");

  assert.equal(article.type, "article-journal");
  assert.equal(article.custom.suniv.grounding, "metadata");
});

test("an IEEE record with only a year still carries a date", () => {
  const { json } = indexed(["graph", "--source", "ieee", "--csl"]);
  const article = json.find((item) => item.title.includes("Journal Article"));
  assert.deepEqual(article.issued["date-parts"][0], [2021]);
});

test("the Scopus institutional token is sent only when present", () => {
  const without = indexed(["x", "--source", "scopus"]);
  const first = without.calls.find((call) => call.url.includes("api.elsevier.com"));
  assert.equal(first.headers["X-ELS-Insttoken"], undefined);
  assert.equal(first.headers["X-ELS-APIKey"], "k");

  const with_ = indexed(["x", "--source", "scopus"], { ...KEYS, ELSEVIER_INSTTOKEN: "t" });
  const second = with_.calls.find((call) => call.url.includes("api.elsevier.com"));
  assert.equal(second.headers["X-ELS-Insttoken"], "t");
});

test("one index failing does not discard the other's results", () => {
  const { code, json } = indexed(["x"], { IEEE_API_KEY: "k" });
  assert.equal(code, 0);
  assert.ok(json.count > 0, "IEEE answered, so this is not an outage");
  assert.equal(json.unavailable.length, 1);
  assert.equal(json.unavailable[0].source, "scopus");
  assert.match(json.unavailable[0].remedy, /dev\.elsevier\.com/);
});
