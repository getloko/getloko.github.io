---
title: Internal Components
---

LoKO includes five internal components that provide core infrastructure services.

## Overview

| Component | Purpose | Can Disable? |
|-----------|---------|--------------|
| **CoreDNS + dns-operator** | In-cluster DNS for local domain resolution | ❌ No (required) |
| **HAProxy** | TCP/UDP port forwarding and load balancing | ❌ No (required) |
| **Traefik** | Ingress controller and reverse proxy | ❌ No (required) |
| **metrics-server** | Kubernetes metrics collection | ✅ Yes |
| **Zot** | OCI registry with optional mirroring | ✅ Yes |

---

## CoreDNS + dns-operator

In-cluster DNS resolution using a patched CoreDNS and a [Kubernetes operator](https://github.com/getloko/dns-operator) that dynamically tracks workload hostnames.

### Features

- **Dynamic DNS**: Automatically adds/removes hostnames as workloads are deployed
- **In-Cluster**: Runs inside the Kind cluster — no host-side DNS process
- **Wildcard-free**: Resolves only the hostnames that are actually deployed
- **Operator-Driven**: dns-operator watches Ingress, IngressRoute, and IngressRouteTCP resources

### How It Works

1. CoreDNS is patched with a `hosts` plugin pointing to the `loko-dynamic-hosts` ConfigMap
2. The dns-operator (a Kopf-based operator) watches all Ingress and IngressRoute resources
3. When a workload is created or deleted, the operator updates the ConfigMap
4. CoreDNS picks up the change and resolves the hostname to your local IP
5. The host resolver (`/etc/resolver/<domain>` on macOS) points to CoreDNS via its NodePort

### dns-operator Configuration

Version managed via Renovate:

```yaml
components:
  dns-operator:
    # renovate: datasource=docker depName=ghcr.io/getloko/dns-operator
    version: "0.0.1"
```

### Accessing DNS Status

```bash
# Check dns-operator pod
kubectl get pods -n loko-components -l app.kubernetes.io/name=dns-operator

# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Inspect dynamic hosts ConfigMap
kubectl get configmap loko-dynamic-hosts -n loko-components -o yaml

# Check dns-operator logs
kubectl logs -n loko-components -l app.kubernetes.io/name=dns-operator
```

---

## HAProxy

High-performance TCP/UDP load balancer and port forwarder.

### HAProxy Features

- **TCP/UDP Forwarding**: Routes external ports to cluster services
- **Dynamic Configuration**: Automatically updated based on workload ports
- **Load Balancing**: Distributes traffic across multiple backends
- **Health Checks**: Monitors backend availability

### HAProxy Role

HAProxy is the **required** port forwarder for LoKO and **cannot be disabled**. It provides:

- Port forwarding from host to Kubernetes cluster
- TCP routing for databases (PostgreSQL, MySQL, MongoDB, etc.)
- Dynamic port mapping based on deployed workloads
- Connection to Kind cluster's control plane

### HAProxy Configuration

Version managed via Renovate:

```yaml
haproxy:
  # renovate: datasource=docker depName=haproxy
  version: "3.3.2"
```

### How HAProxy Works

1. Listens on host ports (5432, 3306, 6379, etc.)
2. Forwards traffic to Kind cluster's control plane
3. Traefik routes to appropriate service inside the cluster

### Port Mapping Example

```
Host:5432 → HAProxy:5432 → Kind:30001 → Traefik → postgres.dev.me:5432
```

### HAProxy Access

Check HAProxy status:

```bash
# List running containers
docker ps | grep haproxy

# Check logs
docker logs loko-haproxy

# View configuration
docker exec loko-haproxy cat /usr/local/etc/haproxy/haproxy.cfg
```

---

## Traefik

Cloud-native ingress controller and reverse proxy.

### Traefik Features

- **HTTP/HTTPS Routing**: Automatic TLS termination
- **TCP/UDP Support**: Layer 4 routing for databases and services
- **Automatic Service Discovery**: Watches Kubernetes resources
- **Let's Encrypt Integration**: Automatic certificate management
- **WebSocket Support**: Full duplex communication
- **Middleware**: Rate limiting, authentication, compression

### Traefik Role

Traefik is the **required** ingress controller for LoKO and **cannot be disabled**. It provides:

- HTTP/HTTPS ingress for web UIs and APIs
- TCP routing for databases and message queues
- TLS certificate management
- Load balancing across pods

### Entrypoints

Traefik exposes two main entrypoints:

- **web** (HTTP): Port 80 → Redirects to HTTPS
- **websecure** (HTTPS): Port 443 → TLS-enabled traffic
- **TCP ports**: Dynamic based on workload requirements

### Traefik Access

Traefik dashboard is accessible via LoKO CLI:

```bash
loko status  # Shows Traefik status
```

You can also enable the Traefik web dashboard, served at `https://traefik.<domain>`:

```yaml
components:
  ingress-controller:
    dashboard: true
```

The dashboard is disabled by default.

### Traefik Configuration

Workloads use Traefik via standard Kubernetes Ingress resources:

```yaml
ingress:
  enabled: true
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
  hosts:
    - host: myapp.${LOKO_DOMAIN}
      paths: [/]
```

For TCP services, LoKO automatically creates `IngressRouteTCP` resources.

---

## metrics-server

Kubernetes metrics API provider for resource monitoring.

### metrics-server Features

- **Resource Metrics**: CPU and memory usage per pod/node
- **HPA Support**: Enables Horizontal Pod Autoscaling
- **kubectl top**: Powers `kubectl top nodes` and `kubectl top pods`
- **Lightweight**: Minimal resource footprint

### metrics-server Role

Provides metrics for monitoring and autoscaling workloads. **Can be disabled** if not needed.

### metrics-server Usage

View resource metrics:

```bash
# Node metrics
kubectl top nodes

# Pod metrics
kubectl top pods -A

# Specific namespace
kubectl top pods -n loko-workloads
```

### Disabling metrics-server

To disable metrics-server during cluster creation:

```bash
loko create --disable-metrics-server
```

Or in configuration:

```yaml
components:
  metrics-server:
    enabled: false
```

---

## Zot

OCI-compliant container registry with optional pull-through caching.

### Zot Features

- **OCI-Compliant**: Fully compatible with Docker/containerd
- **Local Image Storage**: Store and serve your custom container images
- **Optional Image Mirroring**: Cache images from upstream registries (disabled by default)
- **Deduplication**: Saves storage with content-addressable blobs
- **Vulnerability Scanning**: Built-in security scanning (optional)
- **HTTPS-Only**: Secure by default

### Zot Role

Zot serves as the **local container registry** for storing your custom images. It can optionally act as a pull-through cache for external registries. **Can be disabled** if you prefer external registries.

### Mirroring Support

Zot can mirror and cache images from external registries as a pull-through cache.

**Mirroring is disabled by default** and can be enabled in your configuration file if desired.

#### Supported Registries

When mirroring is enabled, Zot can cache images from:

- **Docker Hub**: `docker.io`
- **GitHub Container Registry**: `ghcr.io`
- **Kubernetes Registries**: `registry.k8s.io`, `k8s.gcr.io`
- **Quay**: `quay.io`
- **Microsoft Container Registry**: `mcr.microsoft.com`

#### How Mirroring Works

When you pull an image through Zot with mirroring enabled:

1. Checks local cache
2. If not found, pulls from upstream registry
3. Caches locally for future pulls
4. Serves from cache on subsequent requests

#### Enabling Mirroring

To enable mirroring, update your `loko.yaml` configuration:

```yaml
registry:
  enabled: true
  mirroring:
    enabled: true  # Enable pull-through cache
```

You can also selectively enable specific sources:

```yaml
registry:
  mirroring:
    enabled: true
    sources:
      - name: docker_hub
        enabled: true
      - name: ghcr
        enabled: true
      - name: quay
        enabled: false  # Disable specific sources
```

Available sources: `docker_hub`, `quay`, `ghcr`, `k8s_registry`, `mcr`

### Zot Access

Zot registry is accessible via the external ingress hostname:

```
<registry-name>.${LOKO_DOMAIN}
```

### Zot Usage

#### Pushing Local Images

You can always push and pull your own images to/from Zot:

```bash
# Tag and push local images
docker tag myapp:latest <registry-name>.${LOKO_DOMAIN}/myapp:latest
docker push <registry-name>.${LOKO_DOMAIN}/myapp:latest

# Pull your images
docker pull <registry-name>.${LOKO_DOMAIN}/myapp:latest
```

#### Using Mirroring (when enabled)

When mirroring is enabled, you can pull images through Zot from external registries:

```bash
# Pull and cache from Docker Hub
docker pull <registry-name>.${LOKO_DOMAIN}/library/nginx:latest

# Pull from GitHub Container Registry
docker pull <registry-name>.${LOKO_DOMAIN}/ghcr.io/user/image:tag

# Pull from Kubernetes registry
docker pull <registry-name>.${LOKO_DOMAIN}/registry.k8s.io/pause:latest
```

### Benefits

- **Local Image Storage**: Store and serve your custom images
- **Private Registry**: Keep your container images within your local cluster
- **Faster Pulls** (with mirroring): External images cached locally after first pull
- **Offline Development** (with mirroring): Work without internet once images are cached
- **Bandwidth Savings** (with mirroring): Pull from external registries once, use many times

### Disabling Zot

To disable Zot during cluster creation:

```bash
loko create --disable-registry
```

Or in configuration:

```yaml
components:
  registry:
    enabled: false
```

## Component Management

View component status:

```bash
# Check all components
loko status

# List pods in loko-system namespace
kubectl get pods -n loko-system
```

## Next Steps

- [Workload Catalog](workloads/index)
- [Contributing Guide](contributing)
