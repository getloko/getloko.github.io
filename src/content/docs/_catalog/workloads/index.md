---
title: Workloads Overview
---

The LoKO Catalog contains 30+ pre-configured workloads organized by category.

## Categories

### Databases

Relational and NoSQL databases with web management UIs:

- PostgreSQL (with pgAdmin UI)
- MySQL (with phpMyAdmin UI)
- MongoDB (with mongo-express UI)
- DynamoDB Local (with dynamodb-admin UI)

[Browse Databases →](databases)

### Cache & Key-Value

In-memory caching systems with unified web management UI:

- Valkey (Redis-compatible)
- Memcached
- phpCacheAdmin (unified cache UI)

[Browse Caches →](cache)

### Message Queues

Message brokers and streaming platforms:

- RabbitMQ (with management UI)
- NATS (with dashboard UI)
- Redpanda (Kafka-compatible)
- ElasticMQ (SQS-compatible, with web UI)

[Browse Messaging →](messaging)

### Object Storage

S3-compatible distributed object storage:

- Garage

[Browse Storage →](storage)

### DevOps & CI/CD

Git hosting and CI/CD runners:

- Forgejo (Git hosting)
- Forgejo Runner (CI/CD)

[Browse DevOps →](devops)

### Dev & Testing Tools

Email and SMS testing tools for development:

- Mock SMTP/SMS

[Browse DevTools →](devtools)

### GitOps

Continuous delivery and deployment automation (integration coming soon):

- ArgoCD
- Flux Operator

[Browse GitOps →](gitops)

### Collaboration

Virtual whiteboard and diagramming tools:

- Excalidraw

[Browse Collaboration →](collaboration)

## Using Workloads

### List Available Workloads

```bash
loko workloads list --all
```

### Get Workload Info

```bash
loko workloads info postgres
```

### Deploy Workload

```bash
loko workloads add postgres
loko workloads enable postgres --deploy
```

### Connect to Workload

```bash
loko workloads connect postgres --show-password
```

## Workload Types

### System Workloads

Infrastructure services (databases, caches, queues):

- Deployed to `loko-workloads` namespace by default
- Accessible at `<workload>.${LOKO_DOMAIN}`
- Managed credentials
- Health checks included

### User Workloads

Custom applications and services:

- Deployed to custom namespaces
- Accessible at `<workload>.apps.${LOKO_DOMAIN}` (if subdomain enabled)
- Custom configuration
- Optional ingress

## Common Fields

All workloads include:

```yaml
workloads:
  <name>:
    type: system | user
    description: "Brief description"
    defaults:
      namespace: loko-workloads
      ports: [5432]
      storage:
        size: 10Gi
    chart:
      repo: <helm-repo>
      name: <chart-name>
      version: "x.y.z"
    endpoints:
      - name: client
        protocol: tcp | http | https
        port: 5432
    connections:
      default: "connection://string"
    secrets:
      - name: password
        type: password
    health_checks:
      - type: tcp | http | exec
```

## Next Steps

- [Database Workloads](databases)
- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
