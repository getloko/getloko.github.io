---
title: "User Guide"
---


Welcome to the LoKO user guide. This section covers day-to-day usage of LoKO for local Kubernetes development.

## Topics

### Environment Management
- [Environment Lifecycle](/user-guide/environment-lifecycle/) - Create, start, stop, destroy environments
- [Configuration](/user-guide/configuration/) - Understanding and customizing `loko.yaml`

### Workloads & Services
- [Workload Management](/user-guide/workload-management/) - Deploy and manage workloads
- [Network & DNS](/user-guide/network-dns/) - DNS configuration and domain resolution
- [Certificates](/user-guide/certificates/) - TLS certificate management
- [Registry](/user-guide/registry/) - Local container registry usage

### Reference
- [CLI Reference](/user-guide/cli-reference/) - Complete command reference

## Quick Links

- **Getting Started**: [Quick Start Guide](/getting-started/quick-start/)
- **Tutorials**: [First Cluster Tutorial](/tutorials/first-cluster/)
- **Troubleshooting**: [Common Issues](/reference/troubleshooting/)

## Common Tasks

### Create a new environment
```bash
loko config generate
loko env create
```

### Deploy a workload
```bash
loko workloads add postgres
loko workloads deploy postgres
```

### Check status
```bash
loko status              # cluster + registry
loko workloads health    # enabled workloads
```

### Access services
```bash
loko workloads connect postgres
loko logs workload postgres
```

## What's Next?

- Learn about [workload management](/user-guide/workload-management/)
- Understand [configuration options](/user-guide/configuration/)
- Explore the [CLI reference](/user-guide/cli-reference/)
