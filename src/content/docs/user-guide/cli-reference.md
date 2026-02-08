---
title: "CLI Reference"
---


Complete reference for all LoKO commands.

## Command Targeting

Most runtime commands resolve their target environment in this order:

1. `--config` / `-c` if you pass it explicitly
2. the active environment from inventory
3. `./loko.yaml`

This means commands like `loko status`, `loko env start`, `loko env stop`, `loko env destroy`, `loko workloads ...`, `loko dns ...`, `loko tunnel ...`, and `loko gitops ...` can work from outside the project directory after you activate an environment.

Most commands that operate on an existing environment, including most `config ...` commands, follow this same order. Commands that create or generate config files still act on the local file you point them at.

## Command Groups

- `env` - Environment lifecycle
- `workloads` - Workload management
- `aws` - AWS profile helper for local AWS-compatible workloads
- `doctor` - Aggregated diagnostics
- `check` - Health checks and diagnostics
- `certs` - Certificate and CA management
- `dns` - DNS management
- `config` - Configuration management
- `helm` - Helm repository management
- `secrets` - Credentials management
- `registry` - Container registry operations
- `tunnel` - Tunnel management
- `logs` - Log viewing
- `inventory` - Inventory management
- `state` - Persisted state tooling
- `catalog` - Catalog management
- `gitops` - GitOps bootstrap and lifecycle

## Environment Lifecycle (`env`)

### `env create`

Create complete environment.

```bash
loko env create [OPTIONS]
```

**Options:**
- `--config, -c TEXT` - Config file path (default: `loko.yaml`)

**Example:**
```bash
loko env create
loko env create -c loko-prod.yaml
```

### `env start`

Start stopped environment.

```bash
loko env start [OPTIONS]
```

### `env stop`

Stop running environment.

```bash
loko env stop [OPTIONS]
```

### `env activate`

Activate another environment.

```bash
loko env activate ENV_NAME [OPTIONS]
```

Stops the current environment, switches the current `kubectl` context, starts the target environment, and marks it as the active environment in inventory.

**Notes:**
- The target environment must already exist in inventory
- The target cluster must already be created
- Top-level alias: `loko activate ENV_NAME`

### `env list`

List environments known to LoKO inventory.

```bash
loko env list [OPTIONS]
```

This is an alias for `loko inventory list`.

### `env show`

Show the data directory for an environment.

```bash
loko env show [ENV_NAME]
```

If `ENV_NAME` is omitted, LoKO uses the active environment.

### `env browse`

Open the environment data directory in the default file manager.

```bash
loko env browse [ENV_NAME]
```

If `ENV_NAME` is omitted, LoKO uses the active environment.

### `env destroy`

Destroy cluster but keep configs.

```bash
loko env destroy [OPTIONS]
```

If no explicit `--config` is given, this targets the active environment first.

### `env recreate`

Destroy and recreate environment.

```bash
loko env recreate [OPTIONS]
```

### `env clean`

Remove all environment artifacts.

```bash
loko env clean [OPTIONS]
```

**Options:**
- `--keep-config` - Keep loko.yaml file

## Workload Management (`workload`)

### `workloads list`

List workloads.

```bash
loko workloads list [OPTIONS]
```

**Options:**
- `--all` - Show all workloads including disabled
- `--user` - Show user workloads only
- `--system` - Show system workloads only
- `--internal` - Show internal components only
- `--disabled` - Show disabled workloads only
- `--format TEXT` - Output format: `rich`, `json`, `text`

**Examples:**
```bash
loko workloads list
loko workloads list --system --disabled
loko workloads list --format json | jq
```

### `workloads add`

Add workload from catalog.

```bash
loko workloads add WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--enabled / --disabled` - Enable or disable the workload in config
- `--now` - Deploy immediately after adding

**Examples:**
```bash
loko workloads add postgres
loko workloads add postgres --now
loko workloads add rabbitmq --disabled
```

### `workloads remove`

Remove workload from config.

```bash
loko workloads remove WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--now` - Undeploy immediately before removing

### `workloads enable`

Enable workload.

```bash
loko workloads enable WORKLOAD_NAMES... [OPTIONS]
```

**Options:**
- `--now` - Deploy immediately

**Examples:**
```bash
loko workloads enable postgres
loko workloads enable mysql postgres mongodb --now
```

### `workloads disable`

Disable workload.

```bash
loko workloads disable WORKLOAD_NAMES... [OPTIONS]
```

**Options:**
- `--now` - Undeploy immediately

**Examples:**
```bash
loko workloads disable postgres
loko workloads disable mysql postgres mongodb --now
```

### `workloads deploy`

Deploy workloads.

```bash
loko workloads deploy [WORKLOAD_NAMES...] [OPTIONS]
```

**Options:**
- `--all` - Include internal components
- `--user` - User workloads only
- `--system` - System workloads only
- `--internal` - Internal components only

**Examples:**
```bash
loko workloads deploy                    # All enabled
loko workloads deploy postgres           # Specific workload
loko workloads deploy mysql postgres     # Multiple workloads
loko workloads deploy --system           # All system workloads
```

### `workloads undeploy`

Undeploy workloads.

```bash
loko workloads undeploy [WORKLOAD_NAMES...] [OPTIONS]
```

**Options:** Same as `deploy`

### `workloads sync`

Run a full helmfile sync for workloads and GitOps when enabled.

```bash
loko workloads sync [OPTIONS]
```

Re-generates the workloads helmfile and runs a full sync. If GitOps is enabled, it also syncs the GitOps provider.

### `workloads info`

Show workload catalog information.

```bash
loko workloads info WORKLOAD_NAME
```

**Example:**
```bash
loko workloads info postgres
```

### `workloads endpoints`

Show workload endpoints.

```bash
loko workloads endpoints WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--format TEXT` - Output format

### `workloads connect`

Show connection strings.

```bash
loko workloads connect WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--show-password, -p` - Display actual passwords

### `workloads check`

Run health checks.

```bash
loko workloads check WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--tier, -t TEXT` - Health check tier: infrastructure (default), client, or all
- `--all, -a` - Run all health checks regardless of tier
- `--port-forward, -f` - Use kubectl port-forward

### `logs workload`

View workload logs.

```bash
loko logs workload WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--follow, -f` - Follow log output
- `--tail INTEGER` - Lines to show from end
- `--since TEXT` - Show logs since (e.g., `5m`, `1h`)
- `--container TEXT` - Container name (for multi-container pods)
- `--previous` - Show previous container logs

**Examples:**
```bash
loko logs workload postgres
loko logs workload postgres --follow --tail 100
loko logs workload traefik --container traefik
```


## AWS Helpers (`aws`)

### `aws profile`

Show the unified LoKO AWS CLI profile and per-service endpoints for enabled AWS-compatible workloads.

```bash
loko aws profile [OPTIONS]
```

The generated profile name is `loko-<environment-name>` (for example, `loko-dev-me`).

**Includes endpoints for enabled workloads:**
- `garage` → S3 (`https://garage.${LOKO_DOMAIN}`)
- `elasticmq` → SQS (`https://elasticmq-api.${LOKO_DOMAIN}`)
- `goaws` → SNS (`https://sns.${LOKO_DOMAIN}`)
- `dynamodb-local` → DynamoDB (`https://dynamodb-local.${LOKO_DOMAIN}`)

**Examples:**
```bash
loko aws profile
loko aws profile -c loko.yaml

# Then use AWS CLI with the printed profile
aws s3 ls --profile loko-dev-me
aws sqs list-queues --profile loko-dev-me
aws sns list-topics --profile loko-dev-me
aws dynamodb list-tables --profile loko-dev-me
```

## DNS Management (`dns`)

### `dns status`

Show DNS container status and configuration.

```bash
loko dns status [OPTIONS]
```

### `dns start`

Start DNS container.

```bash
loko dns start [OPTIONS]
```

### `dns stop`

Stop DNS container.

```bash
loko dns stop [OPTIONS]
```

### `dns recreate`

Recreate DNS container with updated configuration.

```bash
loko dns recreate [OPTIONS]
```

## Certificate Management (`certs`)

### `certs ca status`

Show global CA certificate info: path, subject, expiry dates, and SHA-256 fingerprint.

```bash
loko certs ca status [OPTIONS]
```

**Example:**
```bash
loko certs ca status
```

### `certs ca install`

Install (or re-install) the global LoKO CA into all system trust stores and Docker certs.d.

Installs into: macOS Keychain or Linux trust store, NSS databases (Firefox), Java cacerts (if `JAVA_HOME` is set), and `~/.docker/certs.d/<registry>/ca.crt`.

```bash
loko certs ca install [OPTIONS]
```

Use this when:
- Setting up on a new machine with an existing `~/.loko/ca/`
- Trust was accidentally removed from the keychain
- Adding a new environment whose registry needs Docker trust

**Example:**
```bash
loko certs ca install
```

### `certs ca remove`

Remove the global LoKO CA from all trust stores, Docker certs.d for all known environments, and (by default) delete the CA files from `~/.loko/ca/`.

```bash
loko certs ca remove [OPTIONS]
```

**Options:**
- `--keep-files` - Remove trust only; do not delete `~/.loko/ca/`

**Examples:**
```bash
loko certs ca remove               # Remove trust and delete CA files
loko certs ca remove --keep-files  # Remove trust only
```

### `certs ca regenerate`

Destroy the current global CA, generate a new one (10-year validity, 4096-bit RSA), and reinstall trust. All existing per-environment wildcard certificates are invalidated and must be renewed.

```bash
loko certs ca regenerate [OPTIONS]
```

After regenerating, renew each environment's wildcard cert:

```bash
loko certs renew
```

### `certs show`

Show wildcard certificate info for the current environment: SANs, expiry dates, issuer, and SHA-256 fingerprint.

```bash
loko certs show [OPTIONS]
```

### `certs renew`

Renew the wildcard certificate for the current environment using the existing global CA. Automatically updates the Kubernetes `wildcard-tls` secret and restarts Traefik.

```bash
loko certs renew [OPTIONS]
```

Use this when:
- The wildcard cert has expired or is approaching expiry
- The global CA was regenerated (`certs ca regenerate`)
- New SANs are needed (e.g. after enabling a workload with a wildcard subdomain)

## Inventory (`inventory`)

### `inventory list`

List environments known to inventory.

```bash
loko inventory list [OPTIONS]
```

**Options:**
- `--verbose, -v` - Show base directory, Kubernetes version, and node count
- `--format TEXT` - Output format: `rich`, `json`, `text`

The output marks which environment is currently active.

### `inventory check`

Validate inventory health.

```bash
loko inventory check [OPTIONS]
```

Detects missing configs, missing base directories, missing clusters, duplicate environment names, and stale active-environment markers.

### `inventory vacuum`

Remove stale entries from inventory.

```bash
loko inventory vacuum [OPTIONS]
```

**Options:**
- `--dry-run` - Preview stale entries without removing them

When safe, this also removes stale resolver files for domains no longer used by any remaining inventory entry.

## GitOps (`gitops`)

### `gitops init`

Bootstrap GitOps for the current environment.

```bash
loko gitops init [OPTIONS]
```

**Options:**
- `--provider [fluxcd|argocd]` - GitOps provider (default: `fluxcd`)
- `--org TEXT` - Forgejo organization owner for repos
- `--force` - Overwrite existing non-empty GitOps repo
- `--verbose` - Show underlying command output

### `gitops status`

Show GitOps health and reconciliation state.

```bash
loko gitops status [OPTIONS]
```

**Options:**
- `--json` - Machine-readable output

### `gitops destroy`

Remove GitOps bootstrap resources and integration state.

```bash
loko gitops destroy [OPTIONS]
```

**Options:**
- `--force` - Skip confirmation prompt
- `--dry-run` - Show actions without making changes

### `gitops reconcile`

Trigger immediate reconciliation of the root GitOps construct.

```bash
loko gitops reconcile [OPTIONS]
```

For FluxCD: annotates `FluxInstance`, `Kustomization/loko-root`, and `GitRepository/loko-gitops`. For ArgoCD: patches `Application/loko-root` to trigger a sync.

### `gitops reset`

Destroy and re-initialize GitOps (keeps `gitops.enabled: true`).

```bash
loko gitops reset [OPTIONS]
```

**Options:**
- `--provider [fluxcd|argocd]` - Provider to use after reset
- `--org TEXT` - Forgejo organization for the repository
- `--force` - Skip confirmation prompt
- `--verbose` - Show underlying command output

### `gitops enable`

Enable GitOps in `loko.yaml`.

```bash
loko gitops enable [OPTIONS]
```

**Options:**
- `--now` - Bootstrap immediately
- `--provider, -p [fluxcd|argocd]` - Provider to apply with `--now`
- `--org, -o TEXT` - Forgejo organization to use with `--now`
- `--force, -f` - Overwrite existing repository if not empty when using `--now`
- `--verbose, -v` - Show detailed underlying command output when using `--now`

### `gitops disable`

Disable GitOps in `loko.yaml`.

```bash
loko gitops disable [OPTIONS]
```

**Options:**
- `--now` - Destroy GitOps resources immediately

### `gitops provider`

Show or set the configured GitOps provider.

```bash
loko gitops provider [fluxcd|argocd]
```

If no argument is passed, prints the current provider.

## Health Checks (`check`)

### `check prerequisites`

Check if all required tools are installed.

```bash
loko check prerequisites [OPTIONS]
```

### `check dns`

Check DNS configuration and resolution status.

```bash
loko check dns [OPTIONS]
```

### `check ports`

Check availability of all configured ports.

```bash
loko check ports [OPTIONS]
```

### `check terminal`

Check terminal capabilities for rich output.

```bash
loko check terminal
```

## Diagnostics (`doctor`)

### `doctor`

Run aggregated diagnostics across runtime, state, cluster, and workloads.

```bash
loko doctor [OPTIONS]
```

**Options:**
- `--config, -c TEXT` - Configuration file path [default: `loko.yaml`]

## State (`state`)

### `state status`

Show persisted state status and coverage.

```bash
loko state status
```

### `state doctor`

Run consistency checks for current persisted state.

```bash
loko state doctor
```

### `state operations`

Show latest lifecycle operations from the persisted journal.

```bash
loko state operations [OPTIONS]
```

**Options:**
- `--env TEXT` - Filter by environment name
- `--command TEXT` - Filter by command (e.g., `create`, `recreate`)
- `--status TEXT` - Filter by status (`running`, `completed`, `failed`)
- `--limit INTEGER` - Maximum operations to show (`1-100`, default `10`)
- `--steps` - Include detailed step rows

### `state operation`

Show detailed step-by-step view for one operation.

```bash
loko state operation OPERATION_ID
```

### `state export`

Export state snapshot (`inventory + secrets + metadata`).

```bash
loko state export [OPTIONS]
```

**Options:**
- `--output, -o TEXT` - Output snapshot path, or `-` for stdout [default: `-`]

### `state import`

Import state snapshot.

```bash
loko state import --input SNAPSHOT_PATH [OPTIONS]
```

**Options:**
- `--input, -i TEXT` - Snapshot file path (required)
- `--replace / --merge` - Replace existing state or merge into it (default: replace)

## Configuration (`config`)

### `config generate`

Generate configuration file.

```bash
loko config generate [OPTIONS]
```

**Options:**
- `--force` - Overwrite existing file
- `--local-ip TEXT` - Override auto-detected local IP
- `--output, -o TEXT` - Output file path [default: loko.yaml]

**Example:**
```bash
loko config generate
loko config generate --local-ip 192.168.0.10
loko config generate --force --output custom.yaml
```

### `config validate`

Validate configuration file.

```bash
loko config validate [OPTIONS]
```

### `config sync`

Sync configuration changes.

```bash
loko config sync [OPTIONS]
```

**Options:**
- `--backup` / `-b` - Create backup before applying changes
- `--diff` / `--no-diff` - Show or hide detailed diffs

### `config upgrade`

Upgrade component versions.

```bash
loko config upgrade [OPTIONS]
```

### `config ip`

Detect local IP address.

```bash
loko config ip
```

## Helm Repositories (`helm`)

### `helm repo add`

Add Helm repository.

```bash
loko helm repo add [OPTIONS]
```

**Options:**
- `--helm-repo-name TEXT` - Repository name (required)
- `--helm-repo-url TEXT` - Repository URL (required)

**Example:**
```bash
loko helm repo add \
  --helm-repo-name bitnami \
  --helm-repo-url https://charts.bitnami.com/bitnami
```

### `helm repo remove`

Remove Helm repository.

```bash
loko helm repo remove [OPTIONS]
```

**Options:**
- `--helm-repo-name TEXT` - Repository name (required)

### `helm repo list`

List Helm repositories.

```bash
loko helm repo list [OPTIONS]
```

## Web UIs

Web UI workloads are managed as regular workloads through the `workloads` commands. Many workloads have linked UI tools that can be added separately.

### Viewing Available UIs

Use `loko workloads info` to see linked UI workloads:

```bash
loko workloads info postgres
# Shows: postgres-ui (pgAdmin) as a linked workload
```

### Managing UI Workloads

UI workloads use the same commands as other workloads:

```bash
# Add a UI workload
loko workloads add postgres-ui

# Deploy a UI workload
loko workloads deploy postgres-ui

# Remove a UI workload
loko workloads remove postgres-ui
```

See the [Workloads](#workload-management-workload) section for all available commands.

## Secrets Management (`secrets`)

### `secrets fetch`

Fetch secrets from cluster.

```bash
loko secrets fetch [OPTIONS]
```

### `secrets show`

Display saved secrets.

```bash
loko secrets show [OPTIONS]
```

**Options:**
- `--format TEXT` - Output format: `rich`, `json`, `text`

**Examples:**
```bash
loko secrets show
loko secrets show --format json | jq '.postgres.password'
```

## Registry Operations (`registry`)

### `registry status`

Show registry status.

```bash
loko registry status [OPTIONS]
```

### `registry list-repos`

List repositories.

```bash
loko registry list-repos [OPTIONS]
```

### `registry show-repo`

Show repository details.

```bash
loko registry show-repo REPOSITORY_NAME [OPTIONS]
```

### `registry list-tags`

List repository tags.

```bash
loko registry list-tags REPOSITORY_NAME [OPTIONS]
```

### `registry purge-repo`

Delete all tags from a specific repository.

```bash
loko registry purge-repo REPOSITORY_NAME [OPTIONS]
```

**Options:**
- `--force, -f` - Skip confirmation prompt

**Example:**
```bash
loko registry purge-repo myapp --force
```

### `registry purge`

Delete all tags from every repository in the registry.

```bash
loko registry purge [OPTIONS]
```

**Options:**
- `--force, -f` - Skip confirmation prompt

### `registry load-image`

Load locally built image(s) into the Kind cluster.

```bash
loko registry load-image IMAGE... [OPTIONS]
```

**Options:**
- `--nodes, -n TEXT` - Comma-separated node list (default: all nodes)

**Examples:**
```bash
loko registry load-image myapp:latest
loko registry load-image myapp:latest myapp:v1.0.0
```

## Other Commands

### `status`

Show environment health status (Phase 4).

```bash
loko status [OPTIONS]
```

**Options:**
- `--short` - Show compact table view instead of detailed panels
- `--workloads` - Show detailed per-service breakdown for workloads
- `--format TEXT` - Output format: `rich`, `json`, `text`
- `--force-color` - Force colored output even when piping

**Health Components:**
- **Cluster**: Kubernetes cluster running state
- **DNS**: dnsmasq health and OS resolver configuration
- **Tunnel**: HAProxy TCP load balancer for database access
- **Registry**: Local OCI registry (if enabled)
- **Workloads**: Deployed services health status

**Health States:**
- ✓ **Healthy** (green) - Component running normally
- ⚠ **Degraded** (yellow) - Running but issues detected
- ⏸ **Stopped** (gray) - Component stopped
- ○ **Not Configured** (dim) - Component not enabled

**Examples:**
```bash
loko status                    # Default: detailed panel view
loko status --short            # Compact table view
loko status --format json      # JSON output for scripting
loko status --workloads        # Detailed workload breakdown
```

### `validate`

Validate environment.

```bash
loko validate [OPTIONS]
```

Runs a full environment validation (including self-test app deployment).

**Options:**
- `--cleanup` - Cleanup the self-test app and test namespace after validation (default keeps them for inspection)
- `--format TEXT` - Output format: `rich`, `json`, `text`
- `--force-color` - Force colored output even when piping

**Examples:**
```bash
loko validate                 # Runs validation and keeps self-test resources
loko validate --cleanup       # Runs validation and then cleans up test resources
loko env validate --cleanup   # Same behavior through env alias
```

### `completion`

Generate shell completion.

```bash
loko completion {bash|zsh|fish}
```

**Examples:**
```bash
loko completion bash > ~/.loko-completion.bash
loko completion zsh > ~/.loko-completion.zsh
```

## Global Options

Available for all commands:

- `--help` - Show help message
- `--version` - Show version
- `--config, -c TEXT` - Configuration file path override (default: `loko.yaml`)

If `--config` is omitted, many runtime commands use the active environment from inventory before falling back to `./loko.yaml`.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Config error |
| 3 | Cluster error |
| 4 | Workload error |
| 5 | DNS error |
| 6 | Certificate error |

## Environment Variables

- `LOKO_CONFIG_FILE` - Default config file path
- `LOKO_DEBUG` - Enable debug output
- `LOKO_NO_COLOR` - Disable colored output

**Example:**
```bash
export LOKO_CONFIG_FILE=custom-config.yaml
export LOKO_DEBUG=1
loko status
```

## Next Steps

- [Quick Start](../getting-started/quick-start) - Get started with LoKO
- [User Guide](index) - Detailed usage guides
- [Troubleshooting](../reference/troubleshooting) - Common issues
