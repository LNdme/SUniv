# Running SUniv on Azure

This directory provisions one Azure VM and runs SUniv on it. Use it when the machine you
have cannot carry the build — `npm install`, the texlive sandbox image, five services and
Postgres do not fit comfortably in a laptop.

Read [`FIRST-RUN.md`](../FIRST-RUN.md) first. This file covers only what is specific to
Azure.

## What you should know before spending anything

**Azure is not a deployment target of the `qm` CLI.** `cli/src/providers.ts` fixes the set
to `docker`, `fly`, `aws`, and `cli/test/providers.test.ts` locks it with a negative test.
Adding an Azure provider means changing `cli/`, which is core: in a fork that work belongs
upstream, not here. So the VM runs the **`docker` target** — the same target
`qm.config.jsonc` already declares.

**The agent computers do not run on Azure.** This is the real limit, and it is worth
understanding rather than discovering:

- `src/sandbox/local-sandbox.ts` drives sandboxes by shelling out to the `docker` CLI and
  talking to them over `127.0.0.1`;
- `deploy/core/Dockerfile` ships no docker client, mounts no socket, and runs as `USER node`.

A containerized core therefore cannot start sibling containers, and `sandbox.backend`
must be `sprites` (Fly's hosted microVMs) or `aws`. Everything else — the control plane,
Postgres, the image builds, the test suites, the registry — runs on Azure and bills against
your Azure credit. Only sandbox _execution_ leaves.

`scripts/dev-instance.sh` is not a way around this. Its `up` requires a working Slack app
slot: `scripts/dev/lib/pool.ts` validates `xoxb-`/`xapp-` prefixes, then the boot opens a
Socket Mode connection and posts a canary message it waits to receive back. SUniv does not
use Slack, so that path is closed.

The way to remove the Fly dependency is an `azure-sandbox` backend in `src/sandbox/`,
implementing the `Sandbox` interface over Azure Container Instances and registered in
`src/wiring.ts`. That is core work, and it belongs upstream.

## Cost

Prices from the Azure Retail Prices API, West Europe, Linux, pay-as-you-go. Check your own
region before committing.

| Resource  | Choice                            | Price                      |
| --------- | --------------------------------- | -------------------------- |
| VM        | `Standard_D4s_v5`, 4 vCPU / 16 GB | $0.23/hour                 |
| OS disk   | Premium SSD P10, 128 GB           | $21.68/month + $1.18 mount |
| Public IP | Standard, static                  | ~$3.60/month               |
| Registry  | ACR Basic                         | ~$5/month                  |

Running around the clock: roughly **$200/month**, about 5 months of a $1000 credit. With
the nightly auto-shutdown this script installs, roughly **$110/month** — compute stops
billing while stopped, storage does not.

`--spot` drops the same VM to $0.0425/hour (~$31/month), but Azure can evict it at any
time. The disk survives an eviction, so nothing is lost except the run in flight. It is a
poor trade during the multi-gigabyte texlive build and a reasonable one afterwards.

Sizing is not arbitrary: the Fly templates ask for 2 GB each for core, web-ui and admin,
1 GB for portal and 512 MB for auth. That is about 8 GB before Postgres, the sandbox base
image and Docker's build cache.

**x86_64 is required.** `scripts/local-sandbox-build.sh` hardcodes `linux/amd64`, so an Arm
size builds the sandbox image under QEMU. `provision.sh` refuses an Arm SKU.

## Provisioning

```bash
az login --use-device-code
cd deploy/layers/suniv/azure

./provision.sh --dry-run
./provision.sh
```

The dry run checks the SKU, the region, your vCPU quota and the registry name, and creates
nothing. The real run creates a resource group, a network security group, a static public
IP with a DNS label, an Azure Container Registry, and the VM.

The security group opens **22 to your current public IP only**, and 80 and 443 to the
Internet — 80 and 443 are needed for the ACME challenge and for browser access. The
service ports 8080-8083 stay closed: the portal is the only front door, as
[`deploy/README.md`](../../README.md) requires.

Pass `--admin-ip <cidr>` if your address changes, or `--admin-ip any` to drop the SSH
restriction. Doing so exposes SSH to the Internet; prefer re-running the script from the
new location.

When it finishes it prints the SSH command, the Azure FQDN, an sslip.io name and the
registry. Wait for cloud-init before doing anything else:

```bash
ssh suniv@<ip> 'cloud-init status --wait && cat /var/log/suniv-toolchain.log'
```

`cloud-init.yaml` installs Node 24, Docker CE with Buildx, Caddy, the Azure CLI, Claude
Code and 8 GB of swap, and puts the admin user in the `docker` group. **Log out and back in
once** before running Docker, or the group membership will not have taken effect.

## The two config edits

`qm.config.jsonc` as committed does not boot — on Azure or anywhere else. Two values must
change:

```jsonc
"publicUrl": "https://<your-host>",

"sandbox": {
  "app": "suniv-sandboxes",
  "backend": "sprites",
  "env": { "SUNIV_CONTACT_EMAIL": "..." },
},
```

`publicUrl` matters because the `auth` broker builds its emailed sign-in links from it; a
`localhost` value locks out everyone, including you.

`sandbox.backend` matters because `deploy/core/Dockerfile` sets `NODE_ENV=production` and
`src/config.ts` refuses to start without an explicit `SANDBOX_BACKEND`, while
`cli/src/config.ts` only derives that variable from `sandbox.backend` or from a `fly`
target. Neither applies to a `docker` target, so core exits at startup.

`first-run.sh` checks both and stops with the reason rather than letting you discover it
from a crash loop. It does not edit the file for you.

You will also need `SPRITES_TOKEN` in `deploy/layers/suniv/.env`.

## Bringing it up

On the VM:

```bash
git clone <your-fork> suniv && cd suniv
./deploy/layers/suniv/azure/first-run.sh --checks-only
./deploy/layers/suniv/azure/first-run.sh --acr <registry-name>
```

With `--acr`, the sandbox image is pushed to your Azure Container Registry —
`qm sandbox publish` accepts any `registry/repository` and only reaches for Fly
authentication when the reference is `registry.fly.io`. The image stays on Azure even
though execution does not.

The script runs the `FIRST-RUN.md` sequence: dependencies, the sandbox base image,
`qm setup` for secrets, `qm check`, `qm sandbox publish`, then `qm up --build-from`.
`--build-from` is mandatory here because this checkout's image manifest is a placeholder
pointing at `registry.invalid`.

Expect the sandbox base image build to take a long time and most of the disk budget.

## TLS

Put the public hostname in front of Caddy:

```bash
sudo cp deploy/layers/suniv/azure/Caddyfile /etc/caddy/Caddyfile
sudo systemctl edit caddy --full
```

Set `SUNIV_PUBLIC_HOST` and `SUNIV_ACME_EMAIL` in the unit environment, then
`sudo systemctl restart caddy`. Caddy proxies to the portal on `127.0.0.1:8081` — base port
8080 plus the portal's offset of 1, per `cli/src/services.ts`.

**A caveat you should hear before you rely on it.** Neither `nip.io`, `sslip.io` nor
`cloudapp.azure.com` is on the Public Suffix List. Let's Encrypt counts its issuance limits
per registered domain, so every user of those services shares one bucket, and `nip.io` in
particular is often exhausted. Caddy falls back from Let's Encrypt to ZeroSSL on its own,
which usually rescues it. If issuance still fails you have two good options: point a domain
you own at the IP and change the one hostname line, or skip public exposure entirely and
reach the portal through an SSH tunnel:

```bash
ssh -L 8081:127.0.0.1:8081 suniv@<ip>
```

The tunnel is also the right answer while you are still the only user.

## Debugging

Claude Code is installed on the VM by cloud-init. Run `claude` from the repository
checkout and it has the logs, the containers and the source in one place. This is the
supported path: an agent session elsewhere cannot SSH in.

Useful from the repository root:

```bash
node cli/bin/qm.ts status  --config deploy/layers/suniv/qm.config.jsonc
node cli/bin/qm.ts logs core --follow --config deploy/layers/suniv/qm.config.jsonc
node cli/bin/qm.ts outputs --config deploy/layers/suniv/qm.config.jsonc
```

The admin panel is the real observation surface — sessions, LLM transcripts, the error log,
the audit log, and the files an agent wrote inside a sandbox. Inside a sandbox session,
`suniv-doc check` and `suniv-<tool> --status` report which credential is missing.

## Stopping and deleting

```bash
az vm deallocate -g suniv-rg -n suniv-vm
az vm start      -g suniv-rg -n suniv-vm
az group delete  --name suniv-rg --yes
```

Deallocating stops compute billing; the disk keeps billing. Deleting the group destroys
everything, including the registry and the Postgres volume inside the VM. There is no
snapshot unless you take one.
