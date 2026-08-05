#!/usr/bin/env bash
set -euo pipefail

LOCATION="${SUNIV_AZURE_LOCATION:-westeurope}"
PREFIX="${SUNIV_AZURE_PREFIX:-suniv}"
VM_SIZE="${SUNIV_AZURE_VM_SIZE:-Standard_D4s_v5}"
DISK_GB="${SUNIV_AZURE_DISK_GB:-128}"
ADMIN_USER="${SUNIV_AZURE_ADMIN_USER:-suniv}"
IMAGE_URN="Canonical:ubuntu-24_04-lts:server:latest"
SHUTDOWN_TIME="${SUNIV_AZURE_SHUTDOWN_TIME:-2200}"
SHUTDOWN_TZ="${SUNIV_AZURE_SHUTDOWN_TZ:-UTC}"
SUBSCRIPTION=""
ADMIN_IP=""
DNS_LABEL=""
ACR_NAME=""
USE_SPOT=0
DRY_RUN=0
NO_SHUTDOWN=0

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() {
  printf 'provision: %s\n' "$*" >&2
  exit 1
}

say() { printf '  %s\n' "$*"; }
section() { printf '\n== %s\n' "$*"; }

usage() {
  cat <<'EOF'
provision.sh — create the Azure VM that runs SUniv

  --location <region>        Azure region (default westeurope)
  --prefix <name>            resource name prefix (default suniv)
  --size <sku>               VM size (default Standard_D4s_v5, must be x86_64)
  --disk-gb <n>              OS disk size (default 128)
  --admin-ip <cidr|any>      source allowed to reach SSH (default: this machine's public IP)
  --dns-label <label>        Azure DNS label (default derived from the subscription)
  --acr-name <name>          container registry name (default derived from the subscription)
  --subscription <id>        Azure subscription (default: the CLI's current one)
  --spot                     provision as a Spot instance (cheap, evictable)
  --no-shutdown              skip the nightly auto-shutdown schedule
  --dry-run                  check quota, SKU and region, create nothing
  -h, --help                 this text

Read README.md before running this. It creates billable resources.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --location) LOCATION="${2:?--location needs a value}"; shift 2 ;;
    --prefix) PREFIX="${2:?--prefix needs a value}"; shift 2 ;;
    --size) VM_SIZE="${2:?--size needs a value}"; shift 2 ;;
    --disk-gb) DISK_GB="${2:?--disk-gb needs a value}"; shift 2 ;;
    --admin-ip) ADMIN_IP="${2:?--admin-ip needs a value}"; shift 2 ;;
    --dns-label) DNS_LABEL="${2:?--dns-label needs a value}"; shift 2 ;;
    --acr-name) ACR_NAME="${2:?--acr-name needs a value}"; shift 2 ;;
    --subscription) SUBSCRIPTION="${2:?--subscription needs a value}"; shift 2 ;;
    --spot) USE_SPOT=1; shift ;;
    --no-shutdown) NO_SHUTDOWN=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1 (try --help)" ;;
  esac
done

command -v az >/dev/null 2>&1 || die "the Azure CLI is not on PATH — https://aka.ms/azure-cli"
[ -f "$here/cloud-init.yaml" ] || die "cloud-init.yaml is missing next to this script"

case "$PREFIX" in
  [a-z]*) : ;;
  *) die "--prefix must start with a lowercase letter (it seeds DNS and registry names)" ;;
esac

if [ -n "$SUBSCRIPTION" ]; then
  az account set --subscription "$SUBSCRIPTION" || die "cannot select subscription $SUBSCRIPTION"
fi

SUBSCRIPTION_ID="$(az account show --query id -o tsv 2>/dev/null || true)"
[ -n "$SUBSCRIPTION_ID" ] || die "not signed in — run: az login --use-device-code"
SUBSCRIPTION_NAME="$(az account show --query name -o tsv 2>/dev/null || true)"

if command -v sha256sum >/dev/null 2>&1; then
  fingerprint="$(printf '%s' "$SUBSCRIPTION_ID" | sha256sum)"
else
  fingerprint="$(printf '%s' "$SUBSCRIPTION_ID" | shasum -a 256)"
fi
fingerprint="${fingerprint%% *}"
fingerprint="${fingerprint:0:8}"

RESOURCE_GROUP="${PREFIX}-rg"
VM_NAME="${PREFIX}-vm"
NSG_NAME="${PREFIX}-nsg"
IP_NAME="${PREFIX}-ip"
VNET_NAME="${PREFIX}-vnet"
SUBNET_NAME="${PREFIX}-subnet"
[ -n "$DNS_LABEL" ] || DNS_LABEL="${PREFIX}-${fingerprint}"
[ -n "$ACR_NAME" ] || ACR_NAME="${PREFIX}acr${fingerprint}"

arch="$(az vm list-skus --location "$LOCATION" --size "$VM_SIZE" --query "[?name=='$VM_SIZE'].capabilities[?name=='CpuArchitectureType'].value | [0] | [0]" -o tsv 2>/dev/null || true)"
case "$arch" in
  Arm64) die "$VM_SIZE is Arm64 — scripts/local-sandbox-build.sh hardcodes linux/amd64, so the sandbox image would build under QEMU. Pick an x86_64 size." ;;
  "") say "warning: could not read the CPU architecture of $VM_SIZE; make sure it is x86_64" ;;
  *) : ;;
esac

if [ -z "$ADMIN_IP" ]; then
  ADMIN_IP="$(curl -fsS --max-time 10 https://api.ipify.org 2>/dev/null || true)"
  [ -n "$ADMIN_IP" ] || die "could not detect this machine's public IP — pass --admin-ip <cidr> explicitly"
fi
if [ "$ADMIN_IP" = "any" ]; then
  SSH_SOURCE="Internet"
else
  SSH_SOURCE="$ADMIN_IP"
fi

PUBLIC_FQDN="${DNS_LABEL}.${LOCATION}.cloudapp.azure.com"

section "Plan"
say "subscription   $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
say "region         $LOCATION"
say "resource group $RESOURCE_GROUP"
say "vm             $VM_NAME  $VM_SIZE  ${DISK_GB}GB Premium SSD$([ "$USE_SPOT" -eq 1 ] && printf ' (Spot)')"
say "registry       $ACR_NAME.azurecr.io"
say "ssh from       $SSH_SOURCE"
say "azure fqdn     $PUBLIC_FQDN"
say "admin user     $ADMIN_USER"
if [ "$NO_SHUTDOWN" -eq 0 ]; then
  say "auto-shutdown  $SHUTDOWN_TIME $SHUTDOWN_TZ"
else
  say "auto-shutdown  disabled — the VM bills around the clock"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  section "Dry run"
  say "checking that $VM_SIZE is offered in $LOCATION"
  offered="$(az vm list-skus --location "$LOCATION" --size "$VM_SIZE" --query "[?name=='$VM_SIZE'].name | [0]" -o tsv 2>/dev/null || true)"
  [ -n "$offered" ] || die "$VM_SIZE is not offered in $LOCATION"
  say "ok: $VM_SIZE is available"
  say "checking the regional vCPU quota"
  az vm list-usage --location "$LOCATION" -o table 2>/dev/null | grep -i -E "Total Regional vCPUs|Standard DSv5" || say "(quota table unavailable)"
  say "checking that the registry name is free"
  if az acr show --name "$ACR_NAME" >/dev/null 2>&1; then
    say "registry $ACR_NAME already exists and is yours"
  else
    available="$(az acr check-name --name "$ACR_NAME" --query nameAvailable -o tsv 2>/dev/null || true)"
    [ "$available" = "true" ] || say "warning: registry name $ACR_NAME is taken — pass --acr-name"
  fi
  section "Nothing was created."
  exit 0
fi

section "Resource group"
if [ "$(az group exists --name "$RESOURCE_GROUP")" = "true" ]; then
  say "$RESOURCE_GROUP already exists"
else
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o none
  say "created $RESOURCE_GROUP"
fi

section "Network security group"
if az network nsg show -g "$RESOURCE_GROUP" -n "$NSG_NAME" >/dev/null 2>&1; then
  say "$NSG_NAME already exists"
else
  az network nsg create -g "$RESOURCE_GROUP" -n "$NSG_NAME" -o none
  say "created $NSG_NAME"
fi

nsg_rule() {
  local name="$1" priority="$2" port="$3" source="$4"
  az network nsg rule create -g "$RESOURCE_GROUP" --nsg-name "$NSG_NAME" -n "$name" \
    --priority "$priority" --access Allow --protocol Tcp --direction Inbound \
    --source-address-prefixes "$source" --source-port-ranges '*' \
    --destination-address-prefixes '*' --destination-port-ranges "$port" -o none
  say "rule $name: tcp/$port from $source"
}

nsg_rule ssh 100 22 "$SSH_SOURCE"
nsg_rule http 110 80 Internet
nsg_rule https 120 443 Internet

section "Public IP"
if az network public-ip show -g "$RESOURCE_GROUP" -n "$IP_NAME" >/dev/null 2>&1; then
  say "$IP_NAME already exists"
else
  az network public-ip create -g "$RESOURCE_GROUP" -n "$IP_NAME" \
    --sku Standard --allocation-method Static --dns-name "$DNS_LABEL" -o none
  say "created $IP_NAME with label $DNS_LABEL"
fi

section "Container registry"
if az acr show --name "$ACR_NAME" >/dev/null 2>&1; then
  say "$ACR_NAME already exists"
else
  az acr create -g "$RESOURCE_GROUP" -n "$ACR_NAME" --sku Basic --admin-enabled false -o none
  say "created $ACR_NAME.azurecr.io"
fi

section "Virtual machine"
if az vm show -g "$RESOURCE_GROUP" -n "$VM_NAME" >/dev/null 2>&1; then
  say "$VM_NAME already exists — leaving it alone"
else
  spot_args=()
  if [ "$USE_SPOT" -eq 1 ]; then
    spot_args=(--priority Spot --eviction-policy Deallocate --max-price -1)
  fi
  az vm create \
    -g "$RESOURCE_GROUP" -n "$VM_NAME" \
    --image "$IMAGE_URN" \
    --size "$VM_SIZE" \
    --admin-username "$ADMIN_USER" \
    --generate-ssh-keys \
    --os-disk-size-gb "$DISK_GB" \
    --storage-sku Premium_LRS \
    --public-ip-address "$IP_NAME" \
    --nsg "$NSG_NAME" \
    --vnet-name "$VNET_NAME" \
    --subnet "$SUBNET_NAME" \
    --custom-data "$here/cloud-init.yaml" \
    --assign-identity \
    "${spot_args[@]}" \
    -o none
  say "created $VM_NAME"
fi

section "Registry access"
vm_identity="$(az vm show -g "$RESOURCE_GROUP" -n "$VM_NAME" --query identity.principalId -o tsv 2>/dev/null || true)"
acr_id="$(az acr show --name "$ACR_NAME" --query id -o tsv 2>/dev/null || true)"
if [ -n "$vm_identity" ] && [ -n "$acr_id" ]; then
  if az role assignment create --assignee-object-id "$vm_identity" --assignee-principal-type ServicePrincipal \
    --role AcrPush --scope "$acr_id" -o none 2>/dev/null; then
    say "granted AcrPush to the VM identity"
  else
    say "AcrPush already granted, or your account cannot assign roles — see README.md"
  fi
else
  say "skipped: could not resolve the VM identity or the registry id"
fi

if [ "$NO_SHUTDOWN" -eq 0 ]; then
  section "Auto-shutdown"
  az vm auto-shutdown -g "$RESOURCE_GROUP" -n "$VM_NAME" --time "$SHUTDOWN_TIME" -o none
  say "the VM stops daily at $SHUTDOWN_TIME $SHUTDOWN_TZ; compute stops billing, the disk does not"
fi

PUBLIC_IP="$(az network public-ip show -g "$RESOURCE_GROUP" -n "$IP_NAME" --query ipAddress -o tsv)"

section "Done"
say "ssh            ssh $ADMIN_USER@$PUBLIC_IP"
say "azure fqdn     $PUBLIC_FQDN"
say "sslip fqdn     suniv-${PUBLIC_IP//./-}.sslip.io"
say "registry       $ACR_NAME.azurecr.io"
printf '\n'
say "cloud-init is still running. Wait for it, then check the toolchain:"
say "  ssh $ADMIN_USER@$PUBLIC_IP 'cloud-init status --wait && node --version && docker version'"
printf '\n'
say "Then follow README.md to clone the repository and run first-run.sh."
say "To delete everything: az group delete --name $RESOURCE_GROUP --yes"
