---
title: "Workload Management"
---


**Add PostgreSQL in 5 seconds. No YAML. No pain.**

```bash
loko workloads add postgres
loko env create
# Done. PostgreSQL running with DNS, password, and pgAdmin.
```

Remember spending an hour configuring PostgreSQL? Finding the right Helm chart, writing 200 lines of values.yaml, generating passwords, setting up persistence, configuring DNS? **Never again.**

LoKO's workload catalog gives you **pre-configured, battle-tested services** that just work. One command. Complete setup.

---

## Why the Catalog Matters

### DIY PostgreSQL (The Old Way)

```bash
# Find a Helm chart (which one? bitnami? groundhog2k? official?)
helm search repo postgres
# Read documentation for 30 minutes

# Create values.yaml
cat > postgres-values.yaml <<EOF
auth:
  postgresPassword: $(openssl rand -base64 32)  # Generate password
  database: mydb
primary:
  persistence:
    enabled: true
    size: 10Gi
    storageClass: standard
  resources:
    limits:
      memory: 512Mi
volumePermissions:
  enabled: true
  securityContext:
    runAsUser: 0
metrics:
  enabled: false
# ... 150 more lines
EOF

# Install
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql -f postgres-values.yaml

# Wait for it to be ready
kubectl wait --for=condition=ready pod/postgres-0 --timeout=300s

# Get password (where was it again?)
kubectl get secret postgres-postgresql -o jsonpath='{.data.postgres-password}' | base64 -d

# Access it
kubectl port-forward svc/postgres-postgresql 5432:5432
# Keep this terminal open forever...
```

**Time spent**: 45-60 minutes. **Fun had**: None.

### LoKO PostgreSQL (The Better Way)

```bash
loko workloads add postgres
loko env create
```

**Time spent**: 10 seconds. **Everything you get**:
- ✅ PostgreSQL running on postgres.dev.me:5432
- ✅ Password auto-generated and saved
- ✅ pgAdmin web UI at https://postgres-ui.dev.me
- ✅ Persistent storage (10Gi default, configurable)
- ✅ Health checks configured
- ✅ Connection strings ready

Access it:
```bash
psql -h postgres.dev.me -U postgres
# Or web UI: https://postgres-ui.dev.me
```

**That's why the catalog exists.** Stop configuring infrastructure. Start building apps.

---

## Workload Types

### System Workloads

Infrastructure services like databases and message queues:

- **Databases**: PostgreSQL, MySQL, MongoDB
- **Cache**: Valkey (Redis-compatible)
- **Message Queues**: RabbitMQ
- **Object Storage**: Garage (S3-compatible)

DNS: `<workload>.${DOMAIN}` (e.g., `postgres.dev.me`)

### User Workloads

Your custom applications:

- Custom Helm charts
- Local images
- Third-party applications

DNS: `<workload>.apps.${DOMAIN}` or `<workload>.${DOMAIN}` (configurable)

### Internal Components

In-cluster components managed by LoKO:

- **Traefik**: Ingress controller (required, cannot be disabled)
- **Zot**: Container registry (optional, can be disabled)
- **metrics-server**: Resource metrics (optional, can be disabled)

Outside-of-cluster components:

- **HAProxy**: TCP load balancer for database/service access from host
- **dnsmasq**: In-cluster DNS resolver for `*.dev.me` domain resolution

## The add → deploy model

A workload has two independent states:

| State | Set with | Means |
|---|---|---|
| **in `loko.yaml`** (and enabled) | `loko workloads add <name>` (from the catalog), `loko workloads enable` / `disable` to toggle an existing entry, or editing `loko.yaml` | LoKO should manage this workload |
| **deployed** to the cluster | `loko workloads deploy` (or `add --now`) | the Helm release is actually installed |

`loko create` deploys everything that's enabled. After the cluster exists, you
add (or enable) then deploy.

`--now` runs a `helmfile sync` for the named workloads only. If a workload
needs a new DNS host or TCP port, run `loko config sync` afterwards to
regenerate the cluster's ingress/HAProxy config.

Unless you pass `--config` / `-c`, workload commands target the active
environment first, then fall back to `./loko.yaml`.

## Seeing what's available and what's running

```bash
loko catalog list                 # everything the catalog offers
loko catalog list --category database
loko catalog search postgres
loko catalog info                 # catalog location + counts

loko workloads health             # per-workload: helm release status + pod readiness
loko status                       # cluster / registry state
```

## Adding, enabling, removing

```bash
loko workloads add postgres                     # pull from catalog into loko.yaml (enabled)
loko workloads add postgres --now               # ...and deploy it right away
loko workloads remove postgres                  # drop the entry from loko.yaml
loko workloads remove postgres --now            # ...and uninstall the Helm release too

loko workloads enable postgres                  # toggle an existing entry back on
loko workloads enable mysql postgres mongodb    # several
loko workloads disable mysql postgres           # toggle off (stays in loko.yaml)

loko workloads undeploy postgres                # uninstall the Helm release; loko.yaml untouched
loko workloads list                             # configured workloads + enabled/deployed state
loko workloads list --disabled                  # only the disabled ones
loko workloads info postgres                    # catalog + config detail for one workload
```

`add` / `enable` / `disable` / `remove` only edit `loko.yaml`. `undeploy` only
touches the cluster (the entry stays; `loko workloads deploy` reinstalls it).
To disable **and** remove from the cluster, `loko workloads disable <name>`
then `loko workloads deploy` (helmfile prunes the now-disabled release), or
`loko workloads undeploy <name>`.

:::note
Traefik (ingress controller) is required and cannot be disabled. Zot (registry) and metrics-server can be disabled if not needed.
:::

### Custom workload

Add it under `workloads.user` in `loko.yaml`:

```yaml
workloads:
  user:
    - name: myapp
      enabled: true
      namespace: apps
      config:
        chart: myrepo/myapp
        version: "1.0.0"
        values:
          ingress:
            enabled: true
            hosts:
              - host: myapp.dev.me
```

## Deploying

```bash
loko workloads deploy                  # every enabled workload
loko workloads deploy postgres         # one
loko workloads deploy mysql postgres   # several
```

`deploy` is idempotent — run it again after changing `loko.yaml` values or
pulling a newer catalog. It runs a helmfile sync: requirement checks, linked
child workloads, pre/post-sync processors, and invariant assertions.

## Inspecting a workload

### Endpoints

```bash
loko workloads endpoints postgres
```

Output (headers: TYPE, NAME, PROTOCOL, PORT, URL / ADDRESS — one row per internal/external pair):
```
Internal  client  tcp  5432  postgres.loko-workloads.svc.cluster.local:5432
External  client  tcp  5432  postgres.dev.me:5432
```

### Connection Strings

```bash
# Show connection strings (password masked)
loko workloads connect postgres

# Show with actual password
loko workloads connect postgres --show-password
loko workloads connect postgres -p
```

Example output:
```
Connection strings for postgres:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
default: postgresql://postgres:${PASS}@postgres.dev.me:5432/${DB}
jdbc:    jdbc:postgresql://postgres.dev.me:5432/${DB}?user=postgres&password=${PASS}
```

## Health

```bash
loko workloads health
```

Reports every enabled workload's Helm release status and pod readiness, e.g.:

```
postgres    deployed   1/1 ready
valkey      deployed   1/1 ready
mysql       pending    0/1 ready
```

For a full-environment check including cluster and registry, use `loko status`;
for an end-to-end HTTPS smoke test, `loko selftest`.

## Viewing Logs

### Stream Logs

```bash
loko logs workload postgres

# Follow (real-time)
loko logs workload postgres --follow
```

### Tail Logs

```bash
# Last 100 lines
loko logs workload postgres --tail 100

# Last 5 minutes
loko logs workload postgres --since 5m
```

### Multi-Container Pods

```bash
loko logs workload traefik --container traefik
```

### Previous Instance

```bash
loko logs workload postgres --previous
```

## Credentials Management

### Fetch Secrets

```bash
loko secrets fetch
```

Fetches workload credentials from the cluster and updates persisted environment secrets.

### Show Secrets

```bash
# Display in terminal
loko secrets show

# everything as JSON
loko secrets show --all

# one password
loko secrets show --all | jq -r '.postgres.password'
```

Auto-generated credentials for:
- PostgreSQL (postgres password)
- MySQL (root password)
- MongoDB (root password)
- RabbitMQ (admin password)
- Valkey (default password)

## Web UIs

Many workloads have linked web UI tools that provide visual interfaces for management.

### Viewing Available UIs

Run `loko catalog search <name>` — a workload's catalog entry lists its linked child workloads, e.g. `postgres` → `postgres-ui` (pgAdmin), `valkey` → `cache-ui` (phpCacheAdmin).

### Adding UI Workloads

UI workloads are added just like any other workload:

```bash
# enable a database and its UI together, then deploy
loko workloads add postgres postgres-ui
loko workloads deploy postgres postgres-ui

# add the UI later
loko workloads add mysql-ui
loko workloads deploy mysql-ui
```

### Available UIs

| Database | UI Workload | Tool | URL |
|----------|-------------|------|-----|
| **postgres** | postgres-ui | pgAdmin | `postgres-ui.dev.me` |
| **mysql** | mysql-ui | phpMyAdmin | `mysql-ui.dev.me` |
| **mongodb** | mongodb-ui | mongo-express | `mongodb-ui.dev.me` |
| **valkey** | cache-ui | phpCacheAdmin | `cache-ui.dev.me` |
| **memcached** | cache-ui | phpCacheAdmin | `cache-ui.dev.me` |
| **nats** | nats-ui | NATS Dashboard | `nats-ui.dev.me` |
| **redpanda** | redpanda-ui | Redpanda Console | `redpanda-ui.dev.me` |
| **garage** | garage-ui | Garage WebUI | `garage-ui.dev.me` |
| **rabbitmq** | _(built-in)_ | Management UI | `rabbitmq.dev.me` |

**Note**: cache-ui provides a unified interface for both Valkey (Redis) and Memcached.

## Real Developer Workflows

### Scenario 1: Building a Web App

**Stack**: Node.js API + PostgreSQL + Valkey (cache) + React frontend

```bash
# Add backend services
loko workloads add postgres
loko workloads add valkey
loko env create

# Your API connects to:
# - postgres.dev.me:5432
# - valkey.dev.me:6379

# Build and push images
docker build -t cr.dev.me/api:v1 ./api
docker push cr.dev.me/api:v1

docker build -t cr.dev.me/frontend:v1 ./frontend
docker push cr.dev.me/frontend:v1

# Deploy to cluster
kubectl apply -f k8s/

# Access:
# - API: https://api.dev.me
# - Frontend: https://app.dev.me
# - Database: postgres-ui.dev.me (web UI)
```

### Scenario 2: Microservices Development

**Services**: User service, Order service, Notification service

```bash
# Add infrastructure
loko workloads add postgres
loko workloads add rabbitmq
loko workloads add valkey
loko env create

# Each service gets:
# - Shared PostgreSQL database (postgres.dev.me)
# - Message queue for async tasks (rabbitmq.dev.me)
# - Shared cache (valkey.dev.me)

# Develop services locally, connect to cluster:
# In your .env:
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.dev.me:5432/mydb
RABBITMQ_URL=amqp://admin:PASSWORD@rabbitmq.dev.me:5672
REDIS_URL=redis://valkey.dev.me:6379
```

### Scenario 3: Testing with Multiple Databases

**Need**: Test PostgreSQL and MongoDB migrations

```bash
# Add both databases
loko workloads add postgres
loko workloads add mongodb
loko env create

# Run tests
npm test -- --postgres-url=postgresql://postgres:PASS@postgres.dev.me:5432/test
npm test -- --mongodb-url=mongodb://root:PASS@mongodb.dev.me:27017/test

# Check data via web UIs
open https://postgres-ui.dev.me
open https://mongodb-ui.dev.me
```

### Scenario 4: Event-Driven Architecture

**Stack**: Services + RabbitMQ + Storage

```bash
# Add messaging and storage
loko workloads add rabbitmq
loko workloads add garage
loko env create

# Now you have:
# - Message queue: rabbitmq.dev.me
# - S3-compatible storage: garage.dev.me
# - RabbitMQ management UI: https://rabbitmq.dev.me

# Publish events, process async, store files
```

---

## Workload Catalog

### Available Workloads

**Databases**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `postgres` | PostgreSQL database server | pgAdmin at `postgres-ui.dev.me` |
| `mysql` | MySQL database server | phpMyAdmin at `mysql-ui.dev.me` |
| `mongodb` | MongoDB document database | mongo-express at `mongodb-ui.dev.me` |

**Cache**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `valkey` | Redis-compatible in-memory cache | phpCacheAdmin at `cache-ui.dev.me` |
| `memcached` | Distributed memory caching system | phpCacheAdmin at `cache-ui.dev.me` |

**Messaging**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `rabbitmq` | RabbitMQ message broker | Management UI at `rabbitmq.dev.me` |
| `nats` | NATS messaging system with JetStream | Dashboard at `nats-ui.dev.me` |
| `redpanda` | Kafka-compatible streaming platform | Console at `redpanda-ui.dev.me` |
| `elasticmq` | SQS-compatible message queue | Web UI at `elasticmq.dev.me` |
| `goaws` | SNS-compatible message service | API endpoint at `sns.dev.me` |

**Storage**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `garage` | S3-compatible distributed object storage | WebUI at `garage-ui.dev.me` |

**DevOps/GitOps**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `forgejo` | Self-hosted Git service (Gitea fork) | Web UI at `forgejo.dev.me` |
| `argocd` | GitOps continuous delivery | Web UI at `argocd.dev.me` |
| `flux-operator` | Flux CD operator for GitOps | - |

**Collaboration**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `excalidraw` | Collaborative whiteboard | Web UI at `excalidraw.dev.me` |
| `penpot` | Open-source design & prototyping (Figma alternative) | Web UI at `penpot.dev.me` |

**DevTools**:

| Workload | Description | Web UI |
|----------|-------------|--------|
| `httpbin` | HTTP request & response testing service | Web UI at `httpbin.dev.me` |
| `it-tools` | Developer utilities — converters, encoders, formatters | Web UI at `it-tools.dev.me` |
| `mock-smtp-sms` | SMTP & SMS testing tool | Web UI at `mock-smtp-sms.dev.me` |

**Each workload includes**:
- ✅ Pre-configured Helm values
- ✅ Auto-generated passwords (saved in persisted environment secrets)
- ✅ DNS configuration (`.dev.me` by default)
- ✅ Health checks
- ✅ Connection strings
- ✅ Web UI tools (where applicable)

### Custom Chart Repositories

Add Helm repositories:

```bash
loko config helm-repo add --helm-repo-name bitnami --helm-repo-url https://charts.bitnami.com/bitnami
```

Then reference in config:

```yaml
workloads:
  helm-repositories:
    - name: bitnami
      url: https://charts.bitnami.com/bitnami

  user:
    - name: myapp
      config:
        repo:
          ref: bitnami
        chart: bitnami/nginx
        version: 15.0.0
```

## Advanced Scenarios

### Deploy with Custom Values

```yaml
workloads:
  system:
    - name: postgres
      enabled: true
      config:
        values:
          storage:
            size: 50Gi
          resources:
            limits:
              memory: 2Gi
```

### Node Affinity

```yaml
workloads:
  system:
    - name: postgres
      config:
        values:
          affinity:
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: tier
                        operator: In
                        values:
                          - application
```

### Multiple Instances

```yaml
workloads:
  system:
    - name: postgres-main
      config:
        chart: groundhog2k/postgres
        namespace: databases

    - name: postgres-test
      config:
        chart: groundhog2k/postgres
        namespace: databases-test
```

## Troubleshooting

### Workload Not Deploying

```bash
# Check status
loko workloads health

# Add + deploy
loko workloads add postgres
loko workloads deploy postgres

# Check Helm release
helm list -A

# Check pods
kubectl get pods -A
```

### Connection Issues

```bash
# Check endpoints
loko workloads endpoints postgres

# Check DNS
loko check dns
```

### Logs Show Errors

```bash
# View detailed logs
loko logs workload postgres --tail 100

# Check events
kubectl get events -n common-services
```

## Next Steps

- [Network & DNS](/user-guide/network-dns/) - Configure DNS resolution
- [Registry](/user-guide/registry/) - Use local container registry
- [Troubleshooting](/reference/troubleshooting/) - Common issues
