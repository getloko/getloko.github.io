---
title: "Catalog System"
description: "How the LoKO catalog system works"
---

The LoKO Catalog provides a curated collection of pre-configured workload definitions for local Kubernetes development.

## Overview

The catalog system consists of:

- **Workload Definitions**: Pre-configured Helm charts for databases, caches, message queues, and more
- **Components**: Internal system components (dnsmasq, HAProxy, Traefik, metrics-server, Zot)
- **Helm Repositories**: Collection of Helm repository configurations
- **Secrets & Credentials**: Auto-generation specifications for workload credentials
- **Health Checks**: Built-in health check definitions
- **GitOps Templates**: templated manifests used to wire ArgoCD or Flux to a Forgejo repository during `loko gitops init`

## Catalog Source

LoKO reads the catalog from a **local directory** — `loko` fetches and
caches it there automatically over HTTPS; there's no manual clone required.

```
$LOKO_CONFIG_DIR/catalog/catalog.yaml     # $LOKO_CONFIG_DIR defaults to ~/.loko
```

The main `catalog.yaml` and its `includes:` files are loaded and deep-merged
at startup. The first command that needs it fetches it for you
automatically; fetch or re-fetch it explicitly with:

```bash
loko catalog sync
```

**Repository**: [github.com/getloko/catalog](https://github.com/getloko/catalog)

- **Updates are decoupled from the binary** — `loko catalog sync` never
  requires upgrading `loko`
- **Teams** share a fork via `loko catalog sync --url <fork-url>`
- **Local overrides** — edit a `workloads/*.yaml` file in place; the edit
  persists until the next `loko catalog sync` overwrites it

See [Catalog Source & Updates](/_catalog/remote-sync/) for the full workflow.

## Catalog Structure

The catalog is organized as multi-file YAML:

```
catalog/
├── catalog.yaml              # Main catalog file with includes
├── repositories.yaml         # Helm repository definitions
├── components.yaml           # System components (dnsmasq, HAProxy, etc.)
├── workloads/
│   ├── databases.yaml        # PostgreSQL, MySQL, MongoDB
│   ├── cache.yaml            # Valkey, Memcached
│   ├── messaging.yaml        # RabbitMQ, NATS, Redpanda
│   ├── storage.yaml          # Garage (S3-compatible)
│   ├── devops.yaml           # Forgejo, Forgejo Runner
│   ├── devtools.yaml         # Mock SMTP/SMS
│   ├── gitops.yaml           # ArgoCD, Flux Operator
│   └── collaboration.yaml    # Excalidraw
└── gitops-templates/         # Jinja2 manifests for GitOps wiring
    ├── argocd/               # ArgoCD Application, repo secret, webhook
    └── flux/                 # Flux GitRepository, Kustomization, receiver
```

### Main Catalog Format

```yaml
version: "1"
includes:
  - repositories.yaml
  - components.yaml
  - workloads/databases.yaml
  - workloads/cache.yaml
  - workloads/messaging.yaml
  # ... more includes
```

## Key Features

### 🌐 Auto-synced

- Plain local directory, fetched over HTTPS from [getloko/catalog](https://github.com/getloko/catalog)
- Updates independent of `loko` releases (`loko catalog sync`)
- Point `loko catalog sync --url` at a fork for team catalogs

### 🔒 Validation

- Schema validation on load
- Secure file permissions (0700/0600) for generated artifacts

### 🧩 Extensibility

- Link-based workload relationships (a workload can pull in child workloads)
- Template variable expansion
- Secret auto-generation specs

## Quick Commands

```bash
# View catalog information (location, counts)
loko catalog info

# List available workloads
loko catalog list
loko catalog list --category database
loko catalog search postgres

# Update the local catalog
loko catalog sync
```

## See Also

- [Catalog Source & Updates](/_catalog/remote-sync/) - the catalog directory workflow
- [Components](/_catalog/components/) - Internal components reference
- [Workloads Overview](/_catalog/workloads/) - Available workloads
