---
title: "CLI Reference"
---


Complete reference for all LoKO commands.

## Command Groups

- `env` - Environment lifecycle
- `workloads` - Workload management
- `check` - Health checks and diagnostics
- `dns` - DNS management
- `config` - Configuration management
- `helm` - Helm repository management
- `secrets` - Credentials management
- `registry` - Container registry operations
- `tunnel` - Tunnel management
- `logs` - Log viewing
- `inventory` - Inventory management
- `catalog` - Catalog management
- `gitops` - GitOps bootstrap and lifecycle

## Environment Lifecycle (`env`)

### `env create`

Create complete environment.

```bash
loko env create [OPTIONS]
```

**Options:**
- `--config-file TEXT` - Config file path (default: `loko.yaml`)

**Example:**
```bash
loko env create
loko env create --config-file loko-prod.yaml
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

### `env destroy`

Destroy cluster but keep configs.

```bash
loko env destroy [OPTIONS]
```

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
loko workloads add WORKLOAD_NAMES... [OPTIONS]
```

**Options:**
- `--now` - Deploy immediately after adding

**Examples:**
```bash
loko workloads add postgres
loko workloads add mysql postgres --now
```

### `workloads remove`

Remove workload from config.

```bash
loko workloads remove WORKLOAD_NAMES... [OPTIONS]
```

**Options:**
- `--now` - Undeploy immediately before removing

### `workloads enable`

Enable workload.

```bash
loko workloads enable WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--now` - Deploy immediately

### `workloads disable`

Disable workload.

```bash
loko workloads disable WORKLOAD_NAME [OPTIONS]
```

**Options:**
- `--now` - Undeploy immediately

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
loko workloads deploy --system           # All system workloads
```

### `workloads undeploy`

Undeploy workloads.

```bash
loko workloads undeploy [WORKLOAD_NAMES...] [OPTIONS]
```

**Options:** Same as `deploy`

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

## Configuration (`config`)

### `config generate`

Generate configuration file.

```bash
loko config generate [OPTIONS]
```

**Options:**
- `--force` - Overwrite existing file
- `--output, -o TEXT` - Output file path [default: loko.yaml]

**Example:**
```bash
loko config generate
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
- **DNS**: dnsmasq service and OS resolver configuration
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
- `--config-file TEXT` - Configuration file path (default: `loko.yaml`)

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
