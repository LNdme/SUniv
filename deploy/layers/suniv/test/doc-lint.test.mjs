import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync } from "node:fs";
import { runTool } from "./harness.mjs";

const FIXTURE = "./fixtures/empty.mjs";

test("suniv-doc lint parses markdown and tex citations and checks bibliography", () => {
  const sampleDoc = "/tmp/test_draft.md";
  const sampleBib = "/tmp/test_bib.json";

  writeFileSync(
    sampleDoc,
    `# Introduction\nWe build on [@Vaswani2017] and \\cite{Smith2024}. Note that [@Unknown2025] is invented.\nWe plan to upload to arXiv soon.`,
  );
  writeFileSync(
    sampleBib,
    JSON.stringify([
      {
        id: "Vaswani2017",
        title: "Attention Is All You Need",
        custom: { suniv: { grounding: "fulltext" } },
      },
      {
        id: "Smith2024",
        title: "Calibration Advances",
        custom: { suniv: { grounding: "abstract" } },
      },
    ]),
  );

  try {
    const { code, json } = runTool("suniv-doc", ["lint", "--input", sampleDoc, "--bib", sampleBib], { fixture: FIXTURE });
    assert.equal(code, 1);
    assert.equal(json.valid, false);
    assert.equal(json.citations.total, 3);
    assert.deepEqual(json.citations.unresolved, ["Unknown2025"]);
    assert.deepEqual(json.grounding.fulltext, ["Vaswani2017"]);
    assert.deepEqual(json.grounding.abstract, ["Smith2024"]);
    assert.equal(json.disclosureWarnings.length, 1);
    assert.match(json.disclosureWarnings[0].message, /disclosure-guard/);
  } finally {
    try {
      unlinkSync(sampleDoc);
      unlinkSync(sampleBib);
    } catch {}
  }
});

test("suniv-doc lint passes when all citations are resolved with fulltext", () => {
  const sampleDoc = "/tmp/test_valid_draft.md";
  const sampleBib = "/tmp/test_valid_bib.json";

  writeFileSync(sampleDoc, `Recent findings by [@Vaswani2017] demonstrate strong results.`);
  writeFileSync(
    sampleBib,
    JSON.stringify([
      {
        id: "Vaswani2017",
        title: "Attention Is All You Need",
        custom: { suniv: { grounding: "fulltext" } },
      },
    ]),
  );

  try {
    const { code, json } = runTool("suniv-doc", ["lint", "--input", sampleDoc, "--bib", sampleBib], { fixture: FIXTURE });
    assert.equal(code, 0);
    assert.equal(json.valid, true);
    assert.equal(json.citations.unresolved.length, 0);
    assert.deepEqual(json.grounding.fulltext, ["Vaswani2017"]);
  } finally {
    try {
      unlinkSync(sampleDoc);
      unlinkSync(sampleBib);
    } catch {}
  }
});
