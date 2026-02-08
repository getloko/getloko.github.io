---
title: "LoKO vs Alternatives"
---


**Choosing the right local development environment matters.** This guide compares LoKO with other popular tools so you can make an informed decision.

:::tip[The Short Answer]
- **vs Docker Containers**: LoKO gives you orchestration and real Kubernetes features
- **vs docker-compose**: LoKO provides actual Kubernetes, not YAML that pretends
- **vs Minikube**: LoKO is faster, supports multi-node, and has better networking
- **vs Kind**: LoKO **IS** Kind, but with all the batteries included (DNS, TLS, registry, catalog, routing)
:::

---

## LoKO vs Docker Containers

Running standalone containers is simple for single services, but quickly becomes painful for multi-service applications.

### Docker Containers: Manual Everything

```bash
# Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=mypass \
  -p 5432:5432 \
  postgres:17

# Start Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7

# Start your app - hope you got the networking right!
docker run -d \
  --name myapp \
  --link postgres \
  --link redis \
  -p 8080:8080 \
  myapp:latest
```

**Problems**:
- ❌ No service discovery (hardcoded IPs or legacy `--link`)
- ❌ No DNS resolution between containers
- ❌ No orchestration (restarts, health checks, scaling)
- ❌ Port conflicts when multiple apps need port 5432
- ❌ No load balancing or ingress
- ❌ Doesn't match production Kubernetes behavior

### LoKO: Kubernetes Environment

```bash
loko workloads add postgres redis
loko create

# Everything auto-configured:
# - DNS: postgres.dev.me, redis.dev.me
# - Networking: Services discover each other
# - Ports: Intelligent routing, no conflicts
# - Persistence: Proper volumes with storage classes
# - Health checks: Automatic monitoring
```

**Benefits**:
- ✅ Real Kubernetes environment
- ✅ DNS resolution everywhere (host and cluster)
- ✅ Service discovery built-in
- ✅ No port conflicts
- ✅ Proper persistent volumes
- ✅ Health checks and auto-restart
- ✅ Matches production behavior

**Use Docker Containers When**: Testing a single, isolated service

**Use LoKO When**: Building multi-service applications, need orchestration, or want production parity

---

## LoKO vs docker-compose

docker-compose is popular for local development, but it's not Kubernetes. Apps that work in Compose often fail when deployed to real K8s.

### docker-compose: YAML That Looks Like K8s

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: mypass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  myapp:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgres://postgres:mypass@postgres:5432/mydb

volumes:
  postgres_data:
```

**Problems**:
- ❌ Not actually Kubernetes - different networking, DNS, behavior
- ❌ No Ingress controller (just port mappings)
- ❌ No Services, Deployments, or K8s resources
- ❌ Can't test Helm charts
- ❌ No NetworkPolicies, RBAC, or K8s security features
- ❌ Can't test pod scheduling, affinity, or multi-node scenarios
- ❌ "Works in Compose" ≠ "Works in production K8s"

### LoKO: Actual Kubernetes

```bash
# Add PostgreSQL
loko workloads add postgres
loko create

# Deploy your app with real K8s manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

Your `deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3  # Test scaling
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      affinity:  # Test pod affinity
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: myapp
            topologyKey: kubernetes.io/hostname
      containers:
      - name: myapp
        image: cr.dev.me/myapp:latest
```

**Benefits**:
- ✅ **Real Kubernetes** - same API, same behavior as production
- ✅ Test actual Helm charts and K8s manifests
- ✅ Ingress controller (Traefik) with real routing
- ✅ Services, NetworkPolicies, RBAC all work
- ✅ Multi-node clusters for testing scheduling
- ✅ If it works in LoKO, it works in prod

**Use docker-compose When**: Your production deployment doesn't use Kubernetes

**Use LoKO When**: Your production runs on Kubernetes and you want confidence your code works

---

## LoKO vs Minikube

Minikube was the original "local Kubernetes" tool, but it has limitations that make development frustrating.

### Minikube: The Old Guard

```bash
# Start cluster (single-node only)
minikube start --driver=docker

# Enable ingress addon
minikube addons enable ingress

# Access services requires tunneling
minikube service myapp --url
# http://127.0.0.1:54321  # Random port, changes on restart

# Or constant port-forwarding
kubectl port-forward service/postgres 5432:5432
# Keep this terminal open forever...
```

**Problems**:
- ❌ **Single-node only** - can't test multi-node scenarios
- ❌ Slow startup (VM overhead on macOS/Windows)
- ❌ No automatic DNS - access via `minikube service` or port-forward
- ❌ Certificate setup is manual and painful
- ❌ No built-in registry - push to Docker Hub or set up yourself
- ❌ Networking requires `minikube tunnel` (needs sudo)
- ❌ Port changes on every restart

### LoKO: Modern Multi-Node K8s

```bash
# Create multi-node cluster
loko config generate
# Edit loko.yaml: set workers: 3
loko create

# Access services directly
psql -h postgres.dev.me -U postgres
curl https://myapp.dev.me

# No port-forward, no tunneling, no sudo
# DNS and routing just work
```

**Benefits**:
- ✅ **Multi-node clusters** - test real pod scheduling
- ✅ Fast startup (native Docker, no VM on Linux)
- ✅ Automatic DNS for all services (`*.dev.me`)
- ✅ TLS certificates pre-installed and trusted
- ✅ Built-in OCI registry at `cr.dev.me`
- ✅ Direct service access from host
- ✅ Consistent ports (no random mappings)

**Comparison Table**:

| Feature | Minikube | LoKO |
|---------|----------|------|
| Multi-node | ❌ Single-node only | ✅ Configurable workers |
| Startup Time | ~2-3 min (VM) | ~1-2 min (Docker) |
| DNS Resolution | ❌ Manual setup | ✅ Auto-configured |
| TLS Certificates | ❌ Manual | ✅ Auto-generated & trusted |
| Container Registry | ❌ None (manual setup) | ✅ Built-in at cr.dev.me |
| Service Access | ❌ Port-forward/tunnel | ✅ Direct DNS access |
| Workload Catalog | ❌ None | ✅ Pre-configured workloads |

**Use Minikube When**: You're stuck on very old documentation

**Use LoKO When**: You want fast, multi-node, modern local Kubernetes

---

## LoKO vs Kind (Kubernetes in Docker)

**Here's the truth: LoKO uses Kind under the hood.** Kind is an excellent tool for creating Kubernetes clusters in Docker. LoKO doesn't replace Kind - it enhances it with everything you need for actual development work.

### Bare Kind: DIY Everything

Kind gives you a cluster, then leaves you to figure out the rest:

```bash
# Create cluster
kind create cluster --name dev

# Now the fun begins...

# 1. Set up Ingress (200 lines of YAML)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
# Wait for it to be ready...
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# 2. Configure DNS manually
# Edit /etc/hosts for EVERY service
echo "127.0.0.1 myapp.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 postgres.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 api.local" | sudo tee -a /etc/hosts
# Repeat for every service...
# Breaks after sleep/reboot, repeat again...

# 3. Set up TLS (if you want HTTPS)
# Install cert-manager (another 500 lines of YAML)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
# Configure self-signed issuer
# Create Certificate resources for each domain
# Get browser warnings anyway...

# 4. Want a registry?
# Run a separate Docker container
docker run -d -p 5000:5000 --name registry registry:2
# Configure Kind to use it
# Create and apply containerd config
# Restart cluster...

# 5. Want PostgreSQL?
# Find a Helm chart
# Write 150 lines of values.yaml
# Figure out passwords, persistence, networking
# Debug why it won't start
# Repeat for Redis, MySQL, RabbitMQ...

# 6. Access services
# Port-forward EVERYTHING
kubectl port-forward service/postgres 5432:5432 &
kubectl port-forward service/redis 6379:6379 &
kubectl port-forward service/rabbitmq 5672:5672 &
# Now you have 10 terminals open...
```

**You spend hours on infrastructure instead of building your app.**

### LoKO: Kind + All the Batteries

LoKO takes Kind and adds everything you actually need:

```bash
# Generate config
loko config generate

# Add services you need
loko workloads add postgres redis rabbitmq

# Create everything
loko create

# Done. Everything works:
# ✅ Multi-node Kind cluster
# ✅ DNS: postgres.dev.me, redis.dev.me (no /etc/hosts)
# ✅ TLS: Valid HTTPS certificates (no warnings)
# ✅ Registry: cr.dev.me for images/charts
# ✅ Ingress: Traefik configured and ready
# ✅ PostgreSQL + pgAdmin running
# ✅ Redis running
# ✅ RabbitMQ + management UI running
# ✅ Intelligent TCP routing (no port-forward)
# ✅ Passwords auto-generated and saved
```

**You start building your app immediately.**

### What LoKO Adds to Kind

Think of LoKO as **"Kind with extra super-duper batteries included"**:

| Component | Bare Kind | LoKO |
|-----------|-----------|------|
| **Cluster Creation** | ✅ Multi-node K8s | ✅ Same (uses Kind) |
| **DNS Resolution** | ❌ Edit /etc/hosts | ✅ CoreDNS auto-configured |
| **TLS Certificates** | ❌ DIY or warnings | ✅ mkcert wildcard certs |
| **Container Registry** | ❌ Manual setup | ✅ Zot OCI registry built-in |
| **Ingress Controller** | ❌ 200-line YAML | ✅ Traefik pre-configured |
| **TCP Port Routing** | ❌ Port-forward hell | ✅ HAProxy tunnel auto-managed |
| **Workload Catalog** | ❌ None | ✅ Pre-configured workloads services |
| **Password Management** | ❌ DIY | ✅ Auto-generated & saved |
| **Configuration** | ❌ Many YAML files | ✅ Single loko.yaml |

### Real Example: Setting Up PostgreSQL

**With Kind** (~30-45 minutes):
1. Find PostgreSQL Helm chart
2. Create `values.yaml` with ~150 lines
3. Generate password securely
4. Configure persistence
5. Install Helm chart
6. Debug why PVC won't bind
7. Fix storage class issues
8. Set up DNS entry in /etc/hosts
9. Port-forward to access: `kubectl port-forward svc/postgres 5432:5432`
10. Keep terminal open forever
11. Repeat for pgAdmin if you want a UI

**With LoKO** (~30 seconds):
```bash
loko workloads add postgres
loko workloads deploy postgres

# Done. Access it:
psql -h postgres.dev.me -U postgres
# Or web UI:
open https://postgres-ui.dev.me
```

### LoKO's Architecture with Kind

```mermaid
graph TB
    LoKO[LoKO CLI]
    Config[loko.yaml]

    subgraph "LoKO Additions"
        DNS[CoreDNS<br/>+ dns-operator]
        TLS[mkcert<br/>TLS Certificates]
        HAProxy[HAProxy<br/>TCP Tunnel]
        Catalog[Workload<br/>Catalog]
    end

    subgraph "Kind Cluster"
        Kind[Kind<br/>Multi-node K8s]
        Traefik[Traefik<br/>Ingress]
        Registry[Zot<br/>OCI Registry]
        Workloads[Your<br/>Workloads]
    end

    LoKO -->|generates| Config
    Config -->|configures| DNS
    Config -->|generates| TLS
    Config -->|manages| HAProxy
    Config -->|creates| Kind
    Config -->|deploys from| Catalog

    DNS -.->|resolves| Workloads
    TLS -.->|secures| Traefik
    HAProxy -.->|routes TCP| Workloads
    Catalog -.->|deploys| Workloads

    Kind -->|runs| Traefik
    Kind -->|runs| Registry
    Kind -->|runs| Workloads
```

**LoKO doesn't replace Kind. LoKO automates everything around Kind so you can focus on development.**

### Why Not Just Use Kind?

**You absolutely can!** Kind is great if you:
- Want full control over every detail
- Enjoy writing Kubernetes YAML
- Have time to set up DNS, TLS, registry, ingress
- Don't mind maintaining all that infrastructure
- Only need a cluster occasionally

**Use LoKO if you**:
- Want to start developing immediately
- Prefer configuration over manual setup
- Need DNS and TLS that "just works"
- Want a catalog of pre-configured services
- Develop on Kubernetes regularly

**LoKO is Kind for developers who want to build apps, not infrastructure.**

---

## Feature Comparison Matrix

| Feature | Docker | Compose | Minikube | Kind | **LoKO** |
|---------|--------|---------|----------|------|----------|
| **Real Kubernetes** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Multi-Node Clusters** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Auto DNS Resolution** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **TLS Certificates** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Container Registry** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Ingress Controller** | ❌ | ❌ | ⚠️ Addon | ⚠️ Manual | ✅ |
| **TCP Port Routing** | ⚠️ Manual | ⚠️ Manual | ❌ | ❌ | ✅ |
| **Workload Catalog** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Production Parity** | ❌ | ❌ | ⚠️ Partial | ✅ | ✅ |
| **Setup Time** | Fast | Fast | Slow | Fast | Fast |
| **Ease of Use** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## When to Use What

### Use Standalone Docker When:
- Testing a single, isolated service
- Running one-off commands in containers
- You don't need networking or orchestration

### Use docker-compose When:
- Production doesn't use Kubernetes
- You need simple multi-container apps
- You're okay with different behavior than production

### Use Minikube When:
- You need exactly what Minikube provides
- Single-node is sufficient
- You don't mind manual DNS/TLS setup

### Use Kind Directly When:
- You want complete control
- You're building CI/CD pipelines
- You're testing Kubernetes itself
- You enjoy infrastructure work

### Use LoKO When:
- **You develop on Kubernetes regularly**
- **You want production parity**
- **You need multiple services (databases, caches, etc.)**
- **You want DNS and TLS to "just work"**
- **You want to focus on your app, not infrastructure**
- **You want Kind with all the batteries included**

---

## Migration Paths

### From docker-compose to LoKO

1. **Add PostgreSQL** (was: `postgres` service)
   ```bash
   loko workloads add postgres
   ```

2. **Add Redis** (was: `redis` service)
   ```bash
   loko workloads add redis
   ```

3. **Convert your app** from compose to K8s:
   ```yaml
   # compose: build: .
   # becomes:
   docker build -t cr.dev.me/myapp:latest .
   docker push cr.dev.me/myapp:latest
   ```

4. **Deploy**:
   ```bash
   loko create
   kubectl apply -f deployment.yaml
   ```

### From Minikube to LoKO

1. **Export your manifests** (if needed):
   ```bash
   kubectl get all -o yaml > backup.yaml
   ```

2. **Create LoKO cluster**:
   ```bash
   loko config generate
   loko create
   ```

3. **Deploy your apps**:
   ```bash
   kubectl apply -f backup.yaml
   ```

4. **Delete Minikube**:
   ```bash
   minikube delete
   ```

### From Kind to LoKO

**Good news: You're already using Kind!** LoKO just makes it better.

1. **Generate LoKO config**:
   ```bash
   loko config generate
   ```

2. **Add workloads you need**:
   ```bash
   loko workloads add postgres redis
   ```

3. **Create LoKO environment**:
   ```bash
   loko create
   ```

4. **Your existing kubectl commands still work**:
   ```bash
   kubectl apply -f manifests/
   helm install myapp charts/myapp
   ```

---

## Try LoKO Today

Ready to stop fighting infrastructure and start building?

**[Get Started →](../getting-started/installation)**

**Questions?** Check the [FAQ](../reference/faq) or [open an issue](https://github.com/getloko/loko/issues).
