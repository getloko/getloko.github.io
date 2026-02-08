---
title: "Expert Config Generation (`config generate --expert`)"
---


## Overview

Expert mode "expands" the configuration to show all computed values, giving power users full visibility and control over:
- **Infrastructure**: Provider, kubernetes version, node scheduling, network ports
- **Components**: Registry settings, mirroring, component versions
- **Workloads**: Full helm values with password placeholders

## Design Decisions

1. **Minimal by default**: New configs omit expert-only fields (provider, kubernetes, scheduling, versions)
2. **Defaults from catalog**: Missing fields filled from `loko-catalog.yaml` at load time
3. **Passwords**: Use placeholders like `${POSTGRES_PASSWORD}` resolved at runtime
4. **Variables**: Keep `${LOKO_DOMAIN}`, `${LOKO_IP}` etc. as placeholders
5. **Breaking change**: `cluster.provider` moved to `environment.provider`

## Config Structures

### Minimal Config (default)

```yaml
environment:
  name: dev-me
  base-dir: ${PWD}/.loko
  expand-env-vars: true

  cluster:
    nodes:
      servers: 1
      workers: 1

  network:
    ip: 192.168.0.10
    domain: dev.me
    subdomain:
      enabled: true
      value: apps

  components:
    metrics-server:
      enabled: false
    registry:
      enabled: true

  workloads:
    system:
      - name: postgres
        enabled: true
```

### Expert Config (full expansion)

```yaml
environment:
  name: dev-me
  base-dir: ${PWD}/.loko
  expand-env-vars: true

  provider:
    name: kind
    runtime: docker

  cluster:
    kubernetes:
      api-port: 6443
      image: kindest/node
      # renovate: datasource=docker depName=kindest/node
      tag: v1.35.0
    nodes:
      servers: 1
      workers: 1
      scheduling:
        control-plane:
          allow-workloads: true
          isolate-components: true
        workers:
          isolate-workloads: true
      labels:
        control-plane: {}
        worker: {}

  network:
    ip: 192.168.0.10
    domain: dev.me
    # dns-port: auto-selected from NodePort range (30000–32767)
    subdomain:
      enabled: true
      value: apps
    lb-ports:
      - 80
      - 443

  components:
    ingress-controller:
      # renovate: datasource=helm depName=traefik repositoryUrl=https://traefik.github.io/charts
      version: "38.0.2"
    registry:
      enabled: true
      name: cr
      storage:
        size: 10Gi
      mirroring:
        enabled: true
        sources:
          - name: docker_hub
            enabled: false
          - name: quay
            enabled: true
          - name: ghcr
            enabled: true
          - name: k8s_registry
            enabled: true
          - name: mcr
            enabled: true
      # renovate: datasource=helm depName=zot repositoryUrl=http://zotregistry.dev/helm-charts
      version: "0.1.95"
    dns-operator:
      # renovate: datasource=docker depName=ghcr.io/getloko/dns-operator
      version: "0.0.1"
    metrics-server:
      enabled: false
      # renovate: datasource=helm depName=metrics-server repositoryUrl=https://kubernetes-sigs.github.io/metrics-server
      version: "3.13.0"

  workloads:
    expert-mode: true
    system-namespace: loko-workloads
    use-presets: true
    system:
      - name: postgres
        enabled: true
        namespace: loko-workloads
        ports: [5432]
        storage:
          size: 5Gi
        config:
          chart: groundhog2k/postgres
          version: "1.6.1"
          values:
            fullNameOverride: postgres
            nameOverride: postgres
            storage:
              requestedSize: 5Gi
            settings:
              superuserPassword:
                value: "${POSTGRES_PASSWORD}"
        ui:
          - name: postgres-ui
            enabled: true
            config:
              values:
                # Full UI helm values...
```

## What's Hidden in Minimal Mode

| Section | Hidden Fields | Default Source |
|---------|---------------|----------------|
| **provider** | name, runtime | Hardcoded: kind, docker |
| **cluster.kubernetes** | api-port, image, tag | Catalog: internal-components.kubernetes |
| **cluster.nodes** | scheduling, labels | Hardcoded defaults |
| **network** | dns-port, lb-ports | Auto-selected NodePort, [80, 443] |
| **components** | All versions, registry details | Catalog: internal-components.* |
| **workloads** | Full config.values | Catalog presets |

## Implementation

### Default Filling Flow

1. User writes minimal config (or runs `config generate`)
2. `load_config()` parses YAML into Pydantic models
3. `_fill_defaults()` fills missing Optional fields from catalog
4. Generator/Runner receive fully populated config

### Key Files

| File | Role |
|------|------|
| `loko/config.py` | Pydantic models with Optional fields |
| `loko/utils.py` | `load_config()` and `_fill_defaults()` |
| `loko/templates/loko-catalog.yaml` | Default versions (kubernetes, components) |

## Usage

```bash
# Generate minimal config (default)
loko config generate

# Generate expert config with all fields expanded
loko config generate --expert

# Expand existing config to expert mode
loko config generate --expert --config loko.yaml -o loko-expert.yaml

# Create environment with CLI overrides
loko env create --workers 3
```

## Verification

1. **Minimal config loads**: `loko env create` works with minimal config
2. **Defaults applied**: Generator uses catalog values for missing fields
3. **Expert config respected**: Explicit values override defaults
4. **Workload presets**: `expert-mode: true` skips preset merging
5. **Password placeholders**: `${POSTGRES_PASSWORD}` resolved at deploy time
6. **Renovate works**: `config upgrade` updates versions in expert config

## Migration from Old Config

Old structure (`cluster.provider`):
```yaml
environment:
  cluster:
    provider:
      name: kind
      runtime: docker
```

New structure (`environment.provider`):
```yaml
environment:
  provider:
    name: kind
    runtime: docker
  cluster:
    # provider removed
```

Error message guides users:
```
Config error: 'cluster.provider' is deprecated.
Move provider settings to 'environment.provider'.
```
