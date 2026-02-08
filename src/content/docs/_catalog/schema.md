---
title: Schema Reference
---

Complete specification for LoKO catalog workload definitions.

## Overview

Workloads are defined using YAML and validated against Pydantic models. This reference covers all available fields and their usage.

---

## Workload Schema

Root workload definition in catalog files.

### System Workload

```yaml
workloads:
  postgres:
    type: system                    # system | user
    category: database              # Category for organization
    description: "PostgreSQL database"

    chart:
      repo: groundhog2k
      name: groundhog2k/postgres
      version: "1.6.1"

    defaults:
      namespace: loko-workloads
      ports: [5432]
      storage:
        size: 10Gi

    mappings:
      storage: persistence.size
      secrets.admin.password: userPassword

    secrets:
      - name: password
        type: password
        length: 16
        charset: alphanum

    presets:
      # Helm chart values (merged with user values)
      persistence:
        enabled: true
        size: 10Gi

      service:
        type: ClusterIP
        port: 5432

    endpoints:
      - name: client
        protocol: tcp
        port: 5432
        host: "postgres.${LOKO_DOMAIN}"

    connection-strings:
      - name: default
        template: "postgresql://postgres:${PASSWORD}@${HOST}:5432/${DB}"
      - name: jdbc
        template: "jdbc:postgresql://${HOST}:5432/${DB}?user=postgres&password=${PASSWORD}"

    health-checks:
      - name: port
        type: tcp
        port: 5432
        tier: infrastructure
      - name: ready
        type: command
        image: postgres:latest
        command: ["pg_isready", "-h", "${HOST}", "-p", "5432"]
        tier: client

    links:
      - type: addon
        target: postgres-ui
        auto-deploy: true
        required: false
```

### User Workload

```yaml
workloads:
  my-app:
    type: user
    description: "Custom application"

    chart:
      repo: my-custom-repo
      name: my-custom-repo/app
      version: "1.0.0"

    defaults:
      namespace: default
      ports: [8080]

    values:
      # ALL Helm values provided by user (no presets)
      image:
        repository: myapp
        tag: latest

      service:
        type: ClusterIP
        port: 8080
```

---

## Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `system` or `user` |
| `category` | string | No | Workload category (database, cache, messaging, etc.) |
| `description` | string | Yes | Brief description |
| `chart` | object | Yes | Helm chart configuration |
| `defaults` | object | No | Default values for namespace, ports, storage |
| `mappings` | object | No | Map config values to Helm chart paths |
| `secrets` | array | No | Secret generation specifications |
| `presets` | object | No | Pre-configured Helm values (system workloads only) |
| `endpoints` | array | No | Service endpoint definitions |
| `connection-strings` | array | No | Connection string templates |
| `health-checks` | array | No | Health check definitions |
| `links` | array | No | Related workload links |
| `hooks` | array | No | Helmfile lifecycle hooks |

---

## Chart Configuration

Helm chart specification.

```yaml
chart:
  repo: groundhog2k              # Repo name from repositories.yaml
  name: groundhog2k/postgres     # Full chart name
  version: "1.6.1"             # Chart version
```

**OCI Repositories:**

```yaml
chart:
  repo: forgejo-helm             # OCI repo (oci: true in repositories.yaml)
  name: forgejo-helm/forgejo
  version: "16.0.2"
```

---

## Defaults

Default configuration values.

```yaml
defaults:
  namespace: loko-workloads       # Default namespace
  ports: [5432, 8080]            # TCP ports to expose
  storage:
    size: 10Gi                   # Default storage size
```

**Port Requirements:**

- HTTP services: No ports needed (use Traefik ingress)
- TCP services: Ports dynamically configured via HAProxy tunnel

---

## Mappings

Map user-friendly config paths to Helm chart values.

```yaml
mappings:
  storage: persistence.size                    # Map storage to chart path
  secrets.admin.password: userPassword         # Map secret to chart path
  secrets.admin.username: adminUser
```

**Usage:**

```yaml
# User config
workload:
  storage: 20Gi

# Translates to Helm values
persistence:
  size: 20Gi
```

---

## Secrets

Automatic secret generation specifications.

### Password Secret

```yaml
secrets:
  - name: password
    type: password
    length: 16
    charset: alphanum              # alphanum | alpha | numeric | hex
    description: "Database password"
```

### User-Password Credential Set

```yaml
secrets:
  admin:
    name: admin
    type: user-pass
    description: "Admin credentials"
    fields:
      - name: username
        type: static
        value: admin
        sensitive: false
      - name: password
        type: password
        length: 16
    mappings:
      username: gitea.admin.username
      password: gitea.admin.password
```

### Secret Field Types

| Type | Description | Fields |
|------|-------------|--------|
| `password` | Alphanumeric password | length |
| `hex` | Hex-encoded secret | length (in bytes) |
| `token` | Token with custom charset | length, charset |
| `uuid` | UUID4 string | none |
| `static` | Static value | value |

**Note**: `user-pass` is a CredentialSet type (containing multiple fields), not a field type.

---

## Presets

Pre-configured Helm values for system workloads.

```yaml
presets:
  # Persistence configuration
  persistence:
    enabled: true
    size: 10Gi
    storageClass: ""

  # Service configuration
  service:
    type: ClusterIP
    port: 5432

  # Ingress configuration
  ingress:
    enabled: true
    className: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls: "true"
    hosts:
      - host: myapp.${LOKO_DOMAIN}
        paths: [/]
    tls:
      - hosts:
          - myapp.${LOKO_DOMAIN}
```

**YAML Anchors:**

Use catalog templates for common patterns:

```yaml
presets:
  ingress:
    <<: *ingress-traefik         # Reference template from catalog.yaml
    hosts:
      - host: myapp.${LOKO_DOMAIN}
```

**Available Templates:**

- `*ingress-traefik` - Standard Traefik ingress
- `*service-clusterip` - ClusterIP service
- `*ui-service-http-80` - UI service on port 80
- `*ui-service-http-8081` - UI service on port 8081
- `*chart-bjw-s` - bjw-s app-template chart
- `*namespace-workloads` - Default namespace

---

## Endpoints

Service endpoint definitions for documentation.

```yaml
endpoints:
  - name: client                 # Endpoint name
    protocol: tcp                # tcp | http | https
    port: 5432                   # Port number
    host: "postgres.${LOKO_DOMAIN}"  # Optional host
    description: "PostgreSQL client port"
```

**Protocols:**

- `tcp` - Raw TCP connections
- `http` - HTTP without TLS
- `https` - HTTP with TLS

---

## Connection Strings

Template-based connection string generation.

```yaml
connection-strings:
  - name: default
    template: "postgresql://postgres:${PASSWORD}@${HOST}:5432/${DB}"

  - name: jdbc
    template: "jdbc:postgresql://${HOST}:5432/${DB}?user=postgres&password=${PASSWORD}"

  - name: url
    template: "https://${HOST}"
```

**Available Variables:**

- `${HOST}` - Service hostname
- `${PASSWORD}` - Generated password
- `${USER}` - Username
- `${DB}` - Database name
- `${PORT}` - Port number
- `${LOKO_DOMAIN}` - Local domain

---

## Health Checks

Service health verification definitions.

### TCP Port Check

```yaml
health-checks:
  - name: port
    type: tcp
    port: 5432
    tier: infrastructure        # Default tier (no client tools required)
    description: "Check if port is open"
```

### HTTP Check

```yaml
health-checks:
  - name: web-ui
    type: http
    target: web                  # Reference to endpoint
    path: /health
    tier: infrastructure
    description: "Check web UI health"
```

### Command Check

```yaml
health-checks:
  - name: ready
    type: command
    tier: client                 # Requires client tools
    image: postgres:15-alpine
    command: ["pg_isready", "-h", "${HOST}", "-p", "5432"]
    requires: ["pg_isready"]
    description: "PostgreSQL ready check"
```

**Check Types:**

- `tcp` - TCP port connectivity
- `http` - HTTP endpoint response
- `command` - Run command in container

**Health Check Tiers:**

- `infrastructure` - Port connectivity checks (no client tools required, runs by default)
- `client` - Service validation using client tools (requires installing tools like mysql, psql, etc.)

---

## Workload Links

Define relationships between workloads.

### Addon Link

```yaml
links:
  - type: addon
    target: postgres-ui          # Linked workload name
    auto-deploy: true            # Deploy automatically
    required: false              # Optional addon
    lifecycle-binding: true      # Delete when parent deleted
```

### Dependent Link

```yaml
links:
  - type: dependent
    target: database             # Required dependency
    auto-deploy: true
    required: true
    wait-for-ready: true         # Wait until ready
```

**Link Types:**

- `addon` - UI or utility workload
- `dependent` - Required dependency
- `sidecar` - Co-deployed service
- `extension` - Optional extension

---

## Hooks

Helmfile lifecycle hooks for custom actions.

```yaml
hooks:
  - events: ["presync"]          # presync | postsync | preuninstall
    show-logs: true              # Show hook output
    command: "/bin/bash"
    args:
      - "-c"
      - |
        set -e
        echo "Running pre-sync hook..."
        # Custom commands here
```

**Available Events:**

- `presync` - Before Helm install/upgrade
- `postsync` - After Helm install/upgrade
- `preuninstall` - Before Helm uninstall

**Environment Variables:**

- `$LOKO_KUBECTL_CONTEXT` - Kubernetes context
- `$LOKO_DOMAIN` - Local domain
- `$NAMESPACE` - Workload namespace

---

## Template Variables

Variables available in workload definitions.

| Variable | Example | Description |
|----------|---------|-------------|
| `${LOKO_DOMAIN}` | `dev.me` | Local domain |
| `${LOKO_APPS_DOMAIN}` | `apps.dev.me` | Apps subdomain |
| `${LOKO_IP}` | `192.168.1.100` | Local IP address |
| `${LOKO_ENV_NAME}` | `local` | Environment name |
| `${LOKO_REGISTRY_NAME}` | `zot` | Registry name |
| `${LOKO_REGISTRY_HOST}` | `registry.dev.me` | Registry host |
| `${LOKO_SYSTEM_WORKLOADS_NAMESPACE}` | `loko-workloads` | System namespace |
| `${LOKO_KUBECTL_CONTEXT}` | `loko-local` | kubectl context |

---

## Examples

### Minimal System Workload

```yaml
workloads:
  nextcloud:
    type: system
    description: "Nextcloud file sharing platform"
    chart:
      repo: groundhog2k
      name: groundhog2k/nextcloud
      version: "0.20.6"
    defaults:
      namespace: loko-workloads
```

### Full-Featured System Workload

```yaml
workloads:
  postgres:
    type: system
    category: database
    description: "PostgreSQL database with pgAdmin UI"

    chart:
      repo: groundhog2k
      name: groundhog2k/postgres
      version: "1.6.1"

    defaults:
      namespace: loko-workloads
      ports: [5432]
      storage:
        size: 10Gi

    mappings:
      storage: persistence.size
      secrets.admin.password: userPassword

    secrets:
      - name: password
        type: password
        length: 16
        charset: alphanum

    presets:
      persistence:
        enabled: true
        size: 10Gi
      service:
        type: ClusterIP
        port: 5432
      resources:
        limits:
          cpu: 500m
          memory: 512Mi

    endpoints:
      - name: client
        protocol: tcp
        port: 5432
        host: "postgres.${LOKO_DOMAIN}"

    connection-strings:
      - name: default
        template: "postgresql://postgres:${PASSWORD}@${HOST}:5432/${DB}"

    health-checks:
      - name: port
        type: tcp
        port: 5432
        tier: infrastructure

    links:
      - type: addon
        target: postgres-ui
        auto-deploy: true
        required: false
```

### User Workload with Custom Repo

```yaml
workloads:
  my-api:
    type: user
    description: "Custom REST API"

    chart:
      repo: my-company
      name: my-company/api
      version: "2.1.0"

    defaults:
      namespace: default

    values:
      image:
        repository: myregistry/api
        tag: v2.1.0

      service:
        type: ClusterIP
        port: 8080

      ingress:
        enabled: true
        className: traefik
        hosts:
          - host: api.${LOKO_APPS_DOMAIN}
            paths: [/]
```

---

## Validation

All workload definitions are validated using Pydantic models in the LoKO CLI.

**Validation includes:**

- Required fields presence
- Type checking (strings, integers, lists, objects)
- Port number ranges (1-65535)
- Version string format
- Template variable syntax
- Chart repository existence
- Circular dependency detection

**Common Errors:**

```yaml
# ❌ Invalid - missing required fields
workloads:
  myapp:
    chart:
      repo: groundhog2k

# ✅ Valid - all required fields
workloads:
  myapp:
    type: system
    description: "My app"
    chart:
      repo: groundhog2k
      name: groundhog2k/nextcloud
      version: "0.20.6"
```

---

## Next Steps

- [Browse Workloads](workloads/index)
- [Helm Repositories](repositories)
- [Contributing Guide](contributing)
