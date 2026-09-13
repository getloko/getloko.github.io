---
title: "Command Reference"
---

Every LoKO command, with flags taken straight from `loko <command> --help`.

## Config resolution

Runtime commands resolve their target environment in this order:

1. explicit `--config` / `-c`
2. the active environment from inventory
3. a local `./loko.yaml`

Commands that *generate* a config act on the path you pass (`-o`, or the local file).

## Global flags

```
    --debug      Show full command tracing detail
-h, --help       help for loko
    --no-color   Disable colored/styled output
-q, --quiet      Suppress all output except critical errors
    --verbose    Show enhanced status details
-v, --version    version for loko
```

These are persistent flags inherited by every subcommand (wired via root's `PersistentPreRunE`), not just the root command.

## AWS commands

### `loko aws`

AWS-compatible workload helpers

```
loko aws [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko aws profile`

Show unified LoKO AWS profile usage for enabled AWS-compatible workloads

```
loko aws profile [flags]
```

## Catalog commands

### `loko catalog`

Catalog commands

```
loko catalog [flags]
```

#### `loko catalog info`

Show catalog information and statistics

```
loko catalog info [flags]
```

#### `loko catalog list`

List available catalog workloads

```
loko catalog list [flags]
```

```
  -c, --category string   Filter by category
      --search string     Filter by search term (matches workload name or description)
```

## Certificate commands

### `loko certs`

Certificate commands

```
loko certs [flags]
```

#### `loko certs ca`

Global LoKO CA commands

```
loko certs ca [command]
```

##### `loko certs ca install`

Generate (if needed) and (re)install the global LoKO CA into the host trust store

```
loko certs ca install [flags]
```

##### `loko certs ca regenerate`

Remove the global LoKO CA, create a new one, and reinstall trust (invalidates every environment's wildcard cert)

```
loko certs ca regenerate [flags]
```

##### `loko certs ca remove`

Remove the global LoKO CA from the host trust store and delete its files

```
loko certs ca remove [flags]
```

##### `loko certs ca status`

Show whether the global LoKO CA exists

```
loko certs ca status [flags]
```

#### `loko certs renew`

Renew the current environment's wildcard certificate, keeping the existing CA

```
loko certs renew [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko certs show`

Show the current environment's wildcard certificate info

```
loko certs show [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

## Check commands

### `loko check`

Run health checks and diagnostics

```
loko check [flags]
```

#### `loko check all`

Run all checks (prerequisites, tools, dns, ports, terminal)

```
loko check all [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko check dns`

Check DNS configuration and resolution status

```
loko check dns [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko check ports`

Check availability of all configured ports

```
loko check ports [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko check prerequisites`

Check required and optional tool prerequisites

```
loko check prerequisites [flags]
```

#### `loko check terminal`

Check terminal capabilities (TTY, color, hyperlinks)

```
loko check terminal [flags]
```

#### `loko check tools`

Check workload client CLI tool presence

```
loko check tools [flags]
```

## Config commands

### `loko config`

Config commands

```
loko config [flags]
```

#### `loko config diff`

Show configuration drift between loko.yaml and generated config files (read-only)

```
loko config diff [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -d, --diff            Show detailed diff for each changed file (default true)
```

#### `loko config dns-check`

Check DNS configuration and resolution status

```
loko config dns-check [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko config expand`

Expand catalog-preset-based workload configs into full explicit form

```
loko config expand [flags]
```

```
  -c, --config string          Path to loko.yaml config file (default "loko.yaml")
      --format string          Output format: yaml or json (default "yaml")
      --in-place               Write the expanded configuration back to --config (takes precedence over --output)
  -o, --output string          Write output to this file instead of stdout
  -w, --workload stringArray   Only expand this workload (repeatable); default expands every system workload
```

#### `loko config generate`

Generate loko.yaml from the built-in starter template

```
loko config generate [flags]
```

```
  -f, --force             Overwrite existing file
      --local-ip string   Use this IP instead of auto-detecting network.ip
  -o, --output string     Output file path (default "loko.yaml")
```

#### `loko config helm-repo`

Manage Helm repositories in the configuration

```
loko config helm-repo [flags]
```

##### `loko config helm-repo add`

Add one or more Helm repositories to the config file

```
loko config helm-repo add [flags]
```

```
  -c, --config string                Path to loko.yaml config file (default "loko.yaml")
      --helm-repo-name stringArray   Helm repository name (repeat with --helm-repo-url for multiple repos)
      --helm-repo-url stringArray    Helm repository URL (must be paired with --helm-repo-name)
```

##### `loko config helm-repo list`

List all Helm repositories configured in the config file

*list, ls*

```
loko config helm-repo list [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

##### `loko config helm-repo remove`

Remove one or more Helm repositories from the config file

```
loko config helm-repo remove [flags]
```

```
  -c, --config string                Path to loko.yaml config file (default "loko.yaml")
      --helm-repo-name stringArray   Helm repository name to remove (can be repeated for multiple repos)
```

#### `loko config port-check`

Check availability of all configured ports

```
loko config port-check [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko config sync`

Sync generated configs with current loko.yaml configuration

```
loko config sync [flags]
```

```
      --apply           Apply safe changes
  -b, --backup          Create backup before applying changes
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -d, --diff            Show detailed diff for each changed file (default true)
```

#### `loko config validate`

Validate the configuration file structure and semantic consistency

```
loko config validate [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --format string   Output format: text or json (default "text")
  -s, --strict          Treat warnings as errors
```

## DNS commands

### `loko dns`

DNS commands

```
loko dns [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko dns recreate`

Recreate the DNS container with updated configuration

```
loko dns recreate [flags]
```

#### `loko dns start`

Start the DNS container

```
loko dns start [flags]
```

#### `loko dns status`

Show host resolver and DNS container status

```
loko dns status [flags]
```

#### `loko dns stop`

Stop the DNS container

```
loko dns stop [flags]
```

#### `loko dns sync`

Restart the DNS container to apply regenerated dnsmasq config

```
loko dns sync [flags]
```

## Environment commands

### `loko env`

Environment lifecycle and control commands

```
loko env [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko env activate`

```
loko env activate [flags]
```

#### `loko env browse`

```
loko env browse [flags]
```

#### `loko env clean`

```
loko env clean [flags]
```

#### `loko env create`

```
loko env create [flags]
```

#### `loko env destroy`

```
loko env destroy [flags]
```

#### `loko env init`

```
loko env init [flags]
```

#### `loko env list`

*list, ls*

```
loko env list [flags]
```

```
      --verbose   Also print base-dir/k8s-version/nodes columns
```

#### `loko env recreate`

```
loko env recreate [flags]
```

#### `loko env restart`

```
loko env restart [flags]
```

#### `loko env show`

```
loko env show [flags]
```

#### `loko env start`

```
loko env start [flags]
```

#### `loko env status`

```
loko env status [flags]
```

#### `loko env stop`

```
loko env stop [flags]
```

#### `loko env validate`

Run full environment validation with integration tests

```
loko env validate [flags]
```

```
      --cleanup   Remove self-test app and namespace after validation (default keeps resources for inspection)
```

## GitOps commands

### `loko gitops`

GitOps commands

```
loko gitops [flags]
```

#### `loko gitops destroy`

Remove GitOps resources from the cluster

```
loko gitops destroy [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --dry-run         Print what would be destroyed without making changes
  -f, --force           Skip confirmation (currently a no-op: no confirmation prompt exists)
```

#### `loko gitops disable`

Disable GitOps in the configuration (optionally destroy immediately with --now)

```
loko gitops disable [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --now             Destroy GitOps immediately after disabling
```

#### `loko gitops enable`

Enable GitOps in the configuration (optionally bootstrap immediately with --now)

```
loko gitops enable [flags]
```

```
  -c, --config string     Path to loko.yaml config file (default "loko.yaml")
  -f, --force             Force re-bootstrap for --now
      --now               Bootstrap GitOps immediately after enabling
  -o, --org string        Forgejo org for --now
  -p, --provider string   GitOps provider for --now (argocd or fluxcd)
  -v, --verbose           Show technical details for --now
```

#### `loko gitops init`

Bootstrap GitOps (ArgoCD or FluxCD) in the cluster

```
loko gitops init [flags]
```

```
  -c, --config string     Path to loko.yaml config file (default "loko.yaml")
  -f, --force             Force re-bootstrap even if GitOps looks already initialized
  -o, --org string        Forgejo org for the GitOps repo (default: loko.yaml gitops.forgejo.org)
  -p, --provider string   GitOps provider (argocd or fluxcd; default: loko.yaml gitops.provider)
  -v, --verbose           Show technical details
```

#### `loko gitops provider`

Show or set the configured GitOps provider

```
loko gitops provider [provider_name] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko gitops reconcile`

Trigger a one-shot GitOps sync/reconcile

```
loko gitops reconcile [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko gitops reset`

Destroy and re-bootstrap GitOps (destroy + init, composed)

```
loko gitops reset [flags]
```

```
  -c, --config string     Path to loko.yaml config file (default "loko.yaml")
  -f, --force             Force re-bootstrap even if GitOps looks already initialized
  -o, --org string        Forgejo org for the GitOps repo (default: loko.yaml gitops.forgejo.org)
  -p, --provider string   GitOps provider (argocd or fluxcd; default: loko.yaml gitops.provider)
  -v, --verbose           Show technical details
```

#### `loko gitops status`

Show GitOps provider and workload sync status

```
loko gitops status [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --json            Output status as JSON
```

## Helm commands

### `loko helm`

Helm commands

```
loko helm [flags]
```

#### `loko helm repo`

Manage Helm repositories in the configuration

```
loko helm repo [flags]
```

##### `loko helm repo add`

Add one or more Helm repositories to the config file

```
loko helm repo add [flags]
```

```
  -c, --config string      Path to loko.yaml config file (default "loko.yaml")
      --name stringArray   Helm repository name (repeat with --url for multiple repos)
      --url stringArray    Helm repository URL (must be paired with --name)
```

##### `loko helm repo list`

List all Helm repositories configured in the config file

*list, ls*

```
loko helm repo list [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

##### `loko helm repo remove`

Remove one or more Helm repositories from the config file

```
loko helm repo remove [flags]
```

```
  -c, --config string      Path to loko.yaml config file (default "loko.yaml")
      --name stringArray   Helm repository name to remove (can be repeated for multiple repos)
```

## Inventory commands

### `loko inventory`

Cluster inventory commands

```
loko inventory [flags]
```

#### `loko inventory check`

Validate inventory consistency (duplicate names, missing active env, stale entries)

```
loko inventory check [flags]
```

#### `loko inventory list`

List every registered environment

*list, ls*

```
loko inventory list [flags]
```

```
      --verbose   Also print base-dir/k8s-version/nodes columns
```

#### `loko inventory vacuum`

Remove stale inventory entries and their orphaned resolver files

```
loko inventory vacuum [flags]
```

```
      --dry-run   Preview what would be removed without making changes
```

## Logs commands

### `loko logs`

View logs from workloads and tunnel containers

```
loko logs [workload|tunnel|k8s] [flags] [<resource>]
```

```
  -c, --config string     Path to loko.yaml config file (default "loko.yaml")
  -t, --tunnel            Shortcut for 'logs tunnel'
  -w, --workload string   Shortcut for 'logs workload <name>'
```

#### `loko logs k8s`

Show logs for native Kubernetes resources (e.g., pod/my-pod, deploy/my-app)

```
loko logs k8s <resource> [flags]
```

```
  -a, --all-containers     All containers
  -c, --config string      Path to loko.yaml config file (default "loko.yaml")
      --container string   Container name
  -f, --follow             Stream logs in real-time
  -n, --namespace string   Kubernetes namespace
  -p, --previous           Previous instance logs
  -s, --since string       Duration (e.g., 5m, 1h)
  -t, --tail int           Number of lines from end (-1 for all) (default 50)
      --timestamps         Include timestamps
```

#### `loko logs tunnel`

Show tunnel container logs

```
loko logs tunnel [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -f, --follow          Stream logs in real-time
  -s, --since string    Duration (e.g., 5m, 1h)
  -t, --tail int        Number of lines from end (-1 for all) (default 50)
      --timestamps      Include timestamps
```

#### `loko logs workload`

View logs from a workload's pods

```
loko logs workload <name> [flags]
```

```
  -a, --all-containers     All containers
  -c, --config string      Path to loko.yaml config file (default "loko.yaml")
      --container string   Container name
  -f, --follow             Stream logs in real-time
  -p, --previous           Previous instance logs
  -s, --since string       Duration (e.g., 5m, 1h)
  -t, --tail int           Number of lines from end (-1 for all) (default 50)
      --timestamps         Include timestamps
      --use-kubectl        Force kubectl (no-op: kubectl is always used)
```

## Registry commands

### `loko registry`

Manage and inspect the local container registry

*registry, ls*

```
loko registry [flags]
```

#### `loko registry list-tags`

List all tags for a repository

```
loko registry list-tags <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --format string   Output format: text or json (default "text")
```

#### `loko registry load-image`

Load locally built image(s) into the Kind cluster

```
loko registry load-image <image...> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -n, --nodes string    Comma-separated list of cluster nodes to load into (default: all nodes)
```

#### `loko registry purge`

Delete all images from the registry

```
loko registry purge [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -f, --force           Skip confirmation (required: no interactive prompt supported)
```

#### `loko registry purge-repo`

Delete all tags from a specific repository

```
loko registry purge-repo <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -f, --force           Skip confirmation (required: no interactive prompt supported)
```

#### `loko registry repo`

Show details about a specific repository

```
loko registry repo <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --format string   Output format: text or json (default "text")
```

#### `loko registry repos`

List all repositories in the registry

*repos, ls*

```
loko registry repos [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --format string   Output format: text or json (default "text")
```

#### `loko registry status`

Show registry statistics and configuration

```
loko registry status [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --format string   Output format: text or json (default "text")
```

## Secrets commands

### `loko secrets`

Secret commands

```
loko secrets [flags]
```

#### `loko secrets fetch`

Fetch and persist credentials for every enabled workload

```
loko secrets fetch [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko secrets show`

Display workload credentials

```
loko secrets show [workload] [flags]
```

```
      --all             Dump all secrets as raw JSON
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

## Selftest commands

### `loko selftest`

Deploy and verify a test application.

```
loko selftest [flags]
```

```
      --cleanup         Only cleanup existing test app
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --keep            Keep test app deployed after verification
```

## Share commands

### `loko share`

Expose an HTTP(S) workload or ingress publicly via ngrok

```
loko share [flags]
```

#### `loko share start`

Start a public ngrok share for a workload or ingress.

```
loko share start [flags]
```

```
  -c, --config string      Path to loko.yaml config file (default "loko.yaml")
  -d, --detach             Run the share in the background (detached mode)
  -i, --ingress string     Kubernetes Ingress resource name
  -n, --namespace string   Namespace for --ingress (default: system namespace)
  -v, --verbose            Show technical details (hostname, policy file path)
  -w, --workload string    Workload name defined in loko.yaml
```

```bash
loko share start -w mysql-ui            # Share workload from loko.yaml
loko share start -i my-ingress          # Share any K8s ingress (system namespace)
loko share start -i my-ingress -n myns  # Share ingress in specific namespace
loko share start -w myapp --detach      # Run in background
```

#### `loko share status`

Show the ngrok share status for this environment

```
loko share status [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko share stop`

Stop the running ngrok share for this environment

```
loko share stop [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

## Tunnel commands

### `loko tunnel`

Manage tunnel container for TCP workload port forwarding

```
loko tunnel [flags]
```

#### `loko tunnel recreate`

Recreate tunnel container with updated port configuration.

```
loko tunnel recreate [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko tunnel start`

Start tunnel container

```
loko tunnel start [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko tunnel status`

Show tunnel container status and forwarded ports

```
loko tunnel status [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko tunnel stop`

Stop tunnel container

```
loko tunnel stop [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

## Workloads commands

### `loko workloads`

Workload commands

```
loko workloads [flags]
```

#### `loko workloads add`

Add one or more catalog workloads to the configuration

```
loko workloads add <name> [<name2> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --disabled        Add the entry disabled instead of enabled
      --now             Deploy the workload(s) immediately (helmfile sync only — run 'loko config sync' for DNS/TCP changes)
```

#### `loko workloads connect`

Show connection strings for a workload (credentials masked unless --show-password)

```
loko workloads connect <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
  -p, --show-password   Show actual password
```

#### `loko workloads deploy`

Deploy workloads via helmfile (requirement check, linked children, pre/post_sync processors, invariant assertion)

```
loko workloads deploy [<name> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads disable`

Disable one or more workloads in the configuration

```
loko workloads disable <name> [<name2> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads enable`

Enable one or more workloads in the configuration

```
loko workloads enable <name> [<name2> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads endpoints`

Show internal/external endpoints for a workload

```
loko workloads endpoints <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads health`

Report per-workload readiness (helm release status + pod readiness)

```
loko workloads health [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads info`

Show catalog + config detail for one workload

```
loko workloads info <name> [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

#### `loko workloads list`

List workloads configured in loko.yaml with their enabled + deployed state

```
loko workloads list [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --disabled        Only show disabled workloads
      --system          Only show system workloads
      --user            Only show user workloads
```

#### `loko workloads remove`

Remove one or more workloads from the configuration

```
loko workloads remove <name> [<name2> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
      --now             Also uninstall the Helm release(s) from the cluster
```

#### `loko workloads undeploy`

Uninstall workload Helm release(s) from the cluster, leaving loko.yaml unchanged

```
loko workloads undeploy <name> [<name2> ...] [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

## Additional commands

### `loko activate`

Activate an environment (stop current, switch context, start target)

```
loko activate [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko clean`

Destroy an environment and remove its config file

```
loko clean [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko completion`

Generate shell completion script.

```
# For bash (~/.bashrc)
```

### `loko create`

Create a local Kubernetes environment

```
loko create [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko destroy`

Destroy a local Kubernetes environment

```
loko destroy [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko doctor`

Check for required tools and Docker daemon status

```
loko doctor [flags]
```

### `loko help`

Help provides help for any command in the application.
Simply type loko help [path to command] for full details.

```
loko help [command] [flags]
```

### `loko init`

Initialize an environment's config artifacts and network (without creating the cluster)

```
loko init [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko recreate`

Destroy and recreate an environment

```
loko recreate [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko restart`

Restart an environment's containers

```
loko restart [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko start`

Start an environment's containers

```
loko start [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko status`

Show environment status

```
loko status [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko stop`

Stop an environment's containers

```
loko stop [flags]
```

```
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko validate`

Run full environment validation with integration tests

```
loko validate [flags]
```

```
      --cleanup         Remove self-test app and namespace after validation (default keeps resources for inspection)
  -c, --config string   Path to loko.yaml config file (default "loko.yaml")
```

### `loko version`

Show version and exit

```
loko version [flags]
```

## Shell completion

```bash
eval "$(loko completion bash)"     # bash
eval "$(loko completion zsh)"      # zsh
loko completion fish | source      # fish
```

See [Shell Completions](/user-guide/shell-completions/).

## See also

- [User Guide](/user-guide/)
- [Workload Management](/user-guide/workload-management/)
- [Environment Lifecycle](/user-guide/environment-lifecycle/)
- [Catalog Source & Updates](/_catalog/remote-sync/)
