---
title: "Command Reference"
---


Comprehensive reference for all LoKO CLI commands.

## Command Structure

LoKO uses a hierarchical command structure organized into logical groups:

```
loko
├── env           # Environment lifecycle
├── workloads     # Workload management
├── check         # Health checks and diagnostics
├── dns           # DNS management
├── config        # Configuration management
├── helm          # Helm repository management
├── secrets       # Credential management
├── registry      # Container registry operations
├── tunnel        # TCP tunnel container + ngrok HTTP(S) sharing
├── logs          # Log viewing
├── inventory     # Inventory management
├── catalog       # Catalog operations
├── gitops        # GitOps bootstrap and lifecycle
└── status        # Environment health status
```

## Environment Commands

### env create

Create a new local Kubernetes environment.

```bash
loko env create [OPTIONS]
```

**Options**:
- `--name TEXT` - Environment name (default: from config)
- `--workers INT` - Number of worker nodes (default: 2)
- `--force` - Force recreation if exists
- `--dry-run` - Preview without creating

**Example**:
```bash
loko env create --workers 3
```

See [Environment Lifecycle](../user-guide/environment-lifecycle) for details.

---

### env destroy

Destroy an existing environment.

```bash
loko env destroy [OPTIONS]
```

**Options**:
- `--name TEXT` - Environment name
- `--force` - Skip confirmation

**Example**:
```bash
loko env destroy --force
```

---

### env start

Start a stopped environment.

```bash
loko env start [OPTIONS]
```

**Options**:
- `--name TEXT` - Environment name

---

### env stop

Stop a running environment.

```bash
loko env stop [OPTIONS]
```

**Options**:
- `--name TEXT` - Environment name

---

### env recreate

Recreate environment (destroy + create).

```bash
loko env recreate [OPTIONS]
```

**Options**:
- Same as `env create`

---

## Workload Commands

### workload add

Add a workload to configuration.

```bash
loko workloads add NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name from catalog

**Options**:
- `--enabled` / `--disabled` - Enable or disable the workload (default: enabled)
- `--now` - Deploy immediately after adding

**Example**:
```bash
loko workloads add postgres --now
```

See [Workload Management](../user-guide/workload-management) for details.

---

### workload remove

Remove a workload from configuration.

```bash
loko workloads remove NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--now` - Undeploy before removing from config

**Example**:
```bash
loko workloads remove postgres --now
```

---

### workload enable

Enable a disabled workload.

```bash
loko workloads enable NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--now` - Deploy immediately

**Example**:
```bash
loko workloads enable mysql --now
```

---

### workload disable

Disable an enabled workload.

```bash
loko workloads disable NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--now` - Undeploy immediately

**Example**:
```bash
loko workloads disable mysql --now
```

---

### workload deploy

Deploy workloads to cluster.

```bash
loko workloads deploy [NAMES]... [OPTIONS]
```

**Arguments**:
- `NAMES` - Workload names (optional)

**Options**:
- `--all` - Include all workloads (user, system, and internal)
- `--user` - Include only user workloads
- `--system` - Include only system workloads
- `--internal` - Include only internal workloads

**Examples**:
```bash
# Deploy specific workloads
loko workloads deploy postgres mysql

# Deploy all including internal
loko workloads deploy --all

# Deploy only user workloads
loko workloads deploy --user
```

---

### workload undeploy

Undeploy workloads from cluster.

```bash
loko workloads undeploy [NAMES]... [OPTIONS]
```

**Arguments**:
- `NAMES` - Workload names (optional)

**Options**:
- `--all` - Include all workloads (user, system, and internal)
- `--user` - Include only user workloads
- `--system` - Include only system workloads
- `--internal` - Include only internal workloads

**Example**:
```bash
loko workloads undeploy postgres
```

---

### workload list

List workloads and their status.

```bash
loko workloads list [OPTIONS]
```

**Options**:
- `--all` / `-a` - Show all workloads including disabled and available from catalog
- `--internal` / `-i` - Show only enabled internal components
- `--system` / `-s` - Show only enabled system workloads
- `--user` / `-u` - Show only enabled user-defined workloads
- `--enabled` / `-e` - Show only enabled workloads
- `--disabled` / `-d` - Show only disabled workloads
- `--format TEXT` - Output format (`rich`, `json`, `text`)

**Examples**:
```bash
loko workloads list --all
loko workloads list --system
loko workloads list --disabled
loko workloads list --format json
```

---

### workload info

Show detailed workload information.

```bash
loko workloads info NAME
```

**Arguments**:
- `NAME` - Workload name

**Example**:
```bash
loko workloads info postgres
```

---

### workload logs

View workload logs.

```bash
loko logs workload NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--follow` / `-f` - Follow log output
- `--tail INT` - Number of lines to show

**Example**:
```bash
loko logs workload postgres --follow
```

---

### workload check

Run health checks for a workload.

```bash
loko workloads check NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--tier TEXT` / `-t` - Health check tier: `infrastructure` (default), `client`, or `all`
- `--all` / `-a` - Run all health checks regardless of tier
- `--port-forward` / `-f` - Use kubectl port-forward instead of external domain

Health check tiers:
- **infrastructure** - Port connectivity checks (no client tools required, runs by default)
- **client** - Service validation using client tools (requires tools like `mysql`, `psql`, `valkey-cli`, etc.)

**Examples**:
```bash
# Default: infrastructure tier (port checks)
loko workloads check postgres

# Client tier (requires psql)
loko workloads check postgres --tier client
loko workloads check postgres -t infra    # alias for infrastructure

# All tiers
loko workloads check postgres --all

# Via port-forward instead of DNS
loko workloads check postgres --port-forward
```

---

### workload connect

Show connection strings for a workload.

```bash
loko workloads connect NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--show-password` / `-p` - Show actual password (masked by default)
- `--format TEXT` - Output format (`rich`, `json`, `text`)

Credentials are resolved automatically from the local secrets file, with fallback to Helm release values and Kubernetes secrets.

**Examples**:
```bash
# Show connection strings (password masked)
loko workloads connect postgres

# Show with actual password
loko workloads connect postgres --show-password

# JSON output for scripting
loko workloads connect postgres --format json -p
```

---

### workload endpoints

Show endpoints for a workload.

```bash
loko workloads endpoints NAME [OPTIONS]
```

**Arguments**:
- `NAME` - Workload name

**Options**:
- `--format TEXT` - Output format (`rich`, `json`, `text`)

**Example**:
```bash
loko workloads endpoints postgres
```

---

## Secrets Commands

### secrets fetch

Fetch workload credentials from cluster and save locally.

```bash
loko secrets fetch [OPTIONS]
```

Fetches secrets from Kubernetes and saves them to `.loko/<env-name>/workload-secrets.json`.

**Example**:
```bash
loko secrets fetch
```

---

### secrets show

Display workload credentials.

```bash
loko secrets show [WORKLOAD] [OPTIONS]
```

**Arguments**:
- `WORKLOAD` - Workload name (optional, shows all if omitted)

**Options**:
- `--format TEXT` - Output format (`rich`, `json`, `text`)

**Examples**:
```bash
# Show all secrets
loko secrets show

# Show specific workload
loko secrets show postgres

# JSON output for scripting
loko secrets show --format json
loko secrets show postgres --format json
```

---

## Catalog Commands

### catalog list

List available workloads in catalog.

```bash
loko catalog list [OPTIONS]
```

**Options**:
- `--category TEXT` - Filter by category
- `--search TEXT` - Search by name/description

**Example**:
```bash
loko catalog list --category database
```

See [Catalog Management](catalog/management) for details.

---

### catalog info

Show catalog information.

```bash
loko catalog info
```

Displays catalog version, location, and statistics.

---

### catalog sync

Sync catalog from remote source (GitHub by default).

```bash
loko catalog sync [OPTIONS]
```

**Options**:
- `--url [URL]` - Remote catalog URL (defaults to GitHub catalog)
- `--force` - Force sync even if versions match
- `--dry-run` - Preview changes without applying
- `--no-cache` - Skip cache and force fresh fetch
- `--diff/--no-diff` - Show/hide diff before applying (default: on)

**Examples**:
```bash
# Sync from official GitHub catalog
loko catalog sync

# Sync from custom URL
loko catalog sync --url https://example.com/catalog.yaml

# Preview changes first
loko catalog sync --dry-run

# Force fresh fetch
loko catalog sync --no-cache
```

See [Remote Catalog Sync](catalog/remote-sync) for details.

**Official Catalog**: [github.com/getloko/catalog](https://github.com/getloko/catalog)

---

### catalog update

Update component versions.

```bash
loko catalog update [OPTIONS]
```

**Options**:
- `--dry-run` - Preview updates

**Example**:
```bash
loko catalog update --dry-run
```

---

### catalog migrate

Reset to embedded catalog.

```bash
loko catalog migrate [OPTIONS]
```

**Options**:
- `--force` - Force migration even if same version

---

## Config Commands

### config generate

Generate loko.yaml configuration.

```bash
loko config generate [OPTIONS]
```

**Options**:
- `--force` - Overwrite existing config
- `--output, -o TEXT` - Output file path [default: loko.yaml]

**Example**:
```bash
loko config generate --force
```

See [Configuration](../user-guide/configuration) for details.

---

### config sync

Sync configuration to cluster.

```bash
loko config sync [OPTIONS]
```

**Options**:
- `--backup` / `-b` - Create backup before applying changes
- `--diff` / `--no-diff` - Show or hide detailed diffs

Automatically handles workload namespace changes: if a workload's namespace is moved in `loko.yaml`, `config sync` will uninstall the release from the old namespace before redeploying it in the new one.

**Example**:
```bash
loko config sync
```

---

### config validate

Validate configuration file.

```bash
loko config validate [FILE]
```

**Arguments**:
- `FILE` - Config file path (default: loko.yaml)

---

## Tunnel Commands

The `tunnel` group manages the HAProxy TCP tunnel container for workload port forwarding, and the ngrok-based HTTP(S) sharing feature.

### tunnel status

Show tunnel container status and forwarded ports.

```bash
loko tunnel status [OPTIONS]
```

**Options**:
- `--format TEXT` - Output format (`rich`, `json`, `text`)
- `--force-color` - Force colored output

---

### tunnel start

Start the tunnel container.

```bash
loko tunnel start
```

---

### tunnel stop

Stop the tunnel container.

```bash
loko tunnel stop
```

---

### tunnel recreate

Recreate the tunnel container with updated port configuration.

```bash
loko tunnel recreate
```

Use this after adding or removing workloads with TCP ports. The tunnel container can be recreated without affecting the Kind cluster.

---

### tunnel share

Share an HTTP(S) workload or Kubernetes Ingress publicly via an ngrok tunnel.

```bash
loko tunnel share [OPTIONS]
```

**Options**:
- `--workload TEXT` / `-w` - Workload name defined in `loko.yaml`
- `--ingress TEXT` / `-i` - Kubernetes Ingress resource name
- `--namespace TEXT` / `-n` - Namespace for `--ingress` (default: system namespace)
- `--verbose` / `-v` - Show technical details (hostname, traffic policy file path)
- `--detach` / `-d` - Run tunnel in background (detached mode)

Exactly one of `--workload` or `--ingress` must be provided.

The Host header is automatically rewritten so traffic routes correctly through Traefik to the workload. Only HTTP(S) workloads are supported.

**Requires**: [ngrok](https://ngrok.com/download) installed and authenticated (`ngrok config add-authtoken <token>`).

**Examples**:
```bash
# Share a workload defined in loko.yaml
loko tunnel share --workload mysql-ui

# Share an arbitrary Kubernetes Ingress
loko tunnel share --ingress my-ingress
loko tunnel share --ingress my-ingress --namespace my-namespace

# Run in background
loko tunnel share --workload myapp --detach
```

---

## DNS Commands

### dns status

Show DNS container status and configuration.

```bash
loko dns status [OPTIONS]
```

---

### dns start

Start DNS container.

```bash
loko dns start [OPTIONS]
```

---

### dns stop

Stop DNS container.

```bash
loko dns stop [OPTIONS]
```

---

### dns recreate

Recreate DNS container with updated configuration.

```bash
loko dns recreate [OPTIONS]
```

See [Network & DNS](../user-guide/network-dns) for details.

---

## Helm Commands

### helm repo add

Add Helm repository.

```bash
loko helm repo add NAME URL
```

**Arguments**:
- `NAME` - Repository name
- `URL` - Repository URL

**Example**:
```bash
loko helm repo add bitnami https://charts.bitnami.com/bitnami
```

---

## GitOps Commands

### gitops init

Bootstrap GitOps integration for the current environment.

```bash
loko gitops init [OPTIONS]
```

**Options**:
- `--provider [fluxcd|argocd]` - GitOps provider (default: `fluxcd`)
- `--org TEXT` - Forgejo organization owner for created repos
- `--force` - Overwrite existing non-empty GitOps repository
- `--verbose` - Show underlying command output

See [GitOps](../user-guide/gitops) for full bootstrap flow.

---

### gitops status

Show GitOps reconciliation status and health.

```bash
loko gitops status [OPTIONS]
```

**Options**:
- `--json` - Structured output for automation/CI

---

### gitops destroy

Tear down GitOps integration and bootstrap resources.

```bash
loko gitops destroy [OPTIONS]
```

**Options**:
- `--force` - Skip confirmation prompt
- `--dry-run` - Print actions without performing them

---

### gitops reconcile

Trigger immediate reconciliation of the root GitOps construct for the configured provider.

- **FluxCD**: annotates `FluxInstance/flux`, `Kustomization/loko-root`, and `GitRepository/loko-gitops` with `reconcile.fluxcd.io/requestedAt`
- **ArgoCD**: patches `Application/loko-root` to trigger an immediate sync

```bash
loko gitops reconcile [OPTIONS]
```

**Example**:
```bash
loko gitops reconcile
```

---

### gitops reset

Destroy and re-initialize GitOps while keeping `gitops.enabled: true` in `loko.yaml`.

```bash
loko gitops reset [OPTIONS]
```

**Options**:
- `--provider [fluxcd|argocd]` - Provider to use after reset (default: from `loko.yaml`)
- `--org TEXT` - Forgejo organization for the repository
- `--force` - Skip confirmation prompt
- `--verbose` - Show underlying command output

---

## Registry Commands

### registry status

Show registry statistics and configuration.

```bash
loko registry status [OPTIONS]
```

**Options**:
- `--format TEXT` - Output format (`rich`, `json`, `text`)

---

### registry repos

List all repositories in the registry. Alias: `ls`.

```bash
loko registry repos [OPTIONS]
```

---

### registry show-repo

Show details and tags for a specific repository.

```bash
loko registry show-repo REPOSITORY [OPTIONS]
```

**Arguments**:
- `REPOSITORY` - Repository name (e.g., `myapp` or `docker.io/library/nginx`)

---

### registry list-tags

List all tags for a repository.

```bash
loko registry list-tags REPOSITORY [OPTIONS]
```

**Arguments**:
- `REPOSITORY` - Repository name

**Example**:
```bash
loko registry list-tags myapp
```

---

### registry purge-repo

Delete all tags from a specific repository.

```bash
loko registry purge-repo REPOSITORY [OPTIONS]
```

**Arguments**:
- `REPOSITORY` - Repository name

**Options**:
- `--force` / `-f` - Skip confirmation prompt

**Example**:
```bash
loko registry purge-repo myapp --force
```

---

### registry purge

Delete all tags from every repository in the registry.

```bash
loko registry purge [OPTIONS]
```

**Options**:
- `--force` / `-f` - Skip confirmation prompt

---

### registry load-image

Load locally built image(s) into the Kind cluster via `kind load docker-image`. Useful during development to avoid a push/pull cycle.

```bash
loko registry load-image IMAGE... [OPTIONS]
```

**Arguments**:
- `IMAGE` - One or more image names (e.g., `myapp:latest`)

**Options**:
- `--nodes TEXT` / `-n` - Comma-separated list of cluster nodes (default: all nodes)

**Examples**:
```bash
loko registry load-image myapp:latest
loko registry load-image myapp:latest myapp:v1.0.0
loko registry load-image myapp:latest --nodes kind-worker
```

---

## Check Commands

### check prerequisites

Check required tools.

```bash
loko check prerequisites
```

Verifies installation of required tools (Docker, Kind, Helm, Helmfile, kubectl, mkcert, stern, aws, mise) and optional tools (ngrok). Shows install URLs for any missing tools.

See [Prerequisites](../getting-started/prerequisites) for details.

---

### check terminal

Check terminal capabilities for rich output.

```bash
loko check terminal
```

Checks terminal capabilities for rich output (colors, Unicode, etc.).

---

## Status & Info Commands

### status

Show environment health status (Phase 4).

```bash
loko status [OPTIONS]
```

**Options**:
- `--short` - Show compact table view instead of detailed panels
- `--workloads` - Show detailed per-service breakdown for workloads
- `--format TEXT` - Output format (`rich`, `json`, `text`)
- `--force-color` - Force colored output even when piping

**Health Components**:
- **Cluster**: Kubernetes cluster running state
- **DNS**: CoreDNS in-cluster service and OS resolver configuration
- **Tunnel**: HAProxy TCP load balancer for database access
- **Registry**: Local OCI registry (if enabled)
- **Workloads**: Deployed services health status

**Health States**:
- ✓ **Healthy** (green) - Component running normally
- ⚠ **Degraded** (yellow) - Running but issues detected
- ⏸ **Stopped** (gray) - Component stopped
- ○ **Not Configured** (dim) - Component not enabled

**Examples**:
```bash
# Default: detailed panel view
loko status

# Compact table view
loko status --short

# JSON output for scripting
loko status --format json

# Detailed workload breakdown
loko status --workloads
```

**Example Output** (panel view):
```
╭─────────────────── Cluster ────────────────────╮
│ ✓ Cluster running                              │
│ Provider: kind                                 │
│ Nodes: 2 ready (1 control-plane, 1 worker)    │
╰────────────────────────────────────────────────╯

╭────────────────── DNS ─────────────────────────╮
│ ✓ DNS healthy                                  │
│ Service: running (coredns + dns-operator)      │
│ Resolver: configured (/etc/resolver/dev.me)    │
╰────────────────────────────────────────────────╯
```

---

### version

Show LoKO version.

```bash
loko version
```

---

## Global Options

Available for all commands:

- `--help` / `-h` - Show help message
- `--debug` - Enable debug output
- `--config FILE` - Use custom config file
- `--env NAME` - Use specific environment

**Example**:
```bash
loko --debug env create
loko --config custom.yaml workload deploy postgres
```

---

## Shell Completion

Enable shell completion for easier command usage:

```bash
# Bash
eval "$(loko --show-completion bash)"

# Zsh
eval "$(loko --show-completion zsh)"

# Fish
loko --show-completion fish | source
```

See [Shell Completions](../user-guide/shell-completions) for details.

---

## See Also

- [User Guide](../user-guide/index) - Comprehensive usage guide
- [Workload Management](../user-guide/workload-management) - Workload operations
- [Catalog Management](catalog/management) - Catalog operations
- [Environment Lifecycle](../user-guide/environment-lifecycle) - Environment operations
