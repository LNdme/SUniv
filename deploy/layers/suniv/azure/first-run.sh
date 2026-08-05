#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
layer_dir="$(cd "$here/.." && pwd)"
repo_root="$(cd "$layer_dir/../../.." && pwd)"
config_path="$layer_dir/qm.config.jsonc"
config_rel="deploy/layers/suniv/qm.config.jsonc"

ACR_NAME="${SUNIV_ACR_NAME:-}"
SANDBOX_REPOSITORY="${SUNIV_SANDBOX_REPOSITORY:-suniv-sandbox}"
MIN_FREE_GB="${SUNIV_MIN_FREE_GB:-40}"
SKIP_SANDBOX_BUILD=0
STOP_AFTER_CHECKS=0

die() {
  printf '\nfirst-run: %s\n' "$*" >&2
  exit 1
}

say() { printf '  %s\n' "$*"; }
section() { printf '\n== %s\n' "$*"; }
ok() { printf '  ok  %s\n' "$*"; }

usage() {
  cat <<'EOF'
first-run.sh — bring SUniv up on this machine, following FIRST-RUN.md

  --acr <name>            Azure Container Registry that holds the sandbox image
  --repository <name>     repository inside the registry (default suniv-sandbox)
  --skip-sandbox-build    reuse the qm-sandbox-base:dev image already on this host
  --checks-only           run the preflight checks and stop
  -h, --help              this text

Run it from anywhere; it operates on the repository it lives in.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --acr) ACR_NAME="${2:?--acr needs a value}"; shift 2 ;;
    --repository) SANDBOX_REPOSITORY="${2:?--repository needs a value}"; shift 2 ;;
    --skip-sandbox-build) SKIP_SANDBOX_BUILD=1; shift ;;
    --checks-only) STOP_AFTER_CHECKS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1 (try --help)" ;;
  esac
done

cd "$repo_root"

section "Preflight"

[ -f "$repo_root/cli/bin/qm.ts" ] || die "this does not look like the SUniv repository: cli/bin/qm.ts is missing"
[ -f "$config_path" ] || die "config not found: $config_path"
ok "repository root $repo_root"

machine="$(uname -m)"
case "$machine" in
  x86_64|amd64) ok "architecture $machine" ;;
  *) die "architecture is $machine — scripts/local-sandbox-build.sh hardcodes linux/amd64, so the sandbox image would build under QEMU emulation. Use an x86_64 machine." ;;
esac

command -v node >/dev/null 2>&1 || die "node is not on PATH"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 24 ] || die "Node $node_major is too old — the qm CLI requires Node 24 or newer (package.json engines: >=24.15.0)"
ok "node $(node --version)"

command -v docker >/dev/null 2>&1 || die "docker is not on PATH"
docker version -f '{{.Server.Version}}' >/dev/null 2>&1 ||
  die "the Docker daemon is not reachable — 'sudo systemctl start docker', and check you are in the docker group (log out and back in after usermod)"
ok "docker $(docker version -f '{{.Server.Version}}')"

free_gb="$(df -Pk "$repo_root" | awk 'NR==2 {print int($4/1048576)}')"
[ "$free_gb" -ge "$MIN_FREE_GB" ] ||
  die "only ${free_gb}GB free on this filesystem — the sandbox layer stacks a full texlive on the base image; allow at least ${MIN_FREE_GB}GB"
ok "${free_gb}GB free"

section "Deployment config"

config_stderr="$(mktemp)"
trap 'rm -f "$config_stderr"' EXIT

config_report="$(node --input-type=module -e '
import { loadConfigAt } from "./cli/src/config.ts";
try {
  const { config } = loadConfigAt(process.argv[1]);
  console.log(config.publicUrl);
  console.log(config.target);
  console.log(config.sandbox?.backend ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
' "$config_path" 2>"$config_stderr")" || die "$config_rel was rejected by the qm config loader:

     $(cat "$config_stderr")"

config_line() { printf '%s\n' "$config_report" | sed -n "${1}p"; }

public_url="$(config_line 1)"
target="$(config_line 2)"
sandbox_backend="$(config_line 3)"

say "target      $target"
say "publicUrl   $public_url"
say "sandbox     ${sandbox_backend:-<unset>}"

case "$public_url" in
  https://*) ok "publicUrl is a public HTTPS origin" ;;
  *localhost*|*127.0.0.1*)
    die "publicUrl is $public_url.
     The auth broker emails sign-in links built from this origin, so a localhost value
     locks everyone out — including you. Set it to the HTTPS origin Caddy serves, e.g.
       \"publicUrl\": \"https://<label>.<region>.cloudapp.azure.com\"
     in $config_rel" ;;
  *) die "publicUrl is $public_url — it must be an HTTPS origin for a real harness" ;;
esac

if [ -z "$sandbox_backend" ]; then
  die "sandbox.backend is unset in $config_rel.
     deploy/core/Dockerfile sets NODE_ENV=production, and src/config.ts refuses to boot
     without an explicit SANDBOX_BACKEND. cli/src/config.ts only derives it from
     sandbox.backend, or from a \"fly\" target — neither applies here, so core would
     exit at startup.
     Under the docker target \"sprites\" is the only value that loads: \"local\" is
     rejected by the config validator, and \"aws\" additionally requires target \"aws\".
     Set:
       \"sandbox\": { ..., \"backend\": \"sprites\" },
       \"env\": { \"core\": { ..., \"SANDBOX_BACKEND\": \"sprites\" } }
     Both are needed — the second is what makes qm setup ask for SPRITES_TOKEN.
     README.md explains the whole picture, including what sprites does not give you."
fi
[ "$sandbox_backend" = "sprites" ] || die "sandbox.backend is \"$sandbox_backend\"; under a docker target only \"sprites\" loads"
ok "sandbox backend sprites"

env_backend="$(node --input-type=module -e '
import { loadConfigAt } from "./cli/src/config.ts";
const { config } = loadConfigAt(process.argv[1]);
console.log(config.env?.core?.SANDBOX_BACKEND ?? "");
' "$config_path" 2>/dev/null || true)"

if [ "$env_backend" != "sprites" ]; then
  die "env.core.SANDBOX_BACKEND is not set to \"sprites\" in $config_rel.
     sandbox.backend alone is not enough. cli/src/secrets.ts gates SPRITES_TOKEN on
     env.core.SANDBOX_BACKEND, and under a docker target nothing supplies a default,
     so qm setup never asks for the token and qm check never reports it missing.
     The stack then deploys cleanly and core dies at startup on
     \"SANDBOX_BACKEND=sprites requires SPRITES_TOKEN\".
     Add:
       \"env\": { \"core\": { \"HARNESS\": \"pi\", \"SANDBOX_BACKEND\": \"sprites\" } }"
fi
ok "env.core.SANDBOX_BACKEND is sprites, so SPRITES_TOKEN is a required secret"

if [ "$STOP_AFTER_CHECKS" -eq 1 ]; then
  section "Checks passed. Stopping here as asked."
  exit 0
fi

section "Dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
ok "node modules installed"

if [ "$SKIP_SANDBOX_BUILD" -eq 0 ]; then
  section "Sandbox base image"
  say "this builds fly/Dockerfile then local/Dockerfile; the texlive layer makes it slow"
  npm run sandbox:local:build
  ok "qm-sandbox-base:dev built"
else
  section "Sandbox base image"
  docker image inspect qm-sandbox-base:dev >/dev/null 2>&1 ||
    die "--skip-sandbox-build was given but qm-sandbox-base:dev is not on this host"
  ok "reusing qm-sandbox-base:dev"
fi

section "Secrets"
if [ -f "$layer_dir/.env" ]; then
  ok ".env already present — leaving it alone"
  say "to revisit it: node cli/bin/qm.ts setup deploy/layers/suniv"
else
  say "walking the deployment secrets; FIRST-RUN.md lists which ones block start-up"
  node cli/bin/qm.ts setup deploy/layers/suniv
fi

section "Static check"
node cli/bin/qm.ts check --config "$config_path"

section "Sandbox layer image"

layer_dockerfile="$layer_dir/sandbox/Dockerfile"
layer_base="$(sed -n 's/^FROM  *\([^ ]*\).*/\1/p' "$layer_dockerfile" | head -n1)"
say "layer base  $layer_base"

case "$layer_base" in
  *@sha256:*) ok "the layer base is digest-pinned, so publish will not try to resolve it" ;;
  *)
    [ -n "$ACR_NAME" ] || die "the layer base is the local tag \"$layer_base\", and no --acr was given.
     qm sandbox publish resolves a non-digest base by running 'docker pull', which sends
     \"$layer_base\" to Docker Hub and fails with 'pull access denied' — a local tag does
     not satisfy it (cli/src/commands/sandbox.ts, pinnedByPull).
     Re-run with --acr <registry-name> so the base can be pushed and pinned first.
     --from will not help: publish ignores it when sandbox/Dockerfile sets its own FROM."

    command -v az >/dev/null 2>&1 || die "--acr was given but the Azure CLI is not on PATH"
    az acr login --name "$ACR_NAME" >/dev/null ||
      die "could not sign in to $ACR_NAME — run 'az login --use-device-code' (or 'az login --identity' on the VM) first"
    ok "signed in to $ACR_NAME.azurecr.io"

    base_ref="$ACR_NAME.azurecr.io/qm-sandbox-base"
    say "pushing $layer_base to $base_ref so it can be pinned by digest"
    docker tag "$layer_base" "$base_ref:dev"
    docker push "$base_ref:dev"
    base_digest="$(docker image inspect --format '{{index .RepoDigests 0}}' "$base_ref:dev" 2>/dev/null || true)"
    [ -n "$base_digest" ] || die "pushed $base_ref:dev but could not read its digest back"
    ok "base pinned at $base_digest"

    die "the layer Dockerfile still starts from a local tag. Change its first line to:

       FROM $base_digest

     in deploy/layers/suniv/sandbox/Dockerfile, then re-run this script with
     --skip-sandbox-build. This script does not edit that file for you: the pin is a
     deployment decision that belongs in a commit you control." ;;
esac

if [ -n "$ACR_NAME" ]; then
  command -v az >/dev/null 2>&1 || die "--acr was given but the Azure CLI is not on PATH"
  az acr login --name "$ACR_NAME" >/dev/null || die "could not sign in to $ACR_NAME"
  node cli/bin/qm.ts sandbox publish --config "$config_path" --app "$ACR_NAME.azurecr.io/$SANDBOX_REPOSITORY"
else
  say "no --acr given; publishing to the registry implied by sandbox.app in the config"
  node cli/bin/qm.ts sandbox publish --config "$config_path"
fi

say "note: publishing records the pin, but nothing in src/ reads FLY_BASE_IMAGE and the"
say "sprites backend creates sprites by name alone — see the sandbox image section of README.md"

section "Bring it up"
say "--build-from is required: this checkout's image manifest is a placeholder"
node cli/bin/qm.ts up --config "$config_path" --build-from

section "Status"
node cli/bin/qm.ts status --config "$config_path"
node cli/bin/qm.ts outputs --config "$config_path"

section "Next"
say "Work through the checklist in deploy/layers/suniv/FIRST-RUN.md, in its order."
say "The first item — a tool running in a real sandbox — is the one that proves the most."
say "Logs: node cli/bin/qm.ts logs [service] --config $config_rel"
