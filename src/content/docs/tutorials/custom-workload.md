---
title: "Deploy a Custom Workload"
---


Tutorial for deploying your own applications to LoKO.

## Overview

This tutorial covers:

- Creating a custom workload definition
- Deploying from custom Helm charts
- Using your own Docker images
- Configuring ingress and services
- Adding to the local catalog

**Time**: 15 minutes

**Prerequisites**:
- LoKO environment running
- Basic Kubernetes/Helm knowledge
- Docker image (or use example)

---

## Scenario

We'll deploy a custom web application with:

- Frontend (Nginx serving static files)
- Backend API (Node.js/Express)
- Database connection (PostgreSQL)
- Ingress for HTTP access

---

## Method 1: Quick Deployment (No Helm Chart)

### Step 1: Create Docker Image

**app.js** (Simple Express API):
```javascript
const express = require('express')
const app = express()

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() })
})

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from LoKO!' })
})

app.listen(3000, () => console.log('API listening on port 3000'))
```

**Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

**Build and push**:
```bash
# Build
docker build -t my-api:latest .

# Tag for local registry
docker tag my-api:latest cr.dev.me:5000/my-api:latest

# Push to LoKO registry
docker push cr.dev.me:5000/my-api:latest
```

### Step 2: Create Kubernetes Manifests

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-api
  template:
    metadata:
      labels:
        app: my-api
    spec:
      containers:
      - name: api
        image: cr.dev.me:5000/my-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: development
---
apiVersion: v1
kind: Service
metadata:
  name: my-api
  namespace: default
spec:
  selector:
    app: my-api
  ports:
  - port: 3000
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-api
  namespace: default
spec:
  rules:
  - host: api.apps.dev.me
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-api
            port:
              number: 3000
```

### Step 3: Deploy

```bash
kubectl apply -f deployment.yaml
```

### Step 4: Access

```bash
# Wait for pods
kubectl get pods

# Test API
curl http://api.apps.dev.me/api/health
curl http://api.apps.dev.me/api/hello
```

---

## Method 2: Using Helm Chart

### Step 1: Create Helm Chart

```bash
# Create chart structure
helm create my-app

cd my-app
```

**Edit values.yaml**:
```yaml
replicaCount: 2

image:
  repository: cr.dev.me:5000/my-api
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: traefik
  hosts:
    - host: myapp.apps.dev.me
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

env:
  - name: NODE_ENV
    value: development
  - name: DB_HOST
    value: postgres.dev.me
  - name: DB_PORT
    value: "5432"
```

**Edit templates/deployment.yaml**:
Add environment variables from values:

```yaml
{{- if .Values.env }}
env:
{{- toYaml .Values.env | nindent 12 }}
{{- end }}
```

### Step 2: Package Chart

```bash
# Package chart
helm package .

# Output: my-app-0.1.0.tgz
```

### Step 3: Deploy with Helm

```bash
# Install
helm install my-app ./my-app-0.1.0.tgz -n default

# Upgrade
helm upgrade my-app ./my-app-0.1.0.tgz -n default

# Check status
helm status my-app -n default
```

### Step 4: Access

```bash
curl http://myapp.apps.dev.me/api/health
```

---

## Method 3: Add to LoKO Catalog

### Step 1: Create Catalog Entry

Edit `~/.config/loko/catalog.yaml`:

```yaml
workloads:
  my-app:
    category: "application"
    description: "My custom application"
    chart:
      repo: "local"  # Or your Helm repo
      name: "my-app"
      version: "0.1.0"
    defaults:
      namespace: "default"
      ports: []  # No TCP ports needed (HTTP only)
    presets:
      replicaCount: 2
      image:
        repository: cr.dev.me:5000/my-api
        tag: latest
      ingress:
        enabled: true
        hosts:
          - host: myapp.apps.dev.me
            paths:
              - path: /
                pathType: Prefix
```

### Step 2: Add Helm Repository (Optional)

If using remote Helm repository:

```yaml
helm-repositories:
  - name: "my-repo"
    url: "https://charts.example.com"
```

### Step 3: Use LoKO Commands

Now you can manage it like built-in workloads:

```bash
# Add to environment
loko workloads add my-app

# Deploy
loko workloads deploy my-app

# Check status
loko workloads list

# Remove
loko workloads remove my-app --undeploy
```

---

## Advanced: Multi-Container Application

### Application Stack

- **Frontend**: React app (Nginx)
- **Backend**: Node.js API
- **Database**: PostgreSQL
- **Cache**: Redis

### Step 1: Deploy Dependencies

```bash
# Deploy database and cache
loko workloads add postgres --deploy
loko workloads add valkey --deploy
```

### Step 2: Backend Deployment

**values-backend.yaml**:
```yaml
replicaCount: 2
image:
  repository: cr.dev.me:5000/my-backend
  tag: latest
service:
  port: 3000
env:
  - name: DB_HOST
    value: postgres.dev.me
  - name: DB_PORT
    value: "5432"
  - name: DB_NAME
    value: myapp
  - name: REDIS_HOST
    value: valkey.dev.me
  - name: REDIS_PORT
    value: "6379"
envFrom:
  - secretRef:
      name: backend-secrets  # Create manually or auto-generate
ingress:
  enabled: true
  hosts:
    - host: api.apps.dev.me
      paths:
        - path: /api
          pathType: Prefix
```

### Step 3: Frontend Deployment

**values-frontend.yaml**:
```yaml
replicaCount: 2
image:
  repository: cr.dev.me:5000/my-frontend
  tag: latest
service:
  port: 80
env:
  - name: API_URL
    value: http://api.apps.dev.me
ingress:
  enabled: true
  hosts:
    - host: app.apps.dev.me
      paths:
        - path: /
          pathType: Prefix
```

### Step 4: Deploy Stack

```bash
# Deploy backend
helm install backend ./my-backend -f values-backend.yaml

# Deploy frontend
helm install frontend ./my-frontend -f values-frontend.yaml

# Check status
kubectl get pods
kubectl get ingress
```

### Step 5: Access

- Frontend: http://app.apps.dev.me
- Backend API: http://api.apps.dev.me/api
- Database: postgres.dev.me:5432
- Cache: valkey.dev.me:6379

---

## Configuration Examples

### Environment Variables

```yaml
env:
  - name: LOG_LEVEL
    value: debug
  - name: PORT
    value: "3000"
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password
```

### Secrets

```bash
# Create secret
kubectl create secret generic app-secrets \
  --from-literal=api-key=abc123 \
  --from-literal=db-password=secret \
  -n default

# Reference in deployment
envFrom:
  - secretRef:
      name: app-secrets
```

### Config Maps

```bash
# Create config map
kubectl create configmap app-config \
  --from-file=config.json \
  -n default

# Mount in deployment
volumeMounts:
  - name: config
    mountPath: /etc/config
volumes:
  - name: config
    configMap:
      name: app-config
```

### Persistent Storage

```yaml
persistence:
  enabled: true
  storageClass: standard
  size: 10Gi
  mountPath: /data
```

---

## Troubleshooting

### Image pull fails

```bash
# Check registry
kubectl get pods -n loko-components | grep registry

# Check image exists
curl http://cr.dev.me:5000/v2/_catalog

# Check image in registry
docker pull cr.dev.me:5000/my-api:latest
```

### Ingress not working

```bash
# Check ingress
kubectl get ingress

# Check Traefik
kubectl get pods -n loko-components | grep traefik

# Test internal service
kubectl run -it test --rm --image=alpine -- sh
wget -O- http://my-api.default.svc.cluster.local:3000/api/health
```

### Pods not starting

```bash
# Check pods
kubectl get pods

# Check events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check resources
kubectl top nodes
kubectl top pods
```

---

## Best Practices

### 1. Use Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 2. Resource Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
```

### 3. Multiple Replicas

```yaml
replicaCount: 2  # High availability
```

### 4. Use Namespaces

```bash
# Create namespace
kubectl create namespace my-app

# Deploy to namespace
helm install my-app ./chart -n my-app
```

### 5. Version Images

```yaml
image:
  tag: "1.0.0"  # Not "latest"
```

---

## Next Steps

- [Multi-Node Setup](multi-node-setup) - Scale your cluster
- [Workload Management](../user-guide/workload-management) - Manage workloads
- [Registry Guide](../user-guide/registry) - Use local registry
- [Configuration](../user-guide/configuration) - Advanced config

---

## See Also

- [Helm Documentation](https://helm.sh/docs/) - Helm charts
- [Kubernetes Documentation](https://kubernetes.io/docs/) - Kubernetes concepts
- [Docker Documentation](https://docs.docker.com/) - Docker images
