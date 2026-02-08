---
title: "Multi-Node Cluster Setup"
---


Tutorial for creating multi-node Kubernetes clusters with LoKO.

## Overview

This tutorial covers:

- Creating multi-worker clusters
- Node labeling and taints
- Workload scheduling and affinity
- Testing distributed systems
- High availability setups

**Time**: 20 minutes

**Prerequisites**:
- LoKO installed and configured
- Basic Kubernetes knowledge
- Adequate system resources (8GB+ RAM recommended)

---

## Why Multi-Node?

**Use cases**:

- **Testing distributed systems** - Simulate production topology
- **High availability** - Multiple replicas across nodes
- **Node affinity** - Test workload placement
- **Resource isolation** - Separate workload types
- **Failure scenarios** - Test node failures

**Resource requirements**:

| Workers | RAM | CPU | Disk |
|---------|-----|-----|------|
| 1 | 4GB | 2 cores | 20GB |
| 2 | 6GB | 4 cores | 30GB |
| 3 | 8GB | 6 cores | 40GB |
| 5 | 12GB+ | 8+ cores | 50GB+ |

---

## Step 1: Create Multi-Worker Cluster

### Configure Workers

Edit `loko.yaml`:

```yaml
cluster:
  nodes:
    servers: 1          # Control plane nodes
    workers: 3          # Create 3 worker nodes
```

### Create Cluster

```bash
loko env create
```

**Output**:
```
Creating cluster with 3 worker nodes...
✓ Creating cluster "loko-dev-me" ...
  • Control plane: 1 node
  • Worker nodes: 3 nodes
✓ Writing kubeconfig
✓ Installing components
✓ Cluster ready
```

### Verify Nodes

```bash
kubectl get nodes
```

**Output**:
```
NAME                        STATUS   ROLES           AGE   VERSION
loko-dev-me-control-plane   Ready    control-plane   2m    v1.35.0
loko-dev-me-worker          Ready    <none>          1m    v1.35.0
loko-dev-me-worker2         Ready    <none>          1m    v1.35.0
loko-dev-me-worker3         Ready    <none>          1m    v1.35.0
```

---

## Step 2: Label Nodes

### Add Labels for Workload Types

```bash
# Label nodes for different workload types
kubectl label node loko-dev-me-worker workload-type=database
kubectl label node loko-dev-me-worker2 workload-type=application
kubectl label node loko-dev-me-worker3 workload-type=cache
```

### Add Tier Labels

```bash
# High-tier nodes (SSD, more resources)
kubectl label node loko-dev-me-worker tier=high

# Standard-tier nodes
kubectl label node loko-dev-me-worker2 tier=standard
kubectl label node loko-dev-me-worker3 tier=standard
```

### Verify Labels

```bash
kubectl get nodes --show-labels
```

---

## Step 3: Configure Node Labels in LoKO

Add labels via configuration:

```yaml
cluster:
  nodes:
    servers: 1
    workers: 3
    labels:
      worker:
        # Labels applied to all worker nodes
        environment: "development"
        managed-by: "loko"
```

For per-node labels, use kubectl after creation.

---

## Step 4: Deploy with Node Affinity

### Database on Specific Node

Deploy PostgreSQL to database node:

**postgres-values.yaml**:
```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: workload-type
          operator: In
          values:
          - database
```

```bash
# Add to loko.yaml
workloads:
  postgres:
    enabled: true
    values:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: workload-type
                operator: In
                values:
                - database

# Deploy
loko workloads deploy postgres
```

### Verify Pod Placement

```bash
kubectl get pods -n loko-workloads -o wide
```

**Output**:
```
NAME              READY   STATUS    NODE
postgres-0        1/1     Running   loko-dev-me-worker   # On database node
```

---

## Step 5: Spread Replicas Across Nodes

### Deploy with Pod Anti-Affinity

**web-app.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web-app
            topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
```

Deploy:
```bash
kubectl apply -f web-app.yaml
```

Verify distribution:
```bash
kubectl get pods -l app=web-app -o wide
```

**Output** (pods spread across nodes):
```
NAME                      NODE
web-app-xxx-aaa          loko-dev-me-worker
web-app-xxx-bbb          loko-dev-me-worker2
web-app-xxx-ccc          loko-dev-me-worker3
```

---

## Step 6: Node Taints and Tolerations

### Taint Node for Special Workloads

```bash
# Taint node for GPU workloads
kubectl taint node loko-dev-me-worker3 gpu=true:NoSchedule
```

### Deploy with Toleration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-workload
spec:
  tolerations:
  - key: "gpu"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
  nodeSelector:
    gpu: "true"
  containers:
  - name: app
    image: my-gpu-app
```

### Remove Taint

```bash
kubectl taint node loko-dev-me-worker3 gpu=true:NoSchedule-
```

---

## Step 7: Test High Availability

### Deploy Replicated Database

**postgres-ha.yaml**:
```yaml
workloads:
  postgres:
    enabled: true
    values:
      replicaCount: 3  # 3 replicas
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - postgres
              topologyKey: kubernetes.io/hostname
```

### Simulate Node Failure

```bash
# Cordon node (prevent new pods)
kubectl cordon loko-dev-me-worker

# Drain node (evict pods)
kubectl drain loko-dev-me-worker --ignore-daemonsets --delete-emptydir-data

# Watch pods reschedule
kubectl get pods -w
```

### Restore Node

```bash
kubectl uncordon loko-dev-me-worker
```

---

## Step 8: Resource Management

### Set Resource Quotas per Node

**namespace-quota.yaml**:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: default
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
```

### Monitor Resource Usage

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -A

# Describe node
kubectl describe node loko-dev-me-worker
```

---

## Step 9: Distributed Application Example

### Deploy Distributed System

**Example: 3-tier application**

```yaml
# Frontend (2 replicas, any node)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      tier: frontend
  template:
    metadata:
      labels:
        tier: frontend
    spec:
      containers:
      - name: nginx
        image: nginx
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
---
# Backend API (3 replicas, spread across nodes)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      tier: backend
  template:
    metadata:
      labels:
        tier: backend
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: tier
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname
      containers:
      - name: api
        image: my-api
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
---
# Database (1 replica, database node)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
spec:
  serviceName: database
  replicas: 1
  selector:
    matchLabels:
      tier: database
  template:
    metadata:
      labels:
        tier: database
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: workload-type
                operator: In
                values:
                - database
      containers:
      - name: postgres
        image: postgres:15
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
```

Deploy:
```bash
kubectl apply -f application.yaml
```

Verify distribution:
```bash
kubectl get pods -o wide
```

---

## Step 10: Scaling

### Scale Workers

To add/remove workers, recreate cluster:

```yaml
cluster:
  nodes:
    servers: 1
    workers: 5  # Increase to 5
```

```bash
loko env recreate
```

**Note**: This recreates the cluster. For production, use cluster autoscaling.

### Scale Workloads

```bash
# Scale deployment
kubectl scale deployment frontend --replicas=5

# Scale statefulset
kubectl scale statefulset database --replicas=3
```

---

## Advanced Configurations

### Custom Node Configurations

For different node types (via Kind config):

```yaml
# Advanced: Custom Kind config
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
    labels:
      tier: high
      ssd: "true"
  - role: worker
    labels:
      tier: standard
  - role: worker
    labels:
      tier: standard
```

### Pod Topology Spread

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: my-app
```

### DaemonSets

Run on all nodes:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-agent
spec:
  selector:
    matchLabels:
      name: monitoring
  template:
    metadata:
      labels:
        name: monitoring
    spec:
      containers:
      - name: agent
        image: monitoring-agent
```

---

## Troubleshooting

### Node not ready

```bash
# Check node status
kubectl describe node <node-name>

# Check logs
docker exec -it <node-name> journalctl -xeu kubelet
```

### Pods not scheduling

```bash
# Check pod events
kubectl describe pod <pod-name>

# Common issues:
# - Insufficient resources
# - Unsatisfied affinity rules
# - Taints without tolerations
```

### Uneven distribution

```bash
# Check pod distribution
kubectl get pods -A -o wide | awk '{print $8}' | sort | uniq -c

# Rebalance if needed
kubectl drain <node> --ignore-daemonsets
kubectl uncordon <node>
```

---

## Performance Considerations

### Resource Allocation

```yaml
# Per worker (example)
resources:
  worker1:
    cpu: 2 cores
    memory: 4GB
  worker2:
    cpu: 2 cores
    memory: 4GB
  worker3:
    cpu: 2 cores
    memory: 4GB
```

### Docker Resources

Adjust Docker Desktop resources:

**Settings → Resources**:
- CPUs: 8+ (for 3+ workers)
- Memory: 8GB+ (for 3+ workers)
- Swap: 2GB
- Disk: 50GB+

---

## See Also

- [First Cluster Tutorial](first-cluster) - Getting started
- [Deploy Database](deploy-database) - Database deployment
- [Custom Workload](custom-workload) - Custom applications
- [Configuration Guide](../user-guide/configuration) - Advanced configuration
- [Kubernetes Documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/) - Scheduling concepts
