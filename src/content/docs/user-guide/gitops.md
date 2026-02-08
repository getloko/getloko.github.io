---
title: "GitOps"
---

**Git-based delivery for your local cluster.**

LoKO GitOps connects Forgejo to a GitOps controller (FluxCD or ArgoCD), so commits become cluster state.

## What You Get

- A Forgejo `gitops` repository used as the reconciled source of truth.
- A `sample-webapp` repository with CI workflows for build, PR previews, and promote-to-prod.
- Automatic reconcile on push via webhooks (plus periodic polling).
- Provider-aware PR preview generation.

## Architecture (High Level)

- **Forgejo** hosts repos, webhooks, and Forgejo Actions.
- **Provider** (FluxCD or ArgoCD) watches Git and applies state.
- **GitOps repo** (`gitops`) contains `clusters/<env>/` and app overlays.

## Provider Differences

| Capability | FluxCD | ArgoCD |
|---|---|---|
| PR trigger mode | Label-driven (`review` / `review-built`) | Title-driven (`[preview]`) |
| PR generator model | ResourceSetInputProvider + ResourceSet | ApplicationSet pullRequest generator |
| Preview host | `sample-webapp-pr-{N}.<apps-domain>` | `sample-webapp-pr-{N}.<apps-domain>` |

## Typical Flow

1. Run `loko gitops init`.
2. Commit to `gitops` to reconcile manifests.
3. Open PRs in `sample-webapp` to build preview images.
4. Approve review trigger (label/title based on provider).
5. Promote approved image to prod via workflow.

## Commands

```bash
loko gitops init --provider fluxcd
loko gitops status
loko gitops destroy
```

## Where To Go Next

- Detailed, step-by-step setup: [Tutorial: GitOps Setup](/tutorials/gitops-setup)
- Full command reference: [Commands](../reference/commands)
- Config schema: [Config Schema](../reference/config-schema)
