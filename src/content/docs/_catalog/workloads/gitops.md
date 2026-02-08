---
title: GitOps Workloads
---

Continuous delivery and Git-driven deployment tools. These workloads integrate with [`loko gitops`](../../user-guide/gitops) to provide a fully automated GitOps pipeline inside your local cluster.

:::tip
See the **[GitOps User Guide](../../user-guide/gitops)** for a full walkthrough of the `loko gitops init/status/destroy` commands, or follow the **[GitOps Setup Tutorial](../../tutorials/gitops-setup)** for a hands-on introduction.
:::

---

## Available Workloads

### Forgejo

Self-hosted Git service that acts as the **required Git host** for `loko gitops`. Forgejo stores your GitOps repository, handles push webhooks that trigger reconciliation, and runs CI pipelines via Forgejo Actions.

**Forgejo Features:**

- Self-hosted Git hosting with a GitHub-compatible web UI
- Push webhooks for immediate GitOps reconciliation
- Forgejo Actions for local CI/CD pipelines (runs on the bundled `loko-runner`)
- Organization and team support
- Fine-grained access token management

**Forgejo Use Cases:**

- Required Git host for `loko gitops init`
- Local CI/CD pipelines with Forgejo Actions
- Private repository hosting inside the cluster
- Code review and collaboration without an internet dependency

**Forgejo Deployment:**

```bash
loko workloads add forgejo
loko env create   # or loko env deploy to add to a running cluster
```

**Forgejo Endpoints:**

- **Web UI**: `http://forgejo.<LOKO_DOMAIN>` (TLS-enabled via mkcert)
- **API**: `http://forgejo.<LOKO_DOMAIN>/api/v1`

**Forgejo Default Credentials:**

- Username: `loko`
- Password: Auto-generated (retrieve with `loko workloads connect forgejo`)

:::note
Forgejo is **required** for `loko gitops`. The integration uses Forgejo's API to create repositories, manage access tokens, and register push webhooks. External Git hosts (GitHub, GitLab) are not supported.
:::


---

### Flux Operator

Kubernetes operator for managing FluxCD instances. LoKO uses this workload to install and manage FluxCD as the GitOps reconciliation engine when you run `loko gitops init --provider fluxcd`.

**Flux Operator Features:**

- Automated FluxCD installation and lifecycle management
- GitRepository source tracking (watches the Forgejo repo for changes)
- Kustomization controller for applying manifests from the repo
- Push-webhook-triggered immediate reconciliation (via Flux Receiver)
- Multi-tenancy support

**Flux Operator Use Cases:**

- GitOps provider for `loko gitops` (recommended for simpler setups)
- Automated Kustomize-based manifest reconciliation
- Helm release management via HelmRelease CRDs


After deploying, initialize GitOps:

```bash
loko catalog sync
loko gitops init --provider fluxcd
```

**Flux Operator Chart:** flux-operator/flux-operator

---

### ArgoCD

Declarative GitOps continuous delivery tool with a full web UI. Use this workload when you want a visual dashboard to inspect application sync state, resource health, and deployment history.

**ArgoCD Features:**

- Full web UI at `https://argocd.<domain>`
- Application health monitoring and diff viewer
- Push-webhook-triggered immediate reconciliation
- Rollback and manual sync capabilities
- Kustomize and Helm support

**ArgoCD Use Cases:**

- GitOps provider for `loko gitops` (alternative to FluxCD with a different UI style)
- Application health visualization and debugging
- Multi-environment management

**ArgoCD Deployment:**

```bash
loko workloads add argocd
loko env deploy
```

After deploying, initialize GitOps:

```bash
loko catalog sync
loko gitops init --provider argocd
```

**ArgoCD Endpoints:**

- **Web UI**: `https://argocd.<LOKO_DOMAIN>`

**ArgoCD Default Credentials:**

- Username: `admin`
- Password: Auto-generated (retrieve with `loko secrets get argocd`)

**ArgoCD Chart:** argo/argo-cd

---

## Integration with LoKO GitOps

The `loko gitops` command integrates all three workloads above into a complete GitOps pipeline:

```
Forgejo (Git host)  →  Push webhook  →  FluxCD or ArgoCD  →  Cluster reconciliation
```

`loko gitops init` installs the provider, creates the Forgejo repository, scaffolds it with Kustomize templates, and wires up the webhook — all in a single command.

See the [GitOps User Guide](../../user-guide/gitops) for full details.

## Next Steps

- [GitOps User Guide](../../user-guide/gitops) — architecture, secrets handling, advanced flags
- [GitOps Setup Tutorial](../../tutorials/gitops-setup) — hands-on step-by-step walkthrough
