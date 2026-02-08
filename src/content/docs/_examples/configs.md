---
title: Config Examples
description: Minimal configuration snippets for common LoKO setups.
---

These example configurations demonstrate specific features and settings in `loko.yaml`. Use them as a starting point or reference when customizing your own environment. All files are available in the [LoKO Examples repository](https://github.com/getloko/examples/tree/main/configs).

### [Minimal Development](https://github.com/getloko/examples/blob/main/configs/minimal.yaml)
A basic single-node Kind cluster setup perfect for local development when resources are limited. It runs workloads on the control plane and includes a light-weight Valkey cache.

### [Full Infrastructure Stack](https://github.com/getloko/examples/blob/main/configs/full-stack.yaml)
Showcases a complete infrastructure setup including a local OCI registry with pull-through mirroring enabled for Docker Hub and Quay, metrics server, and common system services like PostgreSQL and Valkey.

### [Multi-Node Cluster](https://github.com/getloko/examples/blob/main/configs/multi-node.yaml)
Demonstrates a complex topology with three worker nodes and custom node labels. This example shows how to use node selectors to pin workloads (like a backend service) to specific nodes based on hardware characteristics like SSD storage.

### [Advanced Networking](https://github.com/getloko/examples/blob/main/configs/advanced-networking.yaml)
Explores custom domain configurations, custom DNS ports, direct root-domain routing, and deploying OCI Helm workloads alongside TCP port forwarding for an echo server.

### [GitOps with FluxCD](https://github.com/getloko/examples/blob/main/configs/gitops-fluxcd.yaml)
Sets up a self-hosted GitOps environment using FluxCD and Forgejo. It includes the `credential_injection` plugin to automatically pass LoKO secrets into your GitOps workloads.

### [GitOps with ArgoCD](https://github.com/getloko/examples/blob/main/configs/gitops-argocd.yaml)
A self-hosted GitOps setup similar to the FluxCD example, but using ArgoCD as the provider. It also integrates with Forgejo and uses secret injection.
