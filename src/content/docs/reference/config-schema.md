---
title: "Configuration Schema"
---

Complete reference for the `loko.yaml` configuration file schema. All fields are sourced directly from the Pydantic models in `loko/config.py`.

## Top-Level Structure

```yaml
name: "dev-me"           # required
provider: kind           # optional, default: "kind"
runtime: docker          # optional, default: "docker"
expand-env-vars: true    # optional, default: true

plugins:                 # optional
  enabled: [...]
  disabled: [...]

cluster:                 # required
  nodes:
    workers: 0

network:                 # required
  ip: "192.168.1.100"
  domain: "dev.me"

registry:                # optional, has defaults
  enabled: true

components:              # optional, has defaults
  ingress-controller:
    dashboard: false
  metrics-server:
    enabled: false

tunnel:                  # optional, has defaults
  enabled: true

workloads:               # required
  system: []
  user: []

gitops:                  # optional, has defaults
  enabled: false
  provider: fluxcd
```

**Top-level fields**:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | Yes | — | Environment name. Must be a valid Kubernetes name (lowercase alphanumeric + hyphens). |
| `provider` | string | No | `"kind"` | Cluster provider. |
| `runtime` | string | No | `"docker"` | Container runtime. |
| `expand-env-vars` | bool | No | `true` | Expand `${VAR}` references in config values. |
| `plugins` | object | No | `null` | Plugin configuration (see below). |
| `cluster` | object | **Yes** | — | Cluster configuration. |
| `network` | object | **Yes** | — | Network and DNS configuration. |
| `registry` | object | No | (defaults) | In-cluster OCI registry. |
| `components` | object | No | (defaults) | System components (ingress, metrics). |
| `tunnel` | object | No | (defaults) | HAProxy tunnel for TCP port forwarding. |
| `workloads` | object | **Yes** | — | Workload definitions. |
| `gitops` | object | No | (defaults) | GitOps integration. |

---

## `network`

```yaml
network:
  ip: "192.168.1.100"   # required
  domain: "dev.me"       # required
  # dns-port is auto-selected from the NodePort range (30000–32767)

  subdomain:             # optional
    enabled: true
    value: "apps"

  lb-ports:              # optional
    http: 80
    https: 443

  port-overrides:        # optional
    forgejo: [3000]
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `ip` | string | **Yes** | — | Host IP address. Cannot be a loopback address. |
| `domain` | string | **Yes** | — | Base domain (e.g. `"dev.me"`). Must be a valid FQDN. |
| `dns-port` | int\|null | No | auto | CoreDNS NodePort, auto-selected from the 30000–32767 range. Rarely needs to be set manually. |
| `subdomain.enabled` | bool | No | `true` | Enable apps subdomain prefix. |
| `subdomain.value` | string | No | `"apps"` | Subdomain prefix for app ingresses (must be a valid DNS label). |
| `lb-ports.http` | int | No | `80` | Load balancer HTTP port. |
| `lb-ports.https` | int | No | `443` | Load balancer HTTPS port. |
| `port-overrides` | dict | No | `{}` | Per-workload TCP port overrides. Keys are workload names, values are lists of ports. |

---

## `cluster`

```yaml
cluster:
  kubernetes-version: null   # optional
  api-port: null             # optional

  kubernetes:                # optional
    api-port: null
    image: null
    tag: null

  nodes:                     # required
    workers: 0
    labels:                  # optional
      control-plane:
        my-label: "value"
      worker:
        my-label: "value"
      individual:
        node-name:
          my-label: "value"
    scheduling:              # optional
      control-plane:
        isolate-internal-components: true
```

**`cluster` fields**:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `kubernetes-version` | string\|null | No | `null` | Kubernetes version for the Kind node image. |
| `api-port` | int\|null | No | `null` | Kubernetes API server port on the host. |
| `kubernetes.api-port` | int\|null | No | `null` | Alternative API port setting (inside `kubernetes` block). |
| `kubernetes.image` | string\|null | No | `null` | Custom Kind node image name. |
| `kubernetes.tag` | string\|null | No | `null` | Custom Kind node image tag. |
| `nodes.workers` | int | **Yes** | — | Number of worker nodes. `0` means workloads run on the control plane. |
| `nodes.labels.control-plane` | dict | No | `{}` | Labels applied to control-plane nodes. |
| `nodes.labels.worker` | dict | No | `{}` | Labels applied to all worker nodes. |
| `nodes.labels.individual` | dict\|null | No | `null` | Labels for individual nodes by name. |
| `nodes.scheduling.control-plane.isolate-internal-components` | bool | No | `true` | Isolate loko system components to the control-plane node. |

---

## `workloads`

Workloads are defined as two lists: `system` (catalog workloads like `forgejo`, `postgres`) and `user` (custom workloads with explicit Helm config).

```yaml
workloads:
  internal-namespace: loko-components   # optional
  system-namespace: loko-system         # optional
  user-namespace: loko-user             # optional
  use-presets: true                     # optional

  helm-repositories:                    # optional
    - name: groundhog2k
      url: https://groundhog2k.github.io/helm-charts/
      oci: false

  system:
    - name: forgejo
      enabled: true
      namespace: loko-system    # optional, overrides system-namespace
      storage: 5Gi              # optional
      ports: [3000, 2222]       # optional

  user:
    - name: my-app
      enabled: true
      namespace: my-namespace
      depends-on: [forgejo]
      config:
        chart: my-org/my-app
        version: "1.2.3"
        values:
          replicaCount: 2
```

**`workloads` top-level fields**:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `internal-namespace` | string | No | `"loko-components"` | Namespace for internal loko components. |
| `system-namespace` | string | No | `"loko-system"` | Default namespace for system workloads. |
| `user-namespace` | string | No | `"loko-user"` | Default namespace for user workloads. |
| `use-presets` | bool | No | `true` | Apply catalog preset values globally. Can be overridden per workload. |
| `helm-repositories` | list | No | `[]` | Additional Helm repositories to register. |
| `system` | list | No | `[]` | Catalog workload entries. |
| `user` | list | No | `[]` | Custom workload entries (require explicit `config`). |

**`helm-repositories` item fields**:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | **Yes** | — | Repository alias. |
| `url` | string | **Yes** | — | Repository URL. |
| `oci` | bool | No | `false` | Whether this is an OCI registry. |

**Workload item fields** (applies to both `system` and `user` lists):

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | **Yes** | — | Workload name. Lowercase alphanumeric + hyphens, 1–63 chars. |
| `enabled` | bool | **Yes** | — | Whether to deploy this workload. |
| `use-presets` | bool\|null | No | `null` | Per-workload preset override. `null` inherits the global `use-presets` setting. |
| `namespace` | string\|null | No | `null` | Kubernetes namespace. Falls back to `system-namespace` or `user-namespace`. |
| `ports` | list[int]\|null | No | `null` | TCP ports to expose via the tunnel. |
| `storage` | string\|null | No | `null` | Persistent volume size (Kubernetes format, e.g. `"10Gi"`). |
| `depends-on` | list[string]\|null | No | `null` | Workload names this workload depends on (deploy order). |
| `config` | object\|null | No | `null` | Helm chart config. Required for `user` workloads; optional for `system` workloads (catalog provides defaults). |

**`config` (WorkloadHelmConfig) fields**:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `chart` | string | **Yes** | — | Helm chart name (e.g. `"groundhog2k/postgres"`). |
| `version` | string | **Yes** | — | Chart version. |
| `values` | dict\|null | No | `null` | Helm values to pass at install time. |
| `repo.name` | string\|null | No | `null` | Helm repo alias (if not already registered). |
| `repo.url` | string\|null | No | `null` | Helm repo URL. |
| `repo.ref` | string\|null | No | `null` | Git ref (for `type: git` repos). |
| `repo.type` | string | No | `"helm"` | Repository type: `"helm"` or `"git"`. |

---

## `registry`

In-cluster OCI registry (Zot), available at `<registry.name>.<network.domain>`.

```yaml
registry:
  enabled: true       # optional, default: true
  name: cr            # optional, default: "cr"
  storage: 10Gi       # optional, default: "10Gi"
  version: null       # optional

  mirroring:
    enabled: true
    sources:
      - name: docker_hub
        enabled: true
      - name: quay
        enabled: true
      - name: ghcr
        enabled: true
      - name: k8s_registry
        enabled: true
      - name: mcr
        enabled: true
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | bool | No | `true` | Enable the in-cluster registry. |
| `name` | string | No | `"cr"` | Registry subdomain prefix. Must be a valid DNS label. |
| `storage` | string | No | `"10Gi"` | Registry storage size (Kubernetes format). |
| `version` | string\|null | No | `null` | Chart version override. Uses catalog default if null. |
| `mirroring.enabled` | bool | No | `true` | Enable pull-through mirroring. |
| `mirroring.sources` | list | No | (all 5 enabled) | Mirror sources to enable. |
| `mirroring.sources[].name` | string | **Yes** | — | Source name: `docker_hub`, `quay`, `ghcr`, `k8s_registry`, `mcr`. |
| `mirroring.sources[].enabled` | bool | No | `true` | Whether this mirror source is active. |

---

## `components`

System components installed into the cluster.

```yaml
components:
  ingress-controller:
    dashboard: false   # optional, default: false
    version: null      # optional

  dns-operator:
    version: null      # optional

  metrics-server:
    enabled: false     # optional, default: false
    version: null      # optional
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `ingress-controller.dashboard` | bool | No | `false` | Enable the Traefik dashboard. |
| `ingress-controller.version` | string\|null | No | `null` | Chart version override. |
| `dns-operator.version` | string\|null | No | `null` | dns-operator image version override. |
| `metrics-server.enabled` | bool | No | `false` | Enable the Kubernetes metrics server. |
| `metrics-server.version` | string\|null | No | `null` | Chart version override. |

---

## `tunnel`

HAProxy tunnel container that forwards TCP ports from the host into the Kind node network, allowing workload ports to be added or removed without recreating the cluster.

```yaml
tunnel:
  enabled: true          # optional, default: true
  bind-address: null     # optional, default: null (auto-detected from network.ip)
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | bool | No | `true` | Enable the HAProxy tunnel. |
| `bind-address` | string\|null | No | `null` | Host address to bind. If null, auto-detected from `network.ip`. |

---

## `plugins`

Controls which LoKO plugins are active for this environment.

```yaml
plugins:
  enabled:              # whitelist mode
    - credential_injection
    - forgejo_runner
  disabled:             # blacklist mode
    - link_resolver
  config:               # per-plugin configuration
    forgejo_runner:
      timeout: 60
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | list[string]\|null | No | `null` | Whitelist: only these plugins will run. Mutually exclusive with blacklisted names. |
| `disabled` | list[string]\|null | No | `null` | Blacklist: these plugins will not run. |
| `config` | dict\|null | No | `null` | Plugin-specific configuration keyed by plugin name. |

:::note
`enabled` and `disabled` cannot both contain the same plugin name.
:::

---

## `gitops`

GitOps integration settings. Normally written automatically by `loko gitops init` and `loko gitops destroy`.

```yaml
gitops:
  enabled: false     # default: false
  provider: fluxcd   # default: "fluxcd"
  forgejo:
    org: null        # default: null
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `enabled` | bool | No | `false` | Whether GitOps is initialized for this environment. |
| `provider` | string | No | `"fluxcd"` | GitOps provider: `"fluxcd"` or `"argocd"`. |
| `forgejo.org` | string\|null | No | `null` | Forgejo organization to own the GitOps repo. If null, the authenticated user's personal account is used. |

See the [GitOps User Guide](../user-guide/gitops) for full details.

---

## Complete Example

```yaml
name: dev-me

network:
  ip: "192.168.1.100"
  domain: "dev.me"
  subdomain:
    enabled: true
    value: apps

cluster:
  nodes:
    workers: 0

registry:
  enabled: true
  name: cr
  storage: 10Gi

components:
  ingress-controller:
    dashboard: false
  metrics-server:
    enabled: false

tunnel:
  enabled: true

workloads:
  use-presets: true
  system:
    - name: postgres
      enabled: true
      storage: 10Gi
    - name: forgejo
      enabled: true
      storage: 5Gi
      ports: [3000, 2222]
  user: []

gitops:
  enabled: false
  provider: fluxcd
  forgejo:
    org: null
```

---

## YAML Tips

### Kebab-case keys

YAML keys use kebab-case, which maps to Python snake_case in the models:

```yaml
expand-env-vars: true     # → expand_env_vars
dns-port: 5453            # → dns_port
ingress-controller: ...   # → ingress_controller
use-presets: true         # → use_presets
```

### Environment variable expansion

When `expand-env-vars: true` (the default), `${VAR}` references are expanded:

```yaml
network:
  ip: "${HOST_IP}"
```

### Boolean values

```yaml
enabled: true
enabled: false
```

---

## See Also

- [Configuration Guide](../user-guide/configuration) — how to generate and customize `loko.yaml`
- [Workload Management](../user-guide/workload-management) — adding and deploying workloads
- [GitOps](../user-guide/gitops) — GitOps integration
- [Commands Reference](commands) — CLI command reference
