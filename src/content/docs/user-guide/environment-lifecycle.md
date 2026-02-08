---
title: "Environment Lifecycle"
---


This guide covers the complete lifecycle of a LoKO environment from creation to cleanup.

## Targeting Environments

LoKO now keeps an active environment marker in inventory. For most runtime commands, LoKO resolves the target environment in this order:

1. explicit `--config` / `-c`
2. the active environment from inventory
3. local `./loko.yaml`

That means you can activate an environment once and then run commands like `loko status`, `loko env stop`, or `loko workloads deploy postgres` from outside that environment's project directory.

Most commands that operate on an existing environment, including most `config ...` commands, follow the same order. Commands that create or generate config files still act on the local file you point them at.

## Environment States

A LoKO environment can be in several states:

- **Not Created** - Configuration exists but cluster not created
- **Running** - Cluster is active and workloads are accessible
- **Stopped** - Cluster containers are stopped but data is preserved
- **Destroyed** - Cluster deleted but configuration files remain

## Lifecycle Commands

### Initialize Environment

Set up configuration files, certificates, and DNS (without creating cluster):

```bash
loko init
```

This performs:
- Generates configuration files
- Creates TLS certificates with LoKO's `cfssl`-based certificate flow
- Starts DNS service
- Does NOT create the Kubernetes cluster

**CLI Overrides:**

```bash
loko init \
  --name my-cluster \
  --workers 3 \
  --local-ip 192.168.0.10 \
  --local-domain mydev.local
```

### Create Environment

Create the complete environment (runs `init` + cluster creation + workload deployment):

```bash
loko env create
```

This is equivalent to:
```bash
loko init
loko cluster create
loko workloads deploy --internal
```

**What happens:**
1. ✅ Initialize (if not done)
2. ✅ Create Kind cluster
3. ✅ Deploy Traefik ingress controller
4. ✅ Deploy Zot registry
5. ✅ Deploy metrics-server (if enabled)
6. ✅ Deploy enabled workloads
7. ✅ Validate environment

### Activate Environment

Switch from the current environment to another previously created one:

```bash
loko env activate my-other-env
```

What happens:
1. LoKO stops the current active environment
2. LoKO starts the target environment
3. LoKO refreshes the target kubeconfig and switches the current `kubectl` context to it
4. LoKO marks the target as the active environment in inventory

Use this when you have multiple LoKO environments on the same machine and want to move between them without manually stopping one environment and starting another.

**Requirements:**
- The target environment must already exist in inventory
- The target cluster must already be created
- You can also use the top-level alias: `loko activate my-other-env`

After activation, most runtime commands target that environment even if you are not in its directory.

### Start, Stop, and Destroy

Once an environment is active, these commands usually work without `-c`:

```bash
loko env start
loko env stop
loko env destroy
loko status
loko workloads deploy postgres
```

Use `-c /path/to/other-config.yaml` when you want to override the active environment explicitly.

### Inspect and Browse Environment Data

Use these commands to find or open the environment base directory that stores kubeconfig, certificates, logs, and persistent data:

```bash
loko env show
loko env browse
```

Both commands use the active environment when you omit `ENV_NAME`:

```bash
loko env show my-other-env
loko env browse my-other-env
```

### Inventory Hygiene

Use inventory commands to inspect and repair environment metadata:

```bash
loko inventory list
loko inventory check
loko inventory vacuum
```

`inventory list` shows which environment is active. `inventory check` validates stale inventory state, including broken active markers. `inventory vacuum` removes stale entries and, when safe, also removes stale resolver files for domains no longer used by any remaining inventory entry.

## Monitoring Environment Health

After creating an environment, use the `loko status` command to monitor component health and diagnose issues.

### Health Status Command

The `loko status` command provides comprehensive environment health information:

```bash
# Check overall environment health (rich panel view)
loko status

# Compact table view (summary only)
loko status --short

# Include detailed workload breakdown
loko status --workloads

# JSON format for scripting and automation
loko status --format json
```

### Health States

Each component reports one of four health states:

| State | Symbol | Meaning | Action |
|-------|--------|---------|--------|
| **healthy** | ✓ (green) | Component is running and functional | None needed |
| **degraded** | ⚠ (yellow) | Component is running but has issues | Investigate details in status output |
| **stopped** | ✗ (red) | Component exists but is not running | Start with `loko env start` |
| **not_configured** | ○ (dim) | Component is not set up | Enable in config or deploy |

### Components Monitored

Status checks these components in dependency order:

1. **Cluster** - Kubernetes cluster running state
   - Details: Provider (kind), node count, node status
   - Healthy: Cluster running, all nodes ready
   - Stopped: Cluster containers stopped
   - Not Configured: Cluster never created

2. **Registry** - Local OCI registry for images
   - Details: Registry name, storage capacity
   - Healthy: Registry pod running, accessible
   - Stopped: Registry pod not running
   - Not Configured: Registry disabled in config

3. **DNS** - DNS service and OS resolver
   - Details: DNS container, resolver file, port
   - Healthy: DNS container running, resolver configured
   - Degraded: Port conflicts, resolver missing
   - Stopped: DNS container stopped

4. **Tunnel** - HAProxy TCP load balancer
   - Details: Tunnel port, container status
   - Healthy: Tunnel container running
   - Stopped: Tunnel container not running
   - Not Configured: Tunnel not enabled

5. **Workloads** - Deployed services
   - Details: Pod counts, ready status
   - Healthy: All pods running and ready
   - Degraded: Some pods not ready
   - Not Configured: No workloads deployed

### Examples

#### Healthy Environment

```bash
$ loko status

╭─────────────────── Cluster ────────────────────╮
│ ✓ Cluster running                              │
│ Provider: kind                                 │
│ Nodes: 2 ready (1 control-plane, 1 worker)    │
╰────────────────────────────────────────────────╯

╭────────────────── Registry ────────────────────╮
│ ✓ Registry healthy                             │
│ Service: running (zot)                         │
│ Storage: 15.2 GB / 50 GB used                  │
╰────────────────────────────────────────────────╯

╭────────────────── DNS ─────────────────────────╮
│ ✓ DNS healthy                                  │
│ Service: running (dnsmasq)      │
│ Resolver: configured (/etc/resolver/dev.me)    │
╰────────────────────────────────────────────────╯

╭────────────────── Tunnel ──────────────────────╮
│ ✓ Tunnel healthy                               │
│ Service: running (haproxy)                     │
│ Port: 8000                                     │
╰────────────────────────────────────────────────╯

╭────────────────── Workloads ───────────────────╮
│ ✓ Workloads healthy                            │
│ Pods: 12/12 ready                              │
│ Services: postgres, redis, rabbitmq            │
╰────────────────────────────────────────────────╯

✓ Loko is healthy
```

#### Environment with Issues

```bash
$ loko status

╭─────────────────── Cluster ────────────────────╮
│ ✓ Cluster running                              │
│ Provider: kind                                 │
│ Nodes: 2 ready (1 control-plane, 1 worker)    │
╰────────────────────────────────────────────────╯

╭────────────────── Registry ────────────────────╮
│ ✓ Registry healthy                             │
│ Service: running (zot)                         │
│ Storage: 15.2 GB / 50 GB used                  │
╰────────────────────────────────────────────────╯

╭────────────────── DNS ─────────────────────────╮
│ ⚠ DNS degraded                                 │
│ Service: running (dnsmasq)      │
│ Issue: Resolver misconfigured                  │
│                                                │
│ → Run: loko dns recreate                       │
│ → See troubleshooting guide                    │
╰────────────────────────────────────────────────╯

╭────────────────── Tunnel ──────────────────────╮
│ ✓ Tunnel healthy                               │
│ Service: running (haproxy)                     │
│ Port: 8000                                     │
╰────────────────────────────────────────────────╯

╭────────────────── Workloads ───────────────────╮
│ ⚠ Workloads degraded                           │
│ Pods: 10/12 ready                              │
│ Not Ready: postgres-0, redis-0                 │
│                                                │
│ → Check logs: loko logs workload <workload-name>       │
│ → Check pods: kubectl get pods -A             │
╰────────────────────────────────────────────────╯

⚠ 2 components need attention
```

### Interpreting Status Output

Use status output to determine next steps:

**All components healthy** → Environment is ready for use

**Cluster stopped** → Run `loko env start` to start containers

**DNS degraded** → Port conflict detected
- Check what's using port 53: `sudo lsof -i :53`
- See [Troubleshooting - DNS Issues](../reference/troubleshooting#issue-1-dns-not-resolving)

**Registry stopped** → Check if enabled in config
- Verify registry enabled in loko.yaml
- Restart: `kubectl rollout restart deployment -n kube-system zot`

**Workloads not_configured** → No workloads deployed
- Deploy system workloads: `loko workloads deploy --internal`
- Deploy specific workload: `loko workloads deploy <name>`

**Workloads degraded** → Some pods not ready
- Check logs: `loko logs workload <workload-name>`
- Check pod status: `kubectl get pods -A`
- Check events: `kubectl get events -A --sort-by='.lastTimestamp'`

### Common Status Scenarios

#### Scenario 1: Fresh Environment

```bash
$ loko status --short
Component    State             Details
-----------  ----------------  ---------------------------
Cluster      not_configured    Not created yet
Registry     not_configured    Not enabled
DNS          not_configured    Not configured
Tunnel       not_configured    Not enabled
Workloads    not_configured    None deployed

→ Next step: loko env create
```

#### Scenario 2: Stopped Environment

```bash
$ loko status --short
Component    State      Details
-----------  ---------  ---------------------------
Cluster      stopped    Containers stopped
Registry     stopped    Pod not running
DNS          healthy    Container running
Tunnel       stopped    Container stopped
Workloads    stopped    Pods not running

→ Next step: loko env start
```

#### Scenario 3: Post-Reboot

```bash
$ loko status
# DNS and Tunnel containers may need restart
# Cluster containers stopped

→ Actions:
1. Start cluster: loko env start
2. Verify DNS: loko check dns
```

### Integration with Troubleshooting

When status shows unhealthy components, consult the troubleshooting guide:

- **DNS issues** → [Issue #1: DNS Not Resolving](../reference/troubleshooting#issue-1-dns-not-resolving)
- **DNS not resolving** → [Issue #7: DNS Not Resolving](../reference/troubleshooting#issue-7-dns-not-resolving-test-domains)
- **Workload failures** → [Issue #6: Workload Deployment Fails](../reference/troubleshooting#issue-6-workload-deployment-fails)
- **General issues** → [Diagnostic Workflow](../reference/troubleshooting#diagnostic-workflow)

### Scripting with JSON Format

Use JSON output for automation and monitoring:

```bash
# Get status as JSON
loko status --format json

# Example output structure:
{
  "components": [
    {
      "name": "Cluster",
      "state": "healthy",
      "details": {
        "provider": "kind",
        "nodes_ready": 2,
        "nodes_total": 2
      }
    },
    {
      "name": "DNS",
      "state": "degraded",
      "details": {
        "container_running": true,
        "resolver_configured": false
      },
      "guidance": "Check resolver configuration"
    }
  ],
  "summary": "⚠ 1 component needs attention"
}
```

**Scripting examples:**

```bash
# Check if environment is healthy
if loko status --format json | jq -e '.summary | contains("healthy")' > /dev/null; then
  echo "Environment ready"
else
  echo "Issues detected"
  loko status
fi

# Count unhealthy components
UNHEALTHY=$(loko status --format json | jq '[.components[] | select(.state != "healthy")] | length')
echo "Unhealthy components: $UNHEALTHY"

# Get specific component state
DNS_STATE=$(loko status --format json | jq -r '.components[] | select(.name == "DNS") | .state')
echo "DNS state: $DNS_STATE"
```

### Start Environment

Start a stopped environment:

```bash
loko env start
```

This starts all Docker containers for the cluster. Data and state are preserved.

**Use when:**
- After `loko env stop`
- After system reboot
- To resume work

### Stop Environment

Stop the environment without deleting it:

```bash
loko env stop
```

This stops all cluster containers but preserves:
- ✅ Persistent volumes
- ✅ Configuration files
- ✅ Generated configs
- ✅ Certificates

**Use when:**
- Taking a break from development
- Freeing system resources
- Preserving work for later

### Destroy Environment

Delete the cluster but keep configuration:

```bash
loko env destroy
```

This deletes:
- ❌ Kind cluster
- ❌ Cluster containers

This preserves:
- ✅ Configuration files (loko.yaml)
- ✅ Generated configs
- ✅ Certificates
- ✅ DNS service

**Use when:**
- Need to recreate cluster from scratch
- Want to test cluster creation
- Configuration changed requiring cluster recreation

### Recreate Environment

Destroy and create in one command:

```bash
loko env recreate
```

Equivalent to:
```bash
loko env destroy
loko env create
```

**Use when:**
- Cluster is corrupted
- Testing from clean slate
- Applying changes that require cluster recreation

### Clean Environment

Remove everything:

```bash
loko env clean
```

This deletes:
- ❌ Kind cluster
- ❌ DNS service
- ❌ Generated configs
- ❌ Certificates
- ❌ Persistent data

This preserves:
- ✅ loko.yaml (main config)

**Use when:**
- Completely removing environment
- Starting fresh
- Freeing all resources

## Directory Structure

Environment files are stored in:

```
.loko/<env-name>/
├── certs/                  # TLS certificates
├── config/                 # Generated configs
│   ├── cluster.yaml
│   ├── helmfile.yaml
│   └── dnsmasq.conf
├── logs/                   # Kubernetes logs
├── storage/                # Persistent volumes
├── kubeconfig             # Cluster access config
└── ...                     # Runtime-generated artifacts
```

## Lifecycle Workflows

### Daily Development

```bash
# Monday morning
loko env start

# Friday evening
loko env stop
```

### Testing Configuration Changes

```bash
# 1. Edit loko.yaml
vim loko.yaml

# 2. Check what would change
loko config sync

# 3. Apply changes
loko config sync

# Or recreate if needed
loko env recreate
```

### Switching Environments

```bash
# Create multiple configs
loko config generate --name dev-project-a --local-ip 192.168.0.10
loko config generate --name dev-project-b --local-ip 192.168.0.10

# Create both environments
loko env create -c loko-project-a.yaml
loko env create -c loko-project-b.yaml

# Activate the one you want to work on
loko activate dev-project-a
loko status
```

### Cleanup Workflow

```bash
# Soft cleanup (keep data)
loko env destroy

# Hard cleanup (remove everything)
loko env clean

# Nuclear option (remove config too)
loko env clean
rm loko.yaml
```

## State Management

### Check Current State

```bash
# Overall status (health panels view)
loko status

# Compact table view
loko status --short

# JSON output for scripting
loko status --format json

# Detailed workload breakdown
loko status --workloads
```

**Health Status (from Phase 4):**

`loko status` shows health for all components:
- **Cluster**: Kubernetes cluster running state
- **DNS**: dnsmasq container and OS resolver configuration
- **Tunnel**: HAProxy TCP load balancer for database access
- **Registry**: Local OCI registry (if enabled)
- **Workloads**: Deployed services status

**Health states:**
- ✓ **Healthy** (green) - Component running normally
- ⚠ **Degraded** (yellow) - Running but issues detected
- ⏸ **Stopped** (gray) - Component stopped
- ○ **Not Configured** (dim) - Component not enabled

**Example status output:**

```
╭─────────────────── Cluster ────────────────────╮
│ ✓ Cluster running                              │
│ Provider: kind                                 │
│ Nodes: 2 ready (1 control-plane, 1 worker)    │
╰────────────────────────────────────────────────╯

╭────────────────── DNS ─────────────────────────╮
│ ✓ DNS healthy                                  │
│ Service: running (dnsmasq)      │
│ Resolver: configured (/etc/resolver/dev.me)    │
╰────────────────────────────────────────────────╯
```

**Other state commands:**

```bash
# DNS status
loko check dns

# Workload status
loko workloads list
```

### Persistent Data

Data persists across lifecycle transitions:

| Operation | Config | Cluster | Workload Data | DNS |
|-----------|--------|---------|---------------|-----|
| stop | ✅ | ⏸️ | ✅ | ✅ |
| start | ✅ | ✅ | ✅ | ✅ |
| destroy | ✅ | ❌ | ❌ | ✅ |
| clean | ✅ | ❌ | ❌ | ❌ |

## Advanced Scenarios

### Backup Before Destroy

```bash
# Backup persisted state (inventory + secrets + metadata)
loko state export --output ~/backups/loko-state-snapshot.json

# Backup config
cp loko.yaml ~/backups/loko.yaml.backup

# Now safe to destroy
loko env destroy
```

### Migrate to New Host

```bash
# On old host
tar czf loko-backup.tar.gz loko.yaml .loko/

# On new host
tar xzf loko-backup.tar.gz
loko env start
```

### Reset Specific Components

```bash
# Reset DNS only
loko dns recreate

# Redeploy specific workload
loko workloads undeploy postgres
loko workloads deploy postgres

# Regenerate configs
loko config sync
```

## Troubleshooting

### Environment Won't Start

```bash
# Check Docker
docker ps

# Check Kind
kind get clusters

# Recreate cluster
loko env recreate
```

### DNS Issues

```bash
# Check DNS status
loko check dns

# Recreate DNS
loko dns recreate
```

### Stale State

```bash
# Clean everything
loko env clean

# Start fresh
loko env create
```

## Next Steps

- [Configuration Guide](configuration) - Customize your environment
- [Workload Management](workload-management) - Deploy services
- [Troubleshooting](../reference/troubleshooting) - Common issues
