import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CREDENTIAL_KEYS = [
  "ZOTERO_API_KEY",
  "ZOTERO_USER_ID",
  "ZOTERO_GROUP_ID",
  "ZOTERO_LOCAL_API",
  "ELSEVIER_API_KEY",
  "ELSEVIER_INSTTOKEN",
  "IEEE_API_KEY",
  "SERPAPI_API_KEY",
  "SEMANTIC_SCHOLAR_API_KEY",
  "CORE_API_KEY",
  "EPO_OPS_KEY",
  "EPO_SECRET",
  "EPO_OPS_SECRET",
  "PATENTSVIEW_API_KEY",
  "MSGRAPH_ACCESS_TOKEN",
  "SUNIV_CONTACT_EMAIL",
  "SUNIV_LIBRARY",
];

const stubPath = fileURLToPath(new URL("./fetch-stub.mjs", import.meta.url));

function toolPath(tool) {
  return fileURLToPath(new URL(`../sandbox/tools/${tool}/${tool}`, import.meta.url));
}

export function runTool(tool, args, { fixture, env = {} } = {}) {
  const callsFile = join(tmpdir(), `suniv-calls-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  const clean = { ...process.env };
  for (const key of CREDENTIAL_KEYS) delete clean[key];

  const nodeArgs = fixture ? ["--import", stubPath] : [];
  const result = spawnSync(process.execPath, [...nodeArgs, toolPath(tool), ...args], {
    encoding: "utf8",
    env: {
      ...clean,
      ...env,
      ...(fixture ? { SUNIV_TEST_FIXTURE: fileURLToPath(new URL(fixture, import.meta.url)) } : {}),
      SUNIV_TEST_CALLS: callsFile,
    },
  });

  let calls = [];
  try {
    calls = JSON.parse(readFileSync(callsFile, "utf8"));
    rmSync(callsFile, { force: true });
  } catch {
    calls = [];
  }

  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    json = undefined;
  }

  return { code: result.status, stdout: result.stdout, stderr: result.stderr, json, calls };
}
