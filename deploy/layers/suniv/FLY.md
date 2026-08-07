# Deploying SUniv on Fly

[`FIRST-RUN.md`](./FIRST-RUN.md) is the local docker runbook. This one is for the
fly target, and it exists for one reason: **most of it needs no Docker daemon on
your machine.** `fly deploy --remote-only` builds every service image on Fly's
builder, so a laptop, a Codespace or a CI runner is enough.

One step is the exception, and knowing which one saves an evening.

## What still needs Docker, and where to get it

`qm sandbox publish` shells out to `docker buildx`
(`cli/src/commands/sandbox.ts`). It is the command that builds the agent
computer — pandoc, poppler, latexmk and the seven `suniv-*` binaries — pushes it,
and records the digest agents boot from. Both the docker and fly targets require
that image: `requiresSandboxApp` in `cli/src/commands/check.ts` makes
`sandbox.app` mandatory on both, and `up` refuses to render core until
`sandbox.image` is pinned.

So build it where Docker already exists. `.github/workflows/suniv-sandbox-image.yml`
does exactly that on a GitHub runner, and prints the two lines to paste back into
`qm.config.fly.jsonc`. Run it from the Actions tab; it is `workflow_dispatch`
only, because it pushes to a registry and that should be a deliberate act.

Everything else in this file runs anywhere.

## What Fly does not solve

Scopus and IEEE keys stay bound to the subscribing institution's IP ranges. From
a Fly machine the outbound address is a datacenter in Paris, not the campus, so a
perfectly valid key returns an authentication error. `suniv-indexed` reports that
as the location problem it is. Those two sources only work from a student's own
machine or their institutional VPN — which is the argument for the desktop phase,
not something a deployment target can fix.

## Costs, before you start

A SUniv deployment is six Fly apps — `suniv-core`, `suniv-web-ui`, `suniv-auth`,
`suniv-admin`, `suniv-portal` and `suniv-sandboxes` — plus a Managed Postgres
cluster on the basic plan and a private Tigris bucket. Fly bills per machine-hour
and requires a payment method. `qm down --config $CFG` scales the apps to zero,
which stops the machine charges; the Postgres cluster and the bucket persist
until you delete them yourself.

Treat this as a real, small, recurring bill rather than a free tier.

## Before sitting down

Everything in FIRST-RUN.md's "twenty minutes of forms" still applies — the five
free API keys, the model provider key, and Resend or SMTP for the sign-in links.

Fly adds three things:

1. A Fly account with a payment method, and `flyctl` installed
   (`curl -L https://fly.io/install.sh | sh`).
2. A **deploy token** for the sandbox app, stored as the repository secret
   `FLY_API_TOKEN` so the workflow can push the image, and in `.env` as
   `FLY_SANDBOX_API_TOKEN` so `qm` can:

   ```bash
   fly tokens create deploy --app suniv-sandboxes --expiry 8760h
   ```

3. The apps themselves. `qm up` creates the service apps, but **not** the sandbox
   app — nothing creates infrastructure behind your back:

   ```bash
   fly apps create suniv-sandboxes --org personal
   ```

`flyOrg` in `qm.config.fly.jsonc` is `personal`, the org every Fly account has.
Change both it and the `--org` above together if you create a dedicated one.

## The sequence

Run every command from the repository root. Node 24 or newer; `npm exec qm` does
not work in a source checkout, so the CLI is invoked by path.

```bash
npm install
CFG=deploy/layers/suniv/qm.config.fly.jsonc
```

**1. Collect the secrets** — once for both targets, since the two configs share
one `.env`:

```bash
node cli/bin/qm.ts setup deploy/layers/suniv
node cli/bin/qm.ts check --config $CFG
```

`check` lists fifteen required secrets here — the fourteen from the docker target
plus `FLY_SANDBOX_API_TOKEN`. It also warns that no sandbox image is pinned yet.
That warning is expected until step 2.

**2. Build the agent computer.** Either run the GitHub workflow and paste its two
lines into `sandbox` in `$CFG`, or, on a machine with Docker:

```bash
FLY_SANDBOX_APP_NAME=suniv-sandboxes npm run sandbox:local:build
node cli/bin/qm.ts sandbox publish --config $CFG
```

The first command builds `fly/Dockerfile` on Fly's remote builder and pushes it
as `registry.fly.io/suniv-sandboxes:dev` — which is what this layer's
`sandbox/Dockerfile` names in its `FROM`. The second stacks the SUniv layer on
it and records `sandbox.image` and `sandbox.baseImage` in `$CFG`. Commit that
change: it is the deployment's record of what agents actually run.

**3. Push the secrets, then bring it up:**

```bash
node cli/bin/qm.ts secrets push --config $CFG
node cli/bin/qm.ts up --config $CFG --build-from
```

Unlike the docker target, which reads `.env` directly, Fly needs the values
staged on each app first. `--build-from` is as mandatory here as it is locally:
this checkout's image manifest is a placeholder (`registry.invalid`), so service
images must be built from `deploy/<service>/Dockerfile` rather than pulled.

`up` creates the Managed Postgres cluster and the Tigris bucket on the first run.
If Tigris reports the bucket name is taken, change `env.core.S3_BUCKET` in `$CFG`
— those names are global.

**4. Confirm:**

```bash
node cli/bin/qm.ts status  --config $CFG
node cli/bin/qm.ts outputs --config $CFG
```

`publicUrl` is `https://suniv-portal.fly.dev`. The portal is the public front
door: on Fly it reverse-proxies to web-ui and admin over Flycast, and those two
apps get no public IP at all.

## Then what

[`FIRST-RUN.md`](./FIRST-RUN.md) has the list that matters — six checks in order
of what they prove, starting with the largest untested assumption in the whole
project: that the layer reaches the agent computer at all, and that a model
actually chooses to use it.

None of the commands in this file has been run end to end. They were derived by
reading `cli/src/backends/fly.ts` and `cli/src/commands/sandbox.ts` on a machine
with no Docker and no Fly account. `node cli/bin/qm.ts help` is authoritative
wherever the two disagree, and a correction here is worth more than a workaround.
