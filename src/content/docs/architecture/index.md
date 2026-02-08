---
title: "How LoKO Works"
---


**Want to understand what happens when you run `loko create`?** This visual guide shows you exactly how LoKO transforms your simple config into a complete Kubernetes development environment.

---

## The Simple Story

```mermaid
%% title: LoKO Setup Flow %%
graph TD
    Start["🚀 Start Here<br/>$ loko config generate"]
    Config["📝 Config Created<br/>loko.yaml with defaults"]
    Edit["✏️ Edit as Needed<br/>Add workloads, customize"]
    Command["⚡ One Command<br/>$ loko create"]

    subgraph Magic["✨ LoKO Sets Up Everything"]
        direction LR
        K8s["☸️ Kubernetes Cluster<br/>Multi-node Kind cluster"]
        DNS["🌐 DNS Resolution<br/>*.dev.me auto-resolves"]
        Certs["🔒 TLS Certificates<br/>Wildcard HTTPS certs"]
        Reg["📦 Container Registry<br/>Local OCI registry (Control Plane)"]
        Tunnel["🔌 TCP Tunnel<br/>Dynamic port routing via IngressRouteTCP"]
        Ports["🚪 Intelligent Routing<br/>HTTP/HTTPS auto-routed"]
    end

    Result["🎉 Everything Just Works!"]

    subgraph Examples["💡 What You Can Do"]
        direction LR
        Ex1["🗄️ Access Services<br/>psql -h postgres.dev.me<br/>redis.dev.me:6379"]
        Ex2["🌐 Deploy Web Apps<br/>https://myapp.dev.me"]
        Ex3["💻 Develop Your App<br/>Use databases, caches,<br/>messaging, etc."]
        Ex4["📦 Push Images/Charts<br/>docker push cr.dev.me/myapp<br/>helm push chart.tgz oci://cr.dev.me"]
    end

    Start -->|Generates| Config
    Config -->|Optional| Edit
    Edit -->|Run| Command
    Command -->|Automatic| K8s
    Command -->|Automatic| DNS
    Command -->|Automatic| Certs
    Command -->|Automatic| Reg
    Command -->|Automatic| Tunnel
    Command -->|Automatic| Ports

    K8s -.-> Result
    DNS -.-> Result
    Certs -.-> Result
    Reg -.-> Result
    Tunnel -.-> Result
    Ports -.-> Result

    Result --> Ex1
    Result --> Ex2
    Result --> Ex3
    Result --> Ex4

    classDef startStyle fill:#1e88e5,stroke:#1565c0,stroke-width:3px,color:#fff,font-weight:bold
    classDef configStyle fill:#8e24aa,stroke:#6a1b9a,stroke-width:3px,color:#fff,font-weight:bold
    classDef editStyle fill:#fb8c00,stroke:#e65100,stroke-width:3px,color:#fff
    classDef commandStyle fill:#e53935,stroke:#c62828,stroke-width:4px,color:#fff,font-weight:bold
    classDef magicStyle fill:#00897b,stroke:#00695c,stroke-width:2px,color:#fff
    classDef resultStyle fill:#43a047,stroke:#2e7d32,stroke-width:4px,color:#fff,font-weight:bold
    classDef exampleStyle fill:#546e7a,stroke:#37474f,stroke-width:2px,color:#fff

    class Start startStyle
    class Config configStyle
    class Edit editStyle
    class Command commandStyle
    class K8s,DNS,Certs,Reg,Tunnel,Ports magicStyle
    class Result resultStyle
    class Ex1,Ex2,Ex3,Ex4 exampleStyle
```

**That's it.** LoKO automates everything between your config file and a working Kubernetes environment.

---

## What LoKO Sets Up

When you run `loko create`, here's what gets configured automatically:

### 🌐 DNS Resolution (dnsmasq)

**What**: In-cluster CoreDNS patched with a dynamic hosts plugin, managed by the dnsmasq.

**Why it matters**:
- No editing `/etc/hosts` for every service
- Automatically updates when workloads are added or removed
- No host-side DNS process to manage or restart
- Works from browser, terminal, and inside cluster

**Result**: `postgres.dev.me`, `redis.dev.me`, `myapp.dev.me` all resolve instantly.

---

### 🔒 TLS Certificates (cfssl)

**What**: Wildcard SSL certificate trusted by your system.

**Why it matters**:
- HTTPS works in browsers with no warnings
- Docker trusts the registry
- Feels like production

**Result**: `https://myapp.dev.me` has a valid green padlock 🔒

---

### ☸️ Kubernetes Cluster (Kind)

**What**: Multi-node Kubernetes cluster running in Docker.

**Why it matters**:
- Real Kubernetes, not docker-compose pretending
- Test pod scheduling, affinity, multi-node scenarios
- Same API and behavior as production

**Result**: Actual Kubernetes with working Ingress and Services.

---

### 📦 Container Registry (Zot)

**What**: Local OCI registry at `cr.dev.me` running on control plane.

**Why it matters**:
- Push images locally, no Docker Hub rate limits
- Cache well-known images
- Push Helm charts as OCI artifacts
- Runs on control plane for cluster-wide access

**Result**: `docker push cr.dev.me/myapp:latest` works instantly.

---

### 🔌 TCP Tunnel (HAProxy)

**What**: Dynamic port routing for database connections via Traefik IngressRouteTCP.

**Why it matters**:
- Access PostgreSQL, MySQL, Redis from host
- Routes through Traefik's IngressRouteTCP to worker nodes
- No cluster recreation when adding workloads
- Automatic port management

**Result**: `psql -h postgres.dev.me` connects directly to worker nodes.

---

### 🚪 Intelligent Routing (Traefik)

**What**: Ingress controller that routes HTTP/HTTPS and TCP traffic.

**Why it matters**:
- Web apps get HTTPS automatically
- TCP workloads get dedicated routing
- Production-like traffic handling

**Result**: Everything just works - HTTP, HTTPS, and TCP.

---

## The Complete Infrastructure

Here's how all the pieces fit together:

```mermaid
%% title: Complete Infrastructure %%
graph TD
    subgraph Machine["Your Machine"]
        direction LR
        Browser["🌐 Browser"]
        Terminal["💻 Terminal<br/>(psql, valkey-cli, etc)"]
        Docker["🐳 Docker"]
    end

    subgraph Infrastructure["LoKO Infrastructure"]
        direction LR
        Tunnel["HAProxy<br/>TCP Tunnel<br/>dynamic ports"]
    end

    subgraph Cluster["Kind Cluster"]
        direction TB

        subgraph ControlPlane["Control Plane"]
            direction LR
            API["Kubernetes API"]
            Traefik["Traefik<br/>Ingress Controller<br/>:80, :443"]
            Registry["Zot Registry<br/>cr.dev.me<br/>:443"]
            DNS["CoreDNS<br/>+ dnsmasq<br/>(NodePort)"]
        end

        subgraph Workers["Worker Nodes"]
            direction LR
            PG["PostgreSQL<br/>:5432"]
            Redis["Valkey<br/>:6379"]
            Web["Your App<br/>:8080"]
        end
    end

    %% Connections - Top to Bottom Flow
    Browser -->|"https://myapp.dev.me"| DNS
    Browser -->|"https://cr.dev.me"| DNS
    Terminal -->|"postgres.dev.me"| DNS

    DNS -->|"resolves to cluster IP"| Traefik
    DNS -->|"resolves to cluster IP"| Tunnel

    Traefik -->|"HTTPS :443"| Web
    Traefik -->|"HTTPS :443"| Registry

    Tunnel -->|"TCP"| Traefik
    Traefik -->|"IngressRouteTCP :5432"| PG
    Traefik -->|"IngressRouteTCP :6379"| Redis

    Docker -.->|"runs"| Tunnel
    Docker -.->|"runs"| API

    classDef machineStyle fill:#0288d1,stroke:#01579b,color:#fff
    classDef infraStyle fill:#fb8c00,stroke:#e65100,color:#fff
    classDef controlStyle fill:#8e24aa,stroke:#6a1b9a,color:#fff
    classDef registryStyle fill:#00897b,stroke:#00695c,color:#fff
    classDef workerStyle fill:#43a047,stroke:#2e7d32,color:#fff

    class Browser,Terminal,Docker machineStyle
    class Tunnel infraStyle
    class DNS,API,Traefik controlStyle
    class Registry registryStyle
    class PG,Redis,Web workerStyle
```

### Traffic Flows

**HTTPS Request** (Browser → Web App):
```
Browser → DNS (resolves myapp.dev.me) → Traefik :443 → Your App (Worker Node)
```

**Container Registry** (Control Plane):
```
Browser → DNS (resolves cr.dev.me) → Traefik :443 → Zot Registry (Control Plane)
```

**TCP Database Connection** (Terminal → PostgreSQL):
```
Terminal → DNS (resolves postgres.dev.me) → HAProxy Tunnel → Traefik IngressRouteTCP → PostgreSQL (Worker Node)
```

**Internal Communication** (App → Database):
```
App Pod → CoreDNS → PostgreSQL Service → PostgreSQL Pod
```

---

## Why This Architecture?

### ✅ Separation of Concerns

Each tool does one thing well:
- **Kind**: Kubernetes cluster
- **dnsmasq**: In-cluster DNS resolution, dynamically updated
- **cfssl**: TLS certificate generation
- **HAProxy**: Dynamic TCP routing
- **Zot**: Container registry
- **Traefik**: Ingress and routing
- **LoKO**: Orchestrates everything

### ✅ Production Parity

- Real Ingress controller (Traefik)
- Real DNS resolution
- Real TLS termination
- Real Services and NetworkPolicies
- Multi-node clusters

**If it works in LoKO, it works in production.**

### ✅ Developer Experience

- No manual DNS configuration
- No certificate warnings
- No port conflicts
- No kubectl port-forward gymnastics
- **Just works.**

---

## Quick Reference

| Component | Purpose | Access |
|-----------|---------|--------|
| **DNS** | Resolve `*.dev.me` | Automatic |
| **TLS** | HTTPS certificates | `https://` URLs |
| **Kind** | Kubernetes cluster | `kubectl` |
| **Registry** | Container images | `cr.dev.me` |
| **Tunnel** | TCP port routing | Direct connections |
| **Traefik** | HTTP/HTTPS routing | Ingress resources |

---

**Ready to try it?** → [Quick Start Guide](../getting-started/quick-start)

**Want to customize?** → [Configuration Guide](../user-guide/configuration)
