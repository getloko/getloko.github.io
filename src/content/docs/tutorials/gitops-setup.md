---
title: "Tutorial: GitOps Setup"
---

This tutorial walks you through initializing LoKO GitOps, pushing your first manifest, and watching the cluster reconcile automatically.

**Time required:** ~20 minutes

**What you'll learn:**
- Bootstrap GitOps on a LoKO cluster
- Explore the scaffolded GitOps repository
- Deploy a Kubernetes resource by pushing a git commit
- Observe provider reconciliation in real time
- Tear down the GitOps setup cleanly

## Prerequisites

Before starting, ensure you have:

- A running LoKO environment (`loko env create` completed)
- **Forgejo** deployed and accessible at `http://forgejo.<your-domain>`
- One of `flux-operator` or `argocd` in your workloads
- `loko catalog sync` run at least once

If you don't have Forgejo yet:

```bash
loko workloads add forgejo
loko workloads add flux-operator
loko env deploy    # deploy new workloads to the running cluster
loko catalog sync
```

## Step 1: Run `loko gitops init`

Bootstrap GitOps with FluxCD (recommended):

```bash
loko gitops init --provider fluxcd
```

Or with ArgoCD if you prefer a web UI:

```bash
loko gitops init --provider argocd
```

You'll see LoKO working through each bootstrap step:

```
✓ Forgejo auth validated
✓ Created repository gitops
✓ Installed flux-operator (FluxCD v2.3.0)
✓ Scaffolded repository (11 templates rendered)
✓ Applied bootstrap resources (GitRepository + Kustomization)
✓ Created cluster secrets (forgejo-gitops-auth, webhook-token)
✓ Registered push webhook on Forgejo
✓ Waiting for first sync... done
✓ Updated loko.yaml (gitops.enabled: true)

GitOps is ready. Push commits to gitops to reconcile the cluster.
```

:::tip
The full bootstrap takes 1–3 minutes depending on how quickly the provider image pulls and the first sync completes.
:::

## Step 2: Clone the scaffolded repository

Open the Forgejo web UI at `http://forgejo.<your-domain>` and find the `gitops` repository. Copy the clone URL and clone it locally:

```bash
git clone http://forgejo.<your-domain>/<your-user>/gitops.git
cd gitops
```

## Step 3: Explore the structure

List the contents of the scaffolded repository:

```
gitops/
├── clusters/dev/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── http-webhook.yaml
│   └── receiver.yaml            ← (FluxCD only)
├── .flux/
│   ├── git-repo.yaml
│   └── flux-kustomization.yaml
├── .gitea/workflows/
│   └── hello.yaml
├── .gitignore
└── README.md
```

Open `clusters/dev/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yaml
  - http-webhook.yaml
  - receiver.yaml
```

This is the Kustomize entry point. Everything listed under `resources` is reconciled into the cluster automatically.

## Step 4: Confirm the seed app is running

The scaffold includes a simple HTTP echo app. Open your browser and visit:

```
https://echo.<your-apps-domain>
```

You should see a JSON response with request headers echoed back. This confirms GitOps is working end-to-end.

LoKO also creates a `sample-webapp` repository for CI + preview demos. PR previews are:
- FluxCD: label-driven (`review` / `review-built`)
- ArgoCD: title-driven (`[preview]`)

## Step 4b: Explore `sample-webapp` and PR generation

Open the `sample-webapp` repo in Forgejo and check `.gitea/workflows/`:

- `sample-webapp-build.yaml` — builds/pushes `main-*`, updates dev image tag in `gitops`
- `sample-webapp-pr.yaml` — builds `pr-<N>-<sha7>` preview images
- `sample-webapp-promote.yaml` — promotes dev tag to prod in `gitops`

PR preview generation is provider-specific:

| Provider | Trigger | Generated resources |
|---|---|---|
| FluxCD | PR labels `review` / `review-built` | `Namespace` + `GitRepository` + `Kustomization` |
| ArgoCD | PR title contains `[preview]` | `ApplicationSet` generates per-PR `Application` |

Preview host format for both:

```text
https://sample-webapp-pr-<N>.<apps-domain>
```

## Step 5: Check the GitOps status

```bash
loko gitops status
```

Expected output:

```
FluxCD v2.3.0  Ready

Name             Namespace    Status    Last Sync       Message
clusters-dev     flux-system  Applied   1 minute ago
```

All green means the provider is healthy and the initial commit has been reconciled successfully.

## Step 6: Add a manifest and push

Create a simple ConfigMap under `clusters/dev/`:

```bash
cat > clusters/dev/app-config.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: loko-apps
data:
  LOG_LEVEL: debug
  APP_ENV: development
EOF
```

Register it in `kustomization.yaml` by adding the file to the `resources` list:

```yaml
resources:
  - namespace.yaml
  - http-webhook.yaml
  - receiver.yaml
  - app-config.yaml    # ← add this line
```

Commit and push:

```bash
git add clusters/dev/app-config.yaml clusters/dev/kustomization.yaml
git commit -m "feat: add app-config configmap"
git push
```

## Step 7: Watch reconciliation

The Forgejo push webhook immediately notifies the provider. Within seconds you should see the ConfigMap appear:

```bash
kubectl get configmap app-config -n loko-apps
```

Check the sync status:

```bash
loko gitops status
```

```
FluxCD v2.3.0  Ready

Name             Namespace    Status    Last Sync       Message
clusters-dev     flux-system  Applied   5 seconds ago
```

For FluxCD, you can also tail the controller logs directly:

```bash
kubectl logs -n flux-system deploy/kustomize-controller -f
```

:::tip
With webhooks enabled, reconciliation triggers immediately on push — you don't need to wait for the periodic sync interval (which defaults to 1 minute).
:::

## Step 8: Inspect the webhook delivery in Forgejo

Open the Forgejo web UI and navigate to your `gitops` repository:

1. Go to **Settings → Webhooks**
2. Click the webhook entry
3. Scroll to **Recent Deliveries**

You should see a successful delivery (HTTP 200) triggered by your push. This confirms the webhook chain is working.

## Step 9: (Optional) Open the provider dashboard

**FluxCD:** Open `https://flux.<your-domain>` — the Flux Operator Mission Control dashboard is enabled by default in LoKO.

**ArgoCD:** Open `https://argocd.<your-domain>`. Log in with:

```bash
loko workloads connect argocd --show-password
```

You'll see your GitOps application listed with its sync state, resource tree, and health indicators.

## Step 10: Clean up

When you're done, tear down the GitOps setup:

```bash
loko gitops destroy
```

LoKO will show you exactly what it's about to do:

```
The following actions will be performed:
  • Delete fluxcd CRs from cluster
  • Uninstall fluxcd Helm releases
  • Delete fluxcd CRDs from cluster
  • Delete fluxcd namespace
  • Remove Forgejo webhook from repo 'gitops'
  • Delete Forgejo repo 'gitops'
  • Revoke access token 'loko-gitops-dev'
  • Set gitops.enabled: false in loko.yaml

Proceed with destroy? [y/N]
```

Confirm and the full teardown completes in about 30 seconds.

:::caution
`loko gitops destroy` deletes the Forgejo repository permanently. Clone it locally first if you want to keep the manifests.
:::

## What You've Learned

- **`loko gitops init`** bootstraps Forgejo + FluxCD/ArgoCD in one command
- The scaffolded repo under `clusters/<env>/` is continuously reconciled by the provider
- A git push triggers immediate cluster reconciliation via the Forgejo webhook
- **`loko gitops status`** shows provider health and per-workload sync state
- **`loko gitops destroy`** cleanly removes all GitOps resources and secrets

## Next Steps

- [GitOps User Guide](../user-guide/gitops) — full reference including secrets handling, advanced flags, and troubleshooting
- [Workload Management](../user-guide/workload-management) — add more services to your cluster
- [GitOps Workloads](../catalog/workloads/gitops) — Forgejo, FluxCD, and ArgoCD catalog entries
