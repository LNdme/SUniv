# Running SUniv on Azure

This directory provisions one Azure VM and runs SUniv on it. Use it when the machine you
have cannot carry the work — `npm install`, the texlive sandbox image, five services and
Postgres do not fit comfortably in a laptop.

Read [`FIRST-RUN.md`](../FIRST-RUN.md) first. This file covers only what is specific to
Azure, plus the things a first deployment runs into that are not written down anywhere
else.

## Read this before spending anything

Three limits shape what this can do. None of them is about Azure being a bad choice; they
are properties of the repository as it stands today.

### Azure is not a deployment target

`cli/src/providers.ts` fixes the set to `docker`, `fly`, `aws`, and
`cli/test/providers.test.ts` locks it with a negative test.
[`docs/deploy-directory.md`](../../../../docs/deploy-directory.md) puts runtime provider
loading outside contract v1. Adding an Azure provider means changing `cli/`, which is core;
in a fork that work goes upstream. So the VM runs the **`docker` target** — the one
`qm.config.jsonc` already declares.

### The agent computers do not run on the VM

`src/sandbox/local-sandbox.ts` drives sandboxes by shelling out to the `docker` CLI and
reaching them over `127.0.0.1`. `deploy/core/Dockerfile` ships no docker client, mounts no
socket, and runs as `USER node`. A containerized core cannot start sibling containers.

Under a `docker` target, **`sprites` is the only `sandbox.backend` that loads at all**:
`cli/src/config.ts` rejects everything except `sprites` and `aws`, and additionally
requires target `aws` for the latter. So the agent computers run on Fly Sprites, billed
outside your Azure credit. Everything else — control plane, Postgres, image builds, test
suites, the registry — stays on Azure.

`scripts/dev-instance.sh` is not a way around this: `up` needs a pool slot with valid
`xoxb-`/`xapp-` Slack tokens (`scripts/dev/lib/pool.ts`), and SUniv does not enable Slack.

### The published sandbox image is probably not what boots

This is the one to weigh most carefully, and it is **unverified in either direction**.

`qm sandbox publish` builds `deploy/layers/suniv/sandbox/Dockerfile` — the SUniv tools,
pandoc, texlive — pushes it, and records a digest pin. `cli/src/config.ts` then exports it
as `FLY_BASE_IMAGE`. But `grep -r FLY_BASE_IMAGE src/ plugins/` returns **nothing**, and
`src/sandbox/sprites-sandbox.ts` creates sprites through `createSprite(name)` with no image
parameter anywhere in the file. `materializeRoLayers` stages workspace files per scope, not
the layer's `tools/` and `skills/`.

So either Fly Sprites resolves the image out of band from the app named in `sandbox.app`,
or the seven `suniv-*` binaries are simply not present in the agent computer. Nothing in
this repository decides it. If it is the second, `FIRST-RUN.md` checks 1 and 4 (a tool
running in a real sandbox; pandoc producing a `.docx`) fail, and no amount of Azure work
fixes it — it is core work upstream.

Treat the first literature search as the experiment that settles it, and do not build a
schedule on the answer before you have it.

## Cost

Azure Retail Prices API, West Europe, Linux, pay-as-you-go. Check your own region.

| Resource  | Choice                            | Price                      |
| --------- | --------------------------------- | -------------------------- |
| VM        | `Standard_D4s_v5`, 4 vCPU / 16 GB | $0.23/hour                 |
| OS disk   | Premium SSD P10, 128 GB           | $21.68/month + $1.18 mount |
| Public IP | Standard, static                  | ~$3.60/month               |
| Registry  | ACR Basic                         | ~$5/month                  |

Around the clock: roughly **$200/month**, about 5 months of a $1000 credit. With the
nightly auto-shutdown: roughly **$110/month**. Compute stops billing while stopped, storage
does not.

`--spot` drops the VM to $0.0425/hour (~$31/month) but Azure can evict it at any moment.
The disk survives, so only the run in flight is lost. A poor trade during the texlive
build, a reasonable one afterwards.

Sizing follows the Fly templates: 2 GB each for core, web-ui and admin, 1 GB for portal,
512 MB for auth — about 8 GB before Postgres, the sandbox image and Docker's build cache.

**x86_64 is required.** `scripts/local-sandbox-build.sh` hardcodes `linux/amd64`;
`provision.sh` refuses an Arm SKU.

## Provisioning

```bash
az login --use-device-code
cd deploy/layers/suniv/azure

./provision.sh --dry-run
./provision.sh
```

The dry run checks SKU, region, vCPU quota and registry-name availability and creates
nothing. The real run creates a resource group, a network security group, a static public
IP with a DNS label, an Azure Container Registry and the VM.

The security group opens **22 to your current public IP only**, plus 80 and 443 for the
ACME challenge and browser access. Service ports 8080-8083 stay closed: the portal is the
only front door, as [`deploy/README.md`](../../../README.md) requires. Pass
`--admin-ip <cidr>` when your address changes, or `--admin-ip any` to drop the restriction
— that exposes SSH to the Internet, though `--generate-ssh-keys` also disables password
authentication.

If your subscription has never used DevTest Labs, the auto-shutdown schedule fails. The
script says so and continues rather than dying with everything already created:

```bash
az provider register --namespace Microsoft.DevTestLab
```

**The nightly shutdown will kill a long build.** The first sandbox image build takes hours.
Start it early in the day, or pass `--no-shutdown` until it has finished.

Wait for cloud-init before doing anything else:

```bash
ssh suniv@<ip> 'cloud-init status --wait && cat /var/log/suniv-toolchain.log'
```

It installs Node 24, Docker CE with Buildx, Caddy, the Azure CLI, Claude Code and 8 GB of
swap, and puts the sudo users in the `docker` group. **Log out and back in once** before
running Docker, or the group membership has not taken effect.

## Three config edits

`qm.config.jsonc` as committed does not boot — on Azure or anywhere else. `first-run.sh`
checks all three and stops with the reason; it does not edit the file for you.

```jsonc
"publicUrl": "https://<your-host>",

"env": {
  "core": { "HARNESS": "pi", "SANDBOX_BACKEND": "sprites" },
  "auth": { "AUTH_EMAIL_TRANSPORT": "resend" },
},

"sandbox": {
  "app": "suniv-sandboxes",
  "backend": "sprites",
  "env": { "SUNIV_CONTACT_EMAIL": "..." },
},
```

**`publicUrl`** — the `auth` broker builds its emailed sign-in links from it. A `localhost`
value locks out everyone, including you.

**`sandbox.backend`** — `deploy/core/Dockerfile` sets `NODE_ENV=production` and
`src/config.ts` refuses to start without an explicit `SANDBOX_BACKEND`, which
`cli/src/config.ts` derives only from this field or from a `fly` target.

**`env.core.SANDBOX_BACKEND`** — needed _as well_, and easy to miss. `cli/src/secrets.ts`
gates `SPRITES_TOKEN` on `env.core.SANDBOX_BACKEND`, and under a `docker` target nothing
supplies a default. Without it `qm setup` never asks for the token, `qm check` never
reports it missing, `qm up` succeeds, and core dies at startup on
`SANDBOX_BACKEND=sprites requires SPRITES_TOKEN`.

You will also need `SPRITES_TOKEN` in `deploy/layers/suniv/.env`.

## The sandbox base image needs a digest pin

`deploy/layers/suniv/sandbox/Dockerfile` starts `FROM qm-sandbox-base:dev`, a local tag.
`qm sandbox publish` resolves a non-digest base by running `docker pull`, which sends that
tag to Docker Hub and fails with `pull access denied`. A locally built image does not
satisfy it, and `--from` is ignored when the Dockerfile sets its own `FROM`
(`cli/src/commands/sandbox.ts`).

`first-run.sh --acr <name>` pushes the locally built base to your registry, reads back its
digest and stops with the exact line to paste:

```
FROM <registry>.azurecr.io/qm-sandbox-base@sha256:<digest>
```

Put that in the layer Dockerfile, commit it, then re-run with `--skip-sandbox-build`. The
script deliberately does not rewrite that file: which image a deployment boots is a
decision that belongs in a commit you own.

## Bringing it up

```bash
git clone <your-fork> suniv && cd suniv
./deploy/layers/suniv/azure/first-run.sh --checks-only
./deploy/layers/suniv/azure/first-run.sh --acr <registry-name>
```

`qm sandbox publish` takes any `registry/repository` and only authenticates against Fly for
a `registry.fly.io` reference, so the image lives in ACR.

If `provision.sh` granted `AcrPush` to the VM's managed identity, use it with
`az login --identity` on the VM; otherwise `az login --use-device-code` pushes with your
own rights.

`--build-from` is mandatory in the `up` step: this checkout's image manifest points at
`registry.invalid` with a dummy digest.

## TLS

```bash
sudo cp deploy/layers/suniv/azure/Caddyfile /etc/caddy/Caddyfile
sudo systemctl edit caddy --full
```

Set `SUNIV_PUBLIC_HOST` and `SUNIV_ACME_EMAIL` in the unit environment, then
`sudo systemctl restart caddy`. Both must be set: unset, the Caddyfile does not parse.
Caddy proxies to the portal on `127.0.0.1:8081` — base port 8080 plus the portal's
`hostPortOffset` of 1, per `cli/src/services.ts`.

Neither `nip.io`, `sslip.io` nor `cloudapp.azure.com` is on the Public Suffix List, so
Let's Encrypt counts issuance per shared registered domain and `nip.io` in particular is
often exhausted. Caddy falls back to ZeroSSL on its own, which usually rescues it. If
issuance still fails, point a domain you own at the IP and change the one hostname line.

An SSH tunnel is the right answer while you are the only user:

```bash
ssh -L 8081:127.0.0.1:8081 suniv@<ip>
```

But note it does not compose with the `auth` broker — emailed links carry `publicUrl`, and
`first-run.sh` requires that to be a public HTTPS origin. The tunnel is for looking at a
deployment that is already configured for its real hostname, not a substitute for one.

## Debugging

Claude Code is installed by cloud-init. Run `claude` from the checkout and it has the logs,
the containers and the source together. An agent session elsewhere cannot SSH in.

```bash
node cli/bin/qm.ts status  --config deploy/layers/suniv/qm.config.jsonc
node cli/bin/qm.ts logs core --follow --config deploy/layers/suniv/qm.config.jsonc
node cli/bin/qm.ts outputs --config deploy/layers/suniv/qm.config.jsonc
```

The admin panel is the real observation surface: sessions, LLM transcripts, the error log,
the audit log, and the files an agent wrote inside a sandbox. Inside a sandbox session,
`suniv-doc check` and `suniv-<tool> --status` report which credential is missing.

## Egress is not enforced

`SPRITES_EGRESS_PROXY_URL` is unset here, and `src/config.ts` warns at boot that sandboxes
then run with **no egress enforcement, fail-open**. For a deployment intended for students
that is a posture worth deciding on deliberately rather than inheriting. Enforcing it means
deploying `deploy/egress-proxy/` and pointing that variable at it.

## Stopping and deleting

```bash
az vm deallocate -g suniv-rg -n suniv-vm
az vm start      -g suniv-rg -n suniv-vm
az group delete  --name suniv-rg --yes
```

Deallocating stops compute billing; the disk keeps billing. Deleting the group destroys
everything, including the registry and the Postgres volume inside the VM. There is no
snapshot unless you take one.
