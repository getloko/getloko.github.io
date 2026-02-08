---
title: "Configuration"
---


**One file. Your entire environment.**

LoKO uses a single `loko.yaml` file to define your complete local Kubernetes setup. Change the file, run `loko config sync`, and your environment updates. **Infrastructure as code that actually works.**

## Why Declarative Configuration?

### The Old Way (Imperative Hell)

```bash
# Manually create cluster
kind create cluster --config cluster.yaml

# Install ingress controller
kubectl apply -f https://raw.githubusercontent.com/...ingress-nginx.yaml
# Wait for it...
kubectl wait --for=condition=ready pod...

# Set up DNS
sudo vim /etc/hosts  # Add postgres.local
sudo vim /etc/hosts  # Add redis.local
sudo vim /etc/hosts  # Add myapp.local
# Breaks after reboot, repeat...

# Install PostgreSQL
helm repo add bitnami https://...
helm install postgres bitnami/postgresql \
  --set auth.password=$(openssl rand -base64 32) \
  --set primary.persistence.size=10Gi \
  --set volumePermissions.enabled=true \
  # 50 more lines...

# Oh, you changed one setting? Start over.
```

**You spend hours repeating commands, fighting drift, and maintaining state in your head.**

### The LoKO Way (Declarative Simplicity)

```yaml
# loko.yaml
name: my-project
cluster:
  workers: 2
workloads:
  postgres:
    enabled: true
    storage: 10Gi
```

```bash
loko env create
# Done. Everything configured.

# Need to change something?
vim loko.yaml  # Edit workers: 3, storage: 20Gi
loko config sync
# Updated automatically.
```

**Your environment is code. Version it. Review it. Reproduce it.**

---

## Generating Configuration

LoKO can auto-generate your configuration file with sensible defaults and auto-detected settings.

### Quick Start

```bash
loko config generate
```

**What it does:**
- Auto-detects your local IP address
- Generates `loko.yaml` with sensible defaults
- Adds helpful comments explaining each option
- Sets up proper network, cluster, and component configuration

**Example output:**
```yaml
name: dev
network:
  ip: 192.168.1.100      # Auto-detected
  domain: dev.me         # Default domain
cluster:
  workers: 2             # Sensible default
gitops:
  enabled: false
  provider: fluxcd       # or argocd
workloads:
  system: []
  user: []
```

### Regenerating Configuration

```bash
loko config generate --force
```

Overwrites your existing `loko.yaml` with fresh defaults and auto-detected IP.

**Use when:** You want to reset your config file or start fresh after changes.

### Force Regeneration

```bash
loko config generate --force
```

Overwrites existing `loko.yaml` (backup created automatically as `loko.yaml.backup`).

**Use when:** You want to reset to defaults or your config is corrupted.

## Configuration Structure

The `loko.yaml` file follows a structured schema with these main sections:

```yaml
# Environment metadata
name: string                    # Environment name (used for cluster naming)
base-dir: string                # Storage directory (default: .loko)
expand-env-vars: boolean        # Enable ${VAR} expansion

# Cluster configuration
cluster:
  kubernetes:
    api-port: integer           # Kubernetes API port (default: 6443)
    image: string               # Kind node image (default: kindest/node)
    tag: string                 # Kubernetes version (e.g., v1.35.0)
  nodes:
    control-planes: integer     # Control-plane count (always 1)
    workers: integer            # Worker node count (default: 2)

# Network configuration
network:
  ip: string                    # Local IP address (auto-detected)
  domain: string                # Base domain (default: dev.me)
  dns-port: integer             # CoreDNS NodePort (auto-selected from 30000–32767)
  lb-ports: [80, 443]           # Load balancer ports

# Infrastructure components
components:
  ingress-controller:           # Traefik ingress
    version: string             # Chart version
    dashboard: boolean          # Enable Traefik dashboard at traefik.<domain> (default: false)
  registry:                     # Zot container registry
    version: string             # Chart version
  metrics-server:               # Kubernetes metrics (optional)
    enabled: boolean

# Workload configuration
workloads:
  use-presets: boolean          # Use catalog presets (default: true)
  system: []                    # System workloads (databases, caches, etc.)
  user: []                      # User applications

# GitOps configuration
gitops:
  enabled: boolean              # Enable GitOps integration (default: false)
  provider: fluxcd|argocd       # GitOps provider (default: fluxcd)
```

### Schema Sections Explained

**Environment**:
- `name`: Used for cluster naming (`loko-{name}`)
- `base-dir`: Where LoKO stores state (default: `.loko/`)

**Cluster**:
- `kubernetes.tag`: Kubernetes version to use (matches Kind node images)
- `nodes.workers`: Number of worker nodes (1-5 recommended for local dev)

**Network**:
- `network.ip`: Auto-detected local IP (can override manually)
- `network.domain`: Base domain for all services (default: `dev.me`)
- `network.dns-port`: CoreDNS NodePort — auto-selected from the 30000–32767 range, rarely needs manual configuration

**Components**:
- `ingress-controller`: Traefik for ingress routing
- `registry`: Zot registry for container images
- `metrics-server`: Optional Kubernetes metrics API

**Workloads**:
- `system`: Pre-configured catalog workloads (PostgreSQL, Redis, etc.)
- `user`: Your custom applications

## Key Configuration Sections

### Environment Name

```yaml
name: dev-myproject
```

Used for:
- Cluster name prefix
- Directory naming (`.loko/dev-myproject/`)
- Resource naming

### Network Configuration

```yaml
network:
  ip: 192.168.1.100           # Your local IP
  domain: mydev.local         # Base domain
  # dns-port is auto-selected from NodePort range (30000–32767)
```

**Resulting DNS:**
- System: `postgres.mydev.local`
- User: `myapp.mydev.local`
- Preview: `myapp-pr-1.pr.mydev.local`
- Registry: `cr.mydev.local`

### Cluster Configuration

```yaml
cluster:
  kubernetes:
    image: kindest/node
    tag: v1.35.0              # Kubernetes version
    api-port: 6443

  nodes:
    control-planes: 1         # Control-plane nodes (always 1)
    workers: 2                # Worker nodes
```

**Node Scheduling:**

```yaml
cluster:
  nodes:
    scheduling:
      control-plane:
        isolate-internal-components: true  # Force Traefik/registry here
      # Note: allow-workloads and isolate-workloads are auto-configured based on worker count
```

**Node Labels:**

```yaml
cluster:
  nodes:
    labels:
      control-plane:
        tier: infrastructure
      worker:
        tier: application
```

### Workload Configuration

```yaml
workloads:
  use-presets: true           # Use catalog presets

  system:
    - name: postgres
      enabled: true
      namespace: common-services
      # Preset values from catalog

    - name: mysql
      enabled: false
      namespace: common-services
      storage: 10Gi

  user:
    - name: myapp
      enabled: true
      namespace: apps
      config:
        chart: myrepo/myapp
        version: 1.0.0
        values:
          ingress:
            enabled: true
            host: myapp.mydev.local
```

### Registry Configuration

```yaml
registry:
  name: cr                  # Registry subdomain
  storage: 20Gi
  mirroring:
    enabled: true
    sources:
      - name: docker_hub
        enabled: true
      - name: quay
        enabled: true
      - name: ghcr
        enabled: true
```

## Configuration Validation

LoKO validates your configuration before using it to prevent errors.

### Validate Syntax

```bash
loko config validate
```

**Checks for:**
- ✅ YAML syntax errors
- ✅ Required fields present
- ✅ Type mismatches (e.g., string instead of integer)
- ✅ Invalid values (e.g., port out of range)
- ✅ Schema compliance

**Example validation output:**
```
✓ YAML syntax valid
✓ All required fields present
✓ Schema validation passed
✓ Network configuration valid
✓ Cluster configuration valid
✓ Workload definitions valid

Configuration is valid ✓
```

### Check Port Availability

```bash
loko check ports
```

Verifies all configured ports are available before creating environment.

**Checks:**
- DNS port (default: 53)
- Load balancer ports (80, 443)
- Kubernetes API port (6443)

### Sync Configuration

```bash
# Dry-run (show changes)
loko config sync

# Apply changes
loko config sync
```

**What it does:**
- Compares current `loko.yaml` with running environment
- Shows what would change
- Applies safe updates to the running environment

**Use when:** You've modified `loko.yaml` and want to update the running environment without recreating it.

## CLI Overrides

Override any config value via CLI:

```bash
loko init \
  --name my-cluster \
  --workers 3 \
  --local-ip 192.168.1.100 \
  --local-domain mydev.local \
  --registry-storage 50Gi \
  --no-schedule-on-control
```

## Version Management

### Renovate Comments

Add renovate comments for automatic version upgrades:

```yaml
cluster:
  kubernetes:
    image: kindest/node
    # renovate: datasource=docker depName=kindest/node
    tag: v1.35.0

components:
  ingress-controller:
    # renovate: datasource=helm depName=traefik repositoryUrl=https://traefik.github.io/charts
    version: "38.0.2"
```

### Upgrade Versions

```bash
loko config upgrade
```

Fetches latest versions and updates `loko.yaml`. Creates backup as `loko-prev.yaml`.

## Environment Variables

### Expansion

```yaml
expand-env-vars: true

network:
  ip: ${MY_LOCAL_IP}          # From environment
  domain: ${USER}.local       # System variable
```

### Loko Variables

```yaml
workloads:
  user:
    - name: myapp
      config:
        values:
          ingress:
            host: myapp.${LOKO_DOMAIN}  # Auto-provided
```

Available: `LOKO_DOMAIN`, `LOKO_IP`, `LOKO_ENV_NAME`

## Multiple Environments

### Separate Config Files

```bash
# Create configs
loko config generate --name dev-project-a -o loko-project-a.yaml
loko config generate --name dev-project-b -o loko-project-b.yaml

# Use specific config
loko env create --config-file loko-project-a.yaml
loko status --config-file loko-project-a.yaml
```

### Environment Profiles

```yaml
# loko-dev.yaml
name: dev
cluster:
  nodes:
    workers: 2

# loko-prod-like.yaml
name: prod-like
cluster:
  nodes:
    workers: 5
```

## Real Developer Workflows

### Full-Stack Developer: API + Database + Frontend

```yaml
# loko.yaml
name: my-saas-app
cluster:
  workers: 2

workloads:
  postgres:
    enabled: true
    storage: 10Gi

  valkey:
    enabled: true  # Redis-compatible cache
```

**Workflow**:
```bash
# Create environment
loko env create

# Build and deploy API
docker build -t cr.dev.me/api:latest ./api
docker push cr.dev.me/api:latest
kubectl apply -f k8s/api/

# Build and deploy frontend
docker build -t cr.dev.me/frontend:latest ./frontend
docker push cr.dev.me/frontend:latest
kubectl apply -f k8s/frontend/

# Access:
# - API: https://api.dev.me
# - Frontend: https://app.dev.me
# - Database: psql -h postgres.dev.me -U postgres
# - Cache: redis-cli -h valkey.dev.me
```

### Platform Engineer: Testing Helm Charts

```yaml
# loko.yaml
name: chart-testing
cluster:
  workers: 3  # Test pod affinity/anti-affinity

workloads:
  postgres:
    enabled: true
  rabbitmq:
    enabled: true
```

**Workflow**:
```bash
# Create multi-node cluster
loko env create

# Test your Helm chart
helm install myapp ./charts/myapp --dry-run
helm install myapp ./charts/myapp

# Test upgrades
helm upgrade myapp ./charts/myapp

# Verify multi-node behavior
kubectl get pods -o wide  # Check pod distribution
```

### Backend Developer: Microservices Development

```yaml
# loko.yaml
name: microservices
cluster:
  workers: 2

workloads:
  postgres:
    enabled: true
  rabbitmq:
    enabled: true
  valkey:
    enabled: true
  garage:
    enabled: true  # S3-compatible storage
```

**Workflow**:
```bash
# Create environment with all services
loko env create

# Each microservice can now use:
# - postgres.dev.me:5432 (database)
# - rabbitmq.dev.me:5672 (messaging)
# - valkey.dev.me:6379 (cache)
# - garage.dev.me (S3 storage)

# Develop and test locally
docker-compose up  # Or deploy to cluster
```

---

## Configuration Patterns

### Development Environment

**Fast iteration, minimal resources**:

```yaml
name: dev
cluster:
  workers: 1  # Single worker for speed

workloads:
  postgres:
    enabled: true
    storage: 5Gi  # Smaller storage

  valkey:
    enabled: true
```

### Staging/Production-Like Environment

**Test at scale, match production**:

```yaml
name: staging
cluster:
  workers: 5  # Match production node count

workloads:
  postgres:
    enabled: true
    storage: 50Gi  # Production-like storage
    config:
      replicas: 3  # HA configuration

  valkey:
    enabled: true
    config:
      replicas: 3
```

### Multi-Project Setup

**Isolate different projects**:

```bash
# Create separate configs
cat > loko-project-a.yaml <<EOF
name: project-a
cluster:
  workers: 2
workloads:
  postgres:
    enabled: true
  rabbitmq:
    enabled: true
EOF

cat > loko-project-b.yaml <<EOF
name: project-b
cluster:
  workers: 1
workloads:
  mongodb:
    enabled: true
  nats:
    enabled: true
EOF

# Use them independently
loko env create --config-file loko-project-a.yaml
loko env create --config-file loko-project-b.yaml

# Switch between projects
loko status --config-file loko-project-a.yaml
loko status --config-file loko-project-b.yaml
```

---

## Best Practices

### ✅ Do

- **Version control `loko.yaml`** - Share configs with your team
- **Use renovate comments** - Keep versions up-to-date automatically
- **Document custom settings** - Future you will thank you
- **Use catalog presets** - Don't reinvent PostgreSQL configuration
- **Test with `config sync`** - Preview changes before applying
- **Start small, scale up** - Begin with 1 worker, add more as needed

### ❌ Don't

- **Hardcode IPs** - Use auto-detection for portability
- **Store secrets** - LoKO auto-generates and saves them separately
- **Use port 53** - Change to 5353 if conflict with systemd-resolved
- **Modify generated configs** - Edit `loko.yaml` instead (they regenerate)
- **Over-provision** - 2-3 workers is plenty for local development

## Troubleshooting

### Config Syntax Error

```bash
# Validate YAML
loko config validate

# Check specific section
cat loko.yaml | yq '.cluster'
```

### DNS Not Resolving

```bash
# Check CoreDNS and dns-operator pods
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get pods -n loko-components -l app.kubernetes.io/name=dns-operator

# Recreate DNS
loko dns recreate
```

### Workload Not Deploying

```bash
# Check workload is enabled
yq '.workloads.system[] | select(.name == "postgres")' loko.yaml

# Enable it
loko workloads enable postgres
```

## Examples

See `loko.yaml.comprehensive.example` in the repository for a complete example with all options.

## Next Steps

- [Environment Lifecycle](environment-lifecycle) - Manage environments
- [Workload Management](workload-management) - Deploy services
- [Config Schema Reference](../reference/config-schema) - Complete schema
