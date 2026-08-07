# QM deployment

This directory is one QM deployment: a config, a secret contract, and a
sandbox layer that customizes the agent without forking the core images. Commit
everything here except `.env`, which holds the secret values and is covered by
the scaffolded `.gitignore`.

## Where the documentation lives

- `package.json` pins the exact CLI version this directory is interpreted by,
  so every checkout resolves the same `qm`. `contract` in the config is only
  the coarse compatibility floor; this pin is the reproducible one. Upgrade it
  deliberately and re-run `qm check` afterwards.
- `qm.config.jsonc` describes what to run. Every field carries a comment
  explaining it, including the full list of services, so read the file itself
  before changing it. It is JSON with comments (the `tsconfig.json` dialect).
  That applies only to the config: `tool.json` files must stay strict JSON.
- `.env.example` is the secret catalog. It lists every secret the platform
  knows, what each one is for, what enables it, and the command that produces a
  value when one exists. The secrets the current config needs appear uncommented.
  `qm init` creates a gitignored `.env`, generates its local signing
  keys, and leaves provider credentials blank for you to fill in. Never write a
  secret value into any other file.
- `slack-app-manifest.yml` creates the optional qm bot app. Slack OIDC
  deployments also get `slack-sso-manifest.yml`. Run
  `npm exec qm -- slack render` after changing `publicUrl`, then
  `npm exec qm -- outputs` for creation links.

## Customizing the sandbox

`sandbox/` defines what the agent gets in its execution environment:

- A skill is `sandbox/skills/<id>/SKILL.md`: markdown with `name` and
  `description` frontmatter that teaches the agent a workflow and when to use it.
- A tool is `sandbox/tools/<id>/tool.json`: a descriptor whose minimal form is
  `{ "id": ..., "advertise": ..., "install": { "binary": ... } }`, with the
  executable next to it when the binary is not already in the base image.
- `sandbox/Dockerfile` is optional and only needed for system packages or
  runtimes.

The scaffold's `greet` skill and `example-tool` have been replaced by SUniv's own;
`sandbox/README.md` describes what is there and why.

## Testing the tools

```bash
npm test
```

Run it before every commit, and **add a case with every tool change**. Nothing
else looks at this code: the repository's `eslint.config.mjs` ignores
`deploy/layers/`, and `oxlint` only covers `src plugins scripts cli test`. This
suite is the whole safety net for the layer.

`test/` sits outside `sandbox/` deliberately — `qm up` uploads the sandbox tree
to the core, and test fixtures have no business being delivered to an agent.

Each test runs a real tool as a subprocess with `node --import test/fetch-stub.mjs`,
which replaces `globalThis.fetch` with fixture responses and records every call
made. Nothing about a tool's shape has to change to be testable, and the whole
path is exercised — argument parsing, HTTP, response parsing, output — rather
than functions in isolation. The recorded calls are what let a test assert that a
refusal contacted nothing, or that a group library was addressed under `/groups/`.

Most cases stub `fetch`. Three files do not: `doc.test.mjs` and `lib.test.mjs`
run the real `pandoc` and `pdftotext`, and `fixtures/make-pdf.mjs` writes a real
multi-page PDF in pure JavaScript so they have something to read. Those tests
prove the behaviour rather than the shape of a response, so prefer them wherever
a tool shells out to a binary instead of to an API.

Three cases are load-bearing and must not be deleted:

- **a record without a DOI survives deduplication.** It once did not: `""` is not
  nullish, so `??` let an empty DOI stand in for a found index and every
  identifier-less record was dropped. That silently hid every preprint, which is
  exactly what `disclosure-guard` and `prior-art-scan` need to see.
- **a publisher landing page is not full text.** Treating any link as full text
  once marked every paywalled article as retrievable, which defeats the grounding
  ladder that `citation-integrity` rests on.
- **`suniv-msoffice write` refuses and contacts nothing.** Microsoft Graph
  replaces a `.docx` whole and returns `423 Locked` while anyone has it open, so
  a write attempt against a shared thesis destroys a supervisor's annotations.
  If that test ever starts passing against a real write path, the tool has grown
  a feature it must not have.

## The workflow

Run every command from this directory.

1. `npm exec qm -- check` validates the config and the sandbox layer and prints the
   secret names the config currently requires. It builds nothing, and when
   credential values are already present in `.env` it also verifies them
   against their providers, so run it after every edit.
2. `npm exec qm -- plan` reports what deployment would do
   without changing anything.
3. After the target prerequisites are complete, `npm exec qm -- up` brings the
   deployment up and prints the URLs. An AWS directory must first complete the
   edge and authenticated-portal steps in its AWS bootstrap section below.
   `--build-from <path to a QM checkout>` is reserved for contributors
   testing unreleased runtime code.
4. `npm exec qm -- status`, `npm exec qm -- logs [service]`, and
   `npm exec qm -- down` show
   what is running, tail logs, and stop the deployment.
5. `npm exec qm -- secrets push` uploads the `.env` values to the deploy target.
   The docker target reads `.env` directly and does not need it.

`npm exec qm -- help` lists everything else, including `sandbox build` and
`rollback`.
