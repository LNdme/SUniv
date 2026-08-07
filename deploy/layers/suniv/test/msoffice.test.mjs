import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/msoffice.mjs";
const TOKEN = { MSGRAPH_ACCESS_TOKEN: "graph-token" };

function msoffice(args, env = {}) {
  return runTool("suniv-msoffice", args, { fixture: FIXTURE, env: { ...TOKEN, ...env } });
}

test("a drive listing names who touched each document last", () => {
  const { code, json } = msoffice(["list"]);
  assert.equal(code, 0);
  assert.equal(json.count, 3);

  const thesis = json.documents.find((doc) => doc.name.startsWith("Memoire"));
  assert.equal(thesis.isWord, true);
  assert.equal(thesis.isFolder, false);
  assert.equal(thesis.lastModifiedBy, "Marie Dupont");
  assert.equal(thesis.webUrl, "https://contoso-my.sharepoint.com/personal/etudiant/Doc.aspx?id=chapitre3");
});

test("a folder is reported as a folder, not as a zero-byte document", () => {
  const { json } = msoffice(["list"]);
  const folder = json.documents.find((doc) => doc.name === "Sources");
  assert.equal(folder.isFolder, true);
  assert.equal(folder.isWord, false);
});

test("--word keeps folders so the tree stays walkable", () => {
  const { json } = msoffice(["list", "--word"]);
  const names = json.documents.map((doc) => doc.name);
  assert.ok(names.includes("Memoire-chapitre-3.docx"));
  assert.ok(names.includes("Sources"), "filtering out folders would make a subfolder unreachable");
  assert.ok(!names.includes("notes-reunion.txt"));
});

test("--path addresses a folder by name rather than by opaque id", () => {
  const { calls } = msoffice(["list", "--path", "/Memoire"]);
  const call = calls.find((entry) => entry.url.includes("graph.microsoft.com"));
  assert.match(call.url, /\/me\/drive\/root:\/Memoire:\/children/);
});

test("--drive addresses a SharePoint library instead of the user's OneDrive", () => {
  const { calls } = msoffice(["list", "--drive", "b!LabDrive"]);
  const call = calls.find((entry) => entry.url.includes("graph.microsoft.com"));
  assert.match(call.url, /\/drives\/b!LabDrive\/root\/children/);
  assert.doesNotMatch(call.url, /\/me\/drive/);
});

test("the token travels in the Authorization header, never in the URL", () => {
  const { calls } = msoffice(["list"], { MSGRAPH_ACCESS_TOKEN: "secret-token" });
  const call = calls.find((entry) => entry.url.includes("graph.microsoft.com"));
  assert.equal(call.headers.authorization, "Bearer secret-token");
  assert.doesNotMatch(call.url, /secret-token/, "a token in a URL leaks into logs and referrers");
});

test("find quotes the search terms the way Graph's OData function expects", () => {
  const { code, json, calls } = msoffice(["find", "calibration", "capteurs"]);
  assert.equal(code, 0);
  assert.equal(json.terms, "calibration capteurs");
  assert.equal(json.count, 1);
  const call = calls.find((entry) => entry.url.includes("graph.microsoft.com"));
  assert.match(call.url, /\/root\/search\(q='calibration%20capteurs'\)/);
});

test("versions points at the history rather than at a lost paragraph", () => {
  const { code, json } = msoffice(["versions", "--item", "01ABCTHESIS"]);
  assert.equal(code, 0);
  assert.equal(json.count, 2);
  assert.equal(json.versions[1].lastModifiedBy, "Pr. Bernard");
  assert.match(json.note, /recoverable/);
});

test("share reports who holds which link, and refuses to change them", () => {
  const { json } = msoffice(["share", "--item", "01ABCTHESIS"]);
  assert.equal(json.count, 2);
  assert.deepEqual(json.permissions[0].roles, ["write"]);
  assert.deepEqual(json.permissions[0].grantedTo, ["Pr. Bernard"]);
  assert.equal(json.permissions[1].scope, "anonymous");
  assert.match(json.note, /Read only/);
});

test("get on a Word document sends the student to Word, not to an edit API", () => {
  const { json } = msoffice(["get", "--item", "01ABCTHESIS"]);
  assert.equal(json.document.isWord, true);
  assert.match(json.note, /add-in writes into the live document with tracked changes/);
});

test("write refuses, names 423 Locked, and points at the add-in", () => {
  const { code, stderr, calls } = msoffice(["write"]);
  assert.equal(code, 2);
  assert.match(stderr, /423 Locked/);
  assert.match(stderr, /add-in/);
  assert.match(stderr, /suniv-doc/);
  assert.equal(calls.length, 0, "a refusal must not have contacted anything");
});

test("without a token the tool refuses and reaches nothing", () => {
  const { code, stderr, calls } = runTool("suniv-msoffice", ["list"], { fixture: FIXTURE });
  assert.equal(code, 2);
  assert.match(stderr, /MSGRAPH_ACCESS_TOKEN is not set/);
  assert.equal(calls.length, 0);
});

test("--status answers without a token and states that the tool never writes", () => {
  const { code, json } = runTool("suniv-msoffice", ["--status"], { fixture: FIXTURE });
  assert.equal(code, 0);
  assert.equal(json.configured, false);
  assert.equal(json.writes, false);
  assert.deepEqual(json.scopes, ["Files.ReadWrite", "offline_access", "User.Read"]);
  assert.match(json.note, /423 Locked/);
});

test("a 401 is reported as an expired token, not as a withdrawn account", () => {
  const { code, stderr } = runTool("suniv-msoffice", ["list"], {
    fixture: "./fixtures/msoffice-expired.mjs",
    env: TOKEN,
  });
  assert.equal(code, 1);
  assert.match(stderr, /about an hour/);
});

test("a 403 blames the consent scopes rather than the token", () => {
  const { code, stderr } = runTool("suniv-msoffice", ["list"], {
    fixture: "./fixtures/msoffice-forbidden.mjs",
    env: TOKEN,
  });
  assert.equal(code, 1);
  assert.match(stderr, /Files\.ReadWrite/);
  assert.match(stderr, /administrator/);
});
