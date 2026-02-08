---
title: Helm Repositories
---

Helm repository definitions used in the LoKO catalog.

## Overview

The catalog includes **15 Helm repositories** organized by purpose:

- **3** Component repositories (Traefik, Zot, metrics-server)
- **4** Workload repositories (databases, messaging, storage)
- **2** UI and utility repositories (web UIs and utilities)
- **4** DevOps repositories (GitOps, CI/CD, Git hosting)
- **2** Example repositories (user workload examples)

## Component Repositories

Core infrastructure components for LoKO.

### Traefik

```yaml
name: traefik
url: https://traefik.github.io/charts
```

**Charts Used:**

- `traefik/traefik` - Ingress controller (required component)

### Zot

```yaml
name: zot
url: http://zotregistry.dev/helm-charts
```

**Charts Used:**

- `zot/zot` - OCI registry with mirroring (optional component)

### metrics-server

```yaml
name: metrics-server
url: https://kubernetes-sigs.github.io/metrics-server/
```

**Charts Used:**

- `metrics-server/metrics-server` - Kubernetes metrics API (optional component)

---

## Workload Repositories

Repositories for system workloads (databases, messaging, storage).

### groundhog2k

```yaml
name: groundhog2k
url: https://groundhog2k.github.io/helm-charts/
```

**Charts Used:**

- `groundhog2k/postgres` - PostgreSQL database
- `groundhog2k/mysql` - MySQL database
- `groundhog2k/mongodb` - MongoDB database
- `groundhog2k/valkey` - Valkey/Redis cache
- `groundhog2k/rabbitmq` - RabbitMQ message broker
- `groundhog2k/garage` - S3-compatible storage

**Website:** [groundhog2k.github.io](https://groundhog2k.github.io/helm-charts/)

### cloudpirates

```yaml
name: cloudpirates
url: https://cloudpirates-io.github.io/helm-charts/
```

**Charts Used:**

- `cloudpirates/memcached` - Memcached distributed caching

**Website:** [cloudpirates-io.github.io](https://cloudpirates-io.github.io/helm-charts/)

### NATS

```yaml
name: nats
url: https://nats-io.github.io/k8s/helm/charts/
```

**Charts Used:**

- `nats/nats` - NATS messaging server

**Website:** [nats.io](https://nats.io/)

### Redpanda

```yaml
name: redpanda
url: https://charts.redpanda.com/
```

**Charts Used:**

- `redpanda/redpanda` - Kafka-compatible streaming platform

**Website:** [redpanda.com](https://redpanda.com/)

### datahub-local

```yaml
name: datahub-local
url: https://datahub-local.github.io/garage-helm
```

**Charts Used:**

- `datahub-local/garage` - S3-compatible object storage

**Website:** [garagehq.deuxfleurs.fr](https://garagehq.deuxfleurs.fr/)

---

## UI and Utility Repositories

Repositories for UI workloads and utilities (web management interfaces, tools).

### bjw-s

```yaml
name: bjw-s
url: https://bjw-s-labs.github.io/helm-charts/
```

**Charts Used:**

- `bjw-s/app-template` - Generic application chart for:
  - phpMyAdmin (MySQL UI)
  - pgAdmin (PostgreSQL UI)
  - phpCacheAdmin (Cache UI for Redis/Memcached)
  - dynamodb-admin (DynamoDB Local UI)
  - NATS dashboard
  - Mock SMTP/SMS
  - Excalidraw
  - DynamoDB Local
  - ElasticMQ

**Website:** [bjw-s-labs.github.io](https://bjw-s-labs.github.io/helm-charts/)

### cowboysysop

```yaml
name: cowboysysop
url: https://cowboysysop.github.io/charts
```

**Charts Used:**

- `cowboysysop/mongo-express` - MongoDB web UI

**Website:** [cowboysysop.github.io](https://cowboysysop.github.io/charts/)

---

## DevOps Repositories

Repositories for GitOps, CI/CD, and development tools.

### Argo

```yaml
name: argo
url: https://argoproj.github.io/argo-helm
```

**Charts Used:**

- `argo/argo-cd` - ArgoCD GitOps tool

**Website:** [argoproj.github.io](https://argoproj.github.io/)

### Forgejo Helm

```yaml
name: forgejo-helm
url: code.forgejo.org/forgejo-helm
oci: true
```

**Charts Used:**

- `forgejo-helm/forgejo` - Self-hosted Git service

**Type:** OCI Registry
**Website:** [forgejo.org](https://forgejo.org/)

### Forgejo Runner

```yaml
name: forgejo-runner
url: codeberg.org/wrenix/helm-charts
oci: true
```

**Charts Used:**

- `forgejo-runner/forgejo-runner` - CI/CD runner for Forgejo Actions

**Type:** OCI Registry
**Website:** [codeberg.org/wrenix](https://codeberg.org/wrenix/helm-charts)

### Flux Operator

```yaml
name: flux-operator
url: ghcr.io/controlplaneio-fluxcd/charts
oci: true
```

**Charts Used:**

- `flux-operator/flux-operator` - Flux CD operator

**Type:** OCI Registry
**Website:** [fluxcd.io](https://fluxcd.io/)

---

## Collaboration Repositories

Repositories for team collaboration tools.

### Excalidraw

```yaml
name: excalidraw
url: https://pmoscode-helm.github.io/excalidraw
```

**Charts Used:**

- `excalidraw/excalidraw` - Virtual whiteboard

**Website:** [excalidraw.com](https://excalidraw.com/)

---

## Example Repositories

Repositories used in user workload examples.

### SecureCodeBox

```yaml
name: securecodebox
url: https://charts.securecodebox.io/
```

**Example:** HTTP webhook service (user workload example)

**Website:** [securecodebox.io](https://www.securecodebox.io/)

### Istio

```yaml
name: istio
url: https://istio-release.storage.googleapis.com/charts
```

**Example:** TCP echo server (user workload example)

**Website:** [istio.io](https://istio.io/)

---

## Using Repositories

### In System Workloads

System workloads automatically reference repositories by name:

```yaml
workloads:
  postgres:
    chart:
      repo: groundhog2k
      name: groundhog2k/postgres
      version: "1.6.1"
```

### In User Workloads

For user workloads using catalog repositories, reference them by name:

```yaml
workloads:
  my-app:
    type: user
    chart:
      repo: bjw-s  # From catalog
      name: bjw-s/app-template
      version: "3.0.0"
```

**For external repositories not in the catalog**, add them to your config file:

```yaml
# loko.yaml
workloads:
  helm-repositories:
    - name: my-custom-repo
      url: https://my-charts.example.com/
```

Then reference in your workload:

```yaml
workloads:
  my-app:
    type: user
    chart:
      repo: my-custom-repo
      name: my-custom-repo/my-chart
      version: "1.0.0"
```

### OCI Registries

Some repositories use OCI format (indicated by `oci: true`):

```yaml
helm-repositories:
  - name: forgejo-helm
    url: code.forgejo.org/forgejo-helm
    oci: true
```

LoKO handles OCI repositories automatically.

## Repository Stats

- **Total Repositories**: 16
- **OCI Repositories**: 3 (Forgejo, Forgejo Runner, Flux Operator)
- **Traditional Helm Repos**: 13
- **Charts Available**: 35+

## Next Steps

- [Browse Workloads](workloads/index)
- [Components](components)
- [Contributing Guide](contributing)
