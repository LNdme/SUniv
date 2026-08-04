import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/patent.mjs";
const EPO = { EPO_OPS_KEY: "k", EPO_OPS_SECRET: "s" };
const USPTO = { PATENTSVIEW_API_KEY: "k" };

function patent(args, env) {
  return runTool("suniv-patent", args, { fixture: FIXTURE, env });
}

test("EPO records parse out of the OPS nesting", () => {
  const { code, json } = patent(["graphene", "--source", "epo", "--csl"], EPO);
  assert.equal(code, 0);
  assert.equal(json.length, 1);
  const item = json[0];

  assert.equal(item.type, "patent");
  assert.equal(item.title, "Graphene-based gas sensor", "the English title wins over other languages");
  assert.deepEqual(item.author, [{ family: "DUPONT", given: "MARIE" }], "the original-format duplicate is dropped");
  assert.equal(item.number, "EP1234567A1");
  assert.equal(item.authority, "EP");
  assert.deepEqual(item.issued["date-parts"][0], [2021, 3, 17]);
  assert.equal(item.custom.suniv.assignee, "CNRS");
  assert.equal(item.id, "dupont2021ep1234567a1", "a patent cites by its publication number");
});

test("USPTO records parse and carry their publication number", () => {
  const { json } = patent(["cognitive", "--source", "uspto", "--csl"], USPTO);
  const item = json[0];
  assert.equal(item.type, "patent");
  assert.equal(item.number, "US11024329");
  assert.deepEqual(item.author, [{ family: "Lovelace", given: "Ada" }]);
  assert.equal(item.id, "lovelace2021us11024329");
});

test("claims are never claimed to have been read", () => {
  const { json } = patent(["graphene", "--source", "epo", "--csl"], EPO);
  const meta = json[0].custom.suniv;
  assert.equal(meta.claimsRetrieved, false);
  assert.equal(meta.grounding, "abstract");
  assert.match(meta.groundingNote, /claims/);
});

test("the search envelope repeats the claims caveat", () => {
  const { json } = patent(["graphene", "--source", "epo"], EPO);
  assert.match(json.note, /Claims were not retrieved/);
});

test("no credentials is no result, not an empty result", () => {
  const { code, stderr, json } = patent(["graphene"]);
  assert.equal(code, 1);
  assert.equal(json, undefined);
  assert.match(stderr, /no patent office answered/);
  assert.match(stderr, /EPO_OPS_KEY/);
  assert.match(stderr, /PATENTSVIEW_API_KEY/);
});

test("status names what the tool cannot do", () => {
  const { json } = patent(["--status"]);
  assert.equal(json.epo.credentials, false);
  assert.ok(json.limits.some((line) => /claims/.test(line)));
  assert.ok(json.limits.some((line) => /patent attorney/.test(line)));
});
