---
title: "User Guide"
---


Welcome to the LoKO user guide. This section covers day-to-day usage of LoKO for local Kubernetes development.

## Topics

### Environment Management
- [Environment Lifecycle](environment-lifecycle) - Create, start, stop, destroy environments
- [Configuration](configuration) - Understanding and customizing `loko.yaml`

### Workloads & Services
- [Workload Management](workload-management) - Deploy and manage workloads
- [Network & DNS](network-dns) - DNS configuration and domain resolution
- [Certificates](certificates) - TLS certificate management
- [Registry](registry) - Local container registry usage

### Reference
- [CLI Reference](cli-reference) - Complete command reference

## Quick Links

- **Getting Started**: [Quick Start Guide](../getting-started/quick-start)
- **Tutorials**: [First Cluster Tutorial](../tutorials/first-cluster)
- **Troubleshooting**: [Common Issues](../reference/troubleshooting)

## Common Tasks

### Create a new environment
```bash
loko config generate
loko env create
```

### Deploy a workload
```bash
loko workloads add postgres
loko workloads enable postgres --now
```

### Check status
```bash
loko status
loko workloads list
```

### Access services
```bash
loko workloads connect postgres
loko logs workload postgres
```

## What's Next?

- Learn about [workload management](workload-management)
- Understand [configuration options](configuration)
- Explore the [CLI reference](cli-reference)
