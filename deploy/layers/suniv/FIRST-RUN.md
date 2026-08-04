# First run

SUniv has never been started. Every tool has been exercised on its own, but the
core, the web UI, the sign-in broker and the portal have not run once, no skill
has been executed by a model, and no tool has run inside a real sandbox through
`execute`. This is the session that changes that.

`deployment.md` covers the generic QM deployment. This file covers only what is
specific to SUniv or to this source checkout — the things that otherwise cost an
afternoon to rediscover.

## Before sitting down: twenty minutes of forms

Five free keys unlock half of what is currently unverifiable. None needs an
institution, and each takes two or three minutes.

| Key                                 | Where                                        | What it unlocks                                                                  |
| ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| `ZOTERO_API_KEY` + `ZOTERO_USER_ID` | zotero.org/settings/keys — tick write access | Filing references at all. Only the refusal path is tested today                  |
| `SEMANTIC_SCHOLAR_API_KEY`          | semanticscholar.org/product/api              | A source that currently returns 429 on every anonymous call                      |
| `CORE_API_KEY`                      | core.ac.uk/services/api                      | Open-repository coverage                                                         |
| `EPO_OPS_KEY` + `EPO_OPS_SECRET`    | developers.epo.org                           | Patent prior art, and the chance to check my EPO fixture against a real response |
| `PATENTSVIEW_API_KEY`               | patentsview.org/apis/keyrequest              | US patents                                                                       |

Also needed, and not free: an **Anthropic (or OpenAI/OpenRouter) key** for the
model, and a **Resend account or SMTP credentials** — the `auth` broker emails
the sign-in links, so without it nobody can log in, including you.

Institutional keys (Elsevier, IEEE) are worth collecting if you have them, but
note that a Scopus key is bound to the campus IP ranges: it will fail from any
machine that is not on the institution's network or VPN, however valid it is.

## The sequence

**Run the CLI from the repository root, not from this directory, and not through
`npm exec`.** `deploy/layers/README.md` states why: in a source checkout the
workspace symlink points at `cli/`, which is unbuilt, so `npm exec qm` fails.
Every command below is the form that actually works here — it is what produced
every `qm check` run in this repository's history.

Node 24 or newer is required; the CLI refuses to start on 22.

```bash
npm install                     # repository root
CFG=deploy/layers/suniv/qm.config.jsonc
```

**1. Build the sandbox base:**

```bash
npm run sandbox:local:build
```

This tags `qm-sandbox-base:dev` from `fly/Dockerfile`. `sandbox/Dockerfile`
stacks on that tag, so the layer image cannot build before it exists.

**2. Collect the secrets:**

```bash
node cli/bin/qm.ts setup deploy/layers/suniv
```

`setup` takes the deployment directory as a positional argument; every other
command below takes `--config`, which is a global flag.

It walks the fourteen secrets `qm check` lists. The ones that block start-up are
the model provider key, the `AUTH_*` set with `RESEND_API_KEY`, and the signing
secrets — `setup` generates the signing secrets itself. `AUTH_ALLOWED_EMAILS` is
the gate: put your own address there first, and an institution's mail domain
later when opening it up. Values land in the gitignored `deploy/layers/suniv/.env`.

**3. Validate, then build the agent computer:**

```bash
node cli/bin/qm.ts check --config $CFG
node cli/bin/qm.ts sandbox publish --config $CFG
```

**4. Bring it up — and `--build-from` is not optional here:**

```bash
node cli/bin/qm.ts up --config $CFG --build-from
```

This checkout's image manifest is a placeholder (`registry.invalid`, with a dummy
digest), because real digests only exist in the published `@yc-software/qm`
package. Without `--build-from`, `up` tries to pull images that do not exist. With
it, the service images build from `deploy/<service>/Dockerfile` in this repository.

**5. Confirm, then sign in:**

```bash
node cli/bin/qm.ts status --config $CFG
node cli/bin/qm.ts outputs --config $CFG   # prints the URLs
```

If a command rejects a flag, `node cli/bin/qm.ts help` is authoritative over this
file — none of these invocations has been run end to end, because the machine
that wrote them had no Docker daemon.

## What to check first, in order of what it would prove

The tools are already tested in isolation. What has never been observed is the
agent _choosing_ to use them, so exercise the judgement rather than the plumbing.

1. **A tool runs in a real sandbox.** Ask for a literature search on any topic.
   This proves the layer reached the agent computer at all — the single largest
   untested assumption.
2. **The grounding ladder holds in practice.** Ask about a paywalled article with
   no abstract. SUniv must say it cannot describe the method, and offer the DOI.
   If it answers anyway, the skills are not reaching the model, and nothing else
   in the product can be trusted until that is fixed.
3. **Citations resolve.** Ask for a short draft with references, then check every
   DOI. This is the release gate.
4. **The document chain.** Export to `.docx` with a bibliography. It works
   outside the sandbox; this proves pandoc made it into the image.
5. **`disclosure-guard` fires.** Say you are about to put a preprint on arXiv,
   with no patent filed. It should stop you and explain what Europe loses — then,
   told a filing exists, let it pass.
6. **The team path.** A second account, a shared project, one member filing into
   the group Zotero library and the other finding it.

## When something fails

`node cli/bin/qm.ts logs [service] --config $CFG` for a service, and
`suniv-doc check` or `suniv-<tool> --status` inside a sandbox session for a tool.
Most tools report
which credential is missing and where to get it, rather than failing blankly —
if one does not, that is a defect worth fixing rather than working around.

Run `npm test` here before committing anything. It is the layer's only safety
net: the repository's linters ignore `deploy/layers/`.
