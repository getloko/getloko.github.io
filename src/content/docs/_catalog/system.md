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

LoKO reads the catalog from a **local directory** — there is no in-CLI
download or cache. You manage the directory with `git`.

```
$LOKO_CONFIG_DIR/catalog/catalog.yaml     # $LOKO_CONFIG_DIR defaults to ~/.loko
```

The main `catalog.yaml` and its `includes:` files are loaded and deep-merged
at startup. Set it up once:

```bash
git clone https://github.com/getloko/catalog.git ~/.loko/catalog
```

**Repository**: [github.com/getloko/catalog](https://github.com/getloko/catalog)

Because it's a plain git checkout:

- **Updates are decoupled from the binary** — `git -C ~/.loko/catalog pull`
  never requires upgrading `loko`
- **Teams** share a fork; **PR previews** are just `git checkout <branch>`
- **Local overrides** — edit a `workloads/*.yaml` file in place

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

### 📁 Git-managed

- Plain local directory, cloned from [getloko/catalog](https://github.com/getloko/catalog)
- Updates independent of `loko` releases (`git pull`)
- Branches, forks, and PR previews for team catalogs

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
loko catalog list --search postgres

# Update the local catalog
git -C ~/.loko/catalog pull
```

## See Also

- [Catalog Source & Updates](/_catalog/remote-sync/) - the catalog directory workflow
- [Components](/_catalog/components/) - Internal components reference
- [Workloads Overview](/_catalog/workloads/) - Available workloads
