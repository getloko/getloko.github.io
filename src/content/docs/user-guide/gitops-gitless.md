---
title: "GitOps: Gitless Mode"
---

**Deploy cluster state via OCI artifacts instead of Git mutations.**

Gitless mode is an alternative GitOps delivery model where the GitOps provider (FluxCD) reads
reconciled manifests from an OCI registry instead of a Git repository. The `gitops` repo still
exists as the source of truth for authoring, but no commits are pushed to it during CI — instead,
CI workflows package manifests into OCI artifacts and push them to the container registry.

## Why Gitless

The standard Git-based mode writes back to the `gitops` repo on every build and promotion (updating
image tags via `git commit + push`). This creates noise in git history and requires the CI runner to
have write access to the gitops repo on every workflow run.

Gitless mode eliminates those write-backs:

| | Git mode | Gitless mode |
|---|---|---|
| Cluster state source | `gitops` git repo | OCI artifact in registry |
| Build triggers cluster update | via git commit + push | via `oras push` + Flux webhook |
| Git history | one commit per build | clean — no CI mutations |
| CI requires git write access | yes | no (OCI push only) |
| Prod gate | `suspend: true` in binding file, lifted by git commit | same flag, lifted by re-publishing OCI artifact |

## How It Works

Instead of FluxCD watching a `GitRepository`, it watches an `OCIRepository` — an OCI artifact stored
in the container registry. The CI workflows use [ORAS](https://oras.land) and `kustomize` to build
and push manifest bundles directly to the registry.

### OCI Artifact Layout

| Artifact | Tag | Contents | Updated by |
|---|---|---|---|
| `<registry>/<org>/gitops-root` | `<env-name>` | `environments/<env>/` tree | `publish-oci` gitops workflow |
| `<registry>/<org>/sample-webapp-dev` | `dev-latest` | kustomize build of `overlays/dev` | `build` workflow on merge to `main` |
| `<registry>/<org>/sample-webapp-prod` | `prod-latest` | kustomize build of `overlays/prod` | `promote` workflow on release |
| `<registry>/<org>/sample-webapp-pr` | `pr-<N>-<sha7>` | kustomize build of `overlays/preview` | `pr` workflow when `preview` label added |

### Flux OCIRepository Resources

FluxCD creates an `OCIRepository` source for each artifact. Each one:

- Polls the registry every 5 minutes for digest changes
- Is notified immediately after each `oras push` via a Flux `Receiver` webhook called from the CI workflow
- Uses `certSecretRef: name: forgejo-ca-cert` to trust the local CA when the registry uses a self-signed certificate

### Immediate Reconciliation

After every `oras push`, the CI workflow calls the Flux webhook receiver directly via `curl`:

```bash
TOKEN="loko-webhook-v1"
HOOK_PATH=$(echo -n "${TOKEN}" | sha256sum | awk '{print $1}')
PAYLOAD='{}'
SIG=$(echo -n "${PAYLOAD}" | openssl dgst -sha256 -hmac "${TOKEN}" | awk '{print $2}')
curl -sf -X POST \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=${SIG}" \
  -d "${PAYLOAD}" \
  "http://webhook-receiver.loko-gitops.svc.cluster.local/hook/${HOOK_PATH}"
```

This is done in-cluster (the runner pods can reach `webhook-receiver.loko-gitops.svc.cluster.local`)
and triggers Flux to reconcile immediately — no waiting for the polling interval.

### Prod Gate

The `webapp-prod` Kustomization starts with `suspend: true`. This prevents any production deployment
until an explicit release promotion. On the first `promote` workflow run:

1. `sed` removes `suspend: true` from the prod binding file (local gitops checkout)
2. `kustomize build overlays/prod` packages the manifests with the new image tag
3. `oras push` publishes `sample-webapp-prod:prod-latest` — **with the gate removed**
4. `oras push` re-publishes `gitops-root` — so the cluster picks up the lifted gate
5. Flux is notified via webhook and reconciles immediately

Subsequent promotions are gate-free: the `sed` is a no-op once `suspend: true` is already gone.

## Enabling Gitless Mode

In `loko.yaml`, set `gitless: true` under `gitops`:

```yaml
gitops:
  enabled: true
  provider: fluxcd
  gitless: true
  include-sample-webapp: true
  forgejo:
    org: my-org
```

Then re-run init:

```bash
loko gitops init
```

:::tip
Gitless mode only works with FluxCD. ArgoCD does not use `OCIRepository` sources in LoKO's
current implementation.
:::

## Bootstrap Differences

Gitless bootstrap adds one extra step compared to standard mode:

```
[1/8] Creating GitOps repository...
[2/8] Scaffolding repository...
[3/8] Pushing initial commit...
[4/8] Installing FluxCD...
[5/8] Publishing initial OCI artifact via publish-oci workflow...   ← gitless only
[6/8] Registering webhook...
[7/8] Waiting for FluxCD to become ready...
[8/8] Reconciling webhook subscriptions...
```

Step 5 triggers the `publish-oci` Forgejo Actions workflow in the gitops repo. This workflow packages
the environment manifests and pushes the initial `gitops-root` OCI artifact so the `OCIRepository`
source has something to read before FluxCD starts reconciling.

:::caution
Without the initial OCI publish, FluxCD would enter a `NAME_UNKNOWN` error loop — the
`OCIRepository` would exist but no artifact would be present in the registry yet.
:::

## Scaffolded Gitops Repo

The `gitops` repo scaffolded in gitless mode includes an additional workflow:

```
gitops/
├── .forgejo/workflows/
│   └── publish-oci.yaml        ← gitless only: packages + pushes gitops-root
├── environments/<env>/
│   ├── kustomization.yaml
│   ├── apps/
│   │   ├── webapp-dev.yaml     ← OCIRepository + Kustomization (gitless) or Kustomization only
│   │   └── webapp-prod.yaml
│   └── infra/
│       ├── receiver-gitops.yaml
│       ├── receiver-webapp-dev.yaml    ← gitless only
│       └── receiver-webapp-prod.yaml  ← gitless only
└── init/
    ├── git-repo.yaml           ← OCIRepository in gitless, GitRepository otherwise
    └── flux-kustomization.yaml
```

The `publish-oci` workflow runs on every push to `main` in the gitops repo and on `workflow_dispatch`.
This means any manual edit to the gitops repo (such as adding a new app binding) is automatically
packaged and pushed to the registry, keeping the OCI artifact in sync with the git state.

## Sample-webapp Workflow Differences

The `sample-webapp` CI workflows behave differently in gitless mode:

### Build (merge to `main`)

| Step | Git mode | Gitless mode |
|---|---|---|
| Build + push Docker image | ✓ | ✓ |
| Update `newTag` in gitops overlay | via `git commit + push` | local sed only (no commit) |
| Package dev manifests | — | `kustomize build overlays/dev` |
| Push dev OCI artifact | — | `oras push sample-webapp-dev:dev-latest` |
| Notify Flux | via Forgejo push webhook | via direct `curl` to Flux receiver |

### Promote (release published)

| Step | Git mode | Gitless mode |
|---|---|---|
| Resolve image tag | ✓ | ✓ |
| Update prod `newTag` | via `git commit + push` | local sed only |
| Lift prod gate | via git commit | via OCI re-publish |
| Push prod OCI artifact | — | `oras push sample-webapp-prod:prod-latest` |
| Re-publish gitops-root | — | `oras push gitops-root` (with gate removed) |
| Notify Flux | via Forgejo push webhook | two `curl` calls (prod + gitops-root receivers) |

### PR Preview

PR preview works the same as in git mode (Docker image push + `preview` label flow), with one
addition: when the `preview` label is set and the image is pushed, gitless mode also packages the
preview overlay manifests and pushes a `sample-webapp-pr:<tag>` OCI artifact for FluxCD to deploy.

## Where To Go Next

- [GitOps User Guide](/user-guide/gitops/) — standard git-based mode reference
- [Tutorial: GitOps Setup](/tutorials/gitops-setup/) — step-by-step walkthrough
- [Config Schema](/reference/config-schema/) — `gitops.gitless` field reference
