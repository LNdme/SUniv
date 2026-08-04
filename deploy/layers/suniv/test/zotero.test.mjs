import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/zotero.mjs";

function zotero(args, env = {}) {
  return runTool("suniv-zotero", args, { fixture: FIXTURE, env });
}

test("a group library is addressed under /groups/, never /users/", () => {
  const { code, json, calls } = zotero(["items", "--group", "900"]);
  assert.equal(code, 0);
  assert.equal(json.library, "group");
  const web = calls.filter((call) => call.url.includes("api.zotero.org"));
  assert.ok(web.length > 0);
  assert.ok(
    web.every((call) => call.url.includes("/groups/900")),
    `every call must target the group, got ${web.map((c) => c.url).join(", ")}`,
  );
});

test("ZOTERO_GROUP_ID selects the team library without a flag", () => {
  const { json, calls } = zotero(["items"], { ZOTERO_GROUP_ID: "900" });
  assert.equal(json.library, "group");
  assert.ok(calls.some((call) => call.url.includes("/groups/900")));
});

test("the personal library stays the default", () => {
  const { json, calls } = zotero(["items"], { ZOTERO_API_KEY: "k", ZOTERO_USER_ID: "77" });
  assert.equal(json.library, "personal");
  assert.ok(calls.some((call) => call.url.includes("/users/77")));
});

test("a missing group and an inaccessible one are told apart", () => {
  const missing = zotero(["items", "--group", "404404"]);
  assert.equal(missing.code, 1);
  assert.match(missing.stderr, /has no group 404404/);
  assert.match(missing.stderr, /group id is the number/);

  const forbidden = zotero(["items", "--group", "403403"]);
  assert.equal(forbidden.code, 1);
  assert.match(forbidden.stderr, /not public/);
});

test("a key holder denied a group is told about membership, not about keys", () => {
  const { stderr } = zotero(["items", "--group", "403403"], { ZOTERO_API_KEY: "k", ZOTERO_USER_ID: "77" });
  assert.match(stderr, /not a member/);
});

test("writing without a key explains that the local API is read-only", () => {
  const file = join(tmpdir(), `suniv-works-${process.pid}.json`);
  writeFileSync(file, JSON.stringify([{ id: "x2024y", type: "article-journal", title: "A Work" }]));
  try {
    const { code, stderr, calls } = zotero(["add", "--file", file, "--collection", "X"]);
    assert.equal(code, 1);
    assert.match(stderr, /local API is read-only by design/);
    assert.equal(
      calls.filter((call) => call.method !== "GET").length,
      0,
      "a refused write must not have been attempted",
    );
  } finally {
    rmSync(file, { force: true });
  }
});

test("a missing input file is reported, not thrown as a stack trace", () => {
  const { code, stderr } = zotero(["add", "--file", "/nonexistent.json"], {
    ZOTERO_API_KEY: "k",
    ZOTERO_GROUP_ID: "900",
  });
  assert.equal(code, 1);
  assert.match(stderr, /no such file/);
  assert.doesNotMatch(stderr, /at readFileSync/, "an expected failure must not surface a Node stack");
});

test("CSL-JSON converts to Zotero's own schema, per item type", () => {
  const works = [
    {
      id: "dupont2023shared",
      type: "article-journal",
      title: "A Journal Article",
      author: [{ family: "Dupont", given: "Marie" }],
      issued: { "date-parts": [[2023, 4, 5]] },
      "container-title": "Journal of Tests",
      DOI: "10.1/shared",
      page: "1-10",
      custom: { suniv: { grounding: "fulltext" } },
    },
    {
      id: "ada2024conf",
      type: "paper-conference",
      title: "A Conference Paper",
      "container-title": "NeurIPS",
      DOI: "10.2/conf",
    },
    { id: "bob2020thesis", type: "thesis", title: "A Thesis", "container-title": "Some University", DOI: "10.3/th" },
  ];
  const file = join(tmpdir(), `suniv-csl-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(works));

  try {
    const { code, json, calls } = zotero(["add", "--file", file, "--tag", "to-read"], {
      ZOTERO_API_KEY: "k",
      ZOTERO_GROUP_ID: "900",
    });
    assert.equal(code, 0);
    assert.equal(json.library.kind, "group");

    const post = calls.find((call) => call.method === "POST");
    assert.ok(post, "items must be POSTed");
    const [article, conference, thesis] = JSON.parse(post.body);

    assert.equal(article.itemType, "journalArticle");
    assert.equal(article.publicationTitle, "Journal of Tests");
    assert.equal(article.DOI, "10.1/shared");
    assert.equal(article.date, "2023-04-05");
    assert.deepEqual(article.creators, [{ creatorType: "author", firstName: "Marie", lastName: "Dupont" }]);
    assert.deepEqual(article.tags, [{ tag: "to-read" }]);
    assert.match(article.extra, /grounding: fulltext/, "grounding must travel with the item");

    assert.equal(conference.itemType, "conferencePaper");
    assert.equal(conference.proceedingsTitle, "NeurIPS");

    assert.equal(thesis.itemType, "thesis");
    assert.equal(thesis.university, "Some University");
    assert.equal(thesis.DOI, undefined, "Zotero's thesis type has no DOI field");
    assert.match(thesis.extra, /DOI: 10\.3\/th/, "the DOI moves to extra rather than being dropped");
  } finally {
    rmSync(file, { force: true });
  }
});

test("status reports the library, the local path and the web path", () => {
  const { json } = zotero(["status", "--group", "900"]);
  assert.equal(json.library.kind, "group");
  assert.equal(json.library.id, "900");
  assert.equal(json.local.capability, "read-only");
  assert.equal(json.web.capability, "read and write");
});
