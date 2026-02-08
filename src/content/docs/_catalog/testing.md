---
title: Testing Guidelines
---

Comprehensive testing guide for catalog workloads.

## Overview

All workloads should be tested before submission to ensure they deploy correctly and function as expected.

## Testing Workflow

### 1. Local Catalog Testing

Test with a local catalog copy:

```bash
# Clone documentation repository
git clone https://github.com/getloko/getloko.github.io.git
cd getloko.github.io

# Create your workload branch
git checkout -b add-workload-myapp

# Add your workload definition
# Edit public/catalog/workloads/<category>.yaml
```

### 2. Deploy with Local Catalog

```bash
# Point LoKO to your local catalog
loko workloads add myapp --catalog=/path/to/getloko.github.io/public/catalog

# Enable and deploy
loko workloads enable myapp --now
```

### 3. Verify Deployment

```bash
# Check workload info
loko workloads info myapp

# Check pods
kubectl get pods -n loko-workloads -l app=myapp

# Check service
kubectl get svc -n loko-workloads -l app=myapp
```

---

## Test Categories

### Deployment Tests

Verify the workload deploys successfully.

**Check pods are running:**

```bash
kubectl get pods -n loko-workloads -l app.kubernetes.io/name=myapp
```

Expected output:

```
NAME                    READY   STATUS    RESTARTS   AGE
myapp-7d4f8c9b5-xyz12  1/1     Running   0          2m
```

**Check service is created:**

```bash
kubectl get svc -n loko-workloads myapp
```

**Check ingress (if applicable):**

```bash
kubectl get ingress -n loko-workloads myapp
```

### Connectivity Tests

Verify endpoints are accessible.

**TCP Services:**

```bash
# Test port connectivity
nc -zv myapp.${LOKO_DOMAIN} 5432

# Or with telnet
telnet myapp.${LOKO_DOMAIN} 5432
```

**HTTP/HTTPS Services:**

```bash
# Test HTTP endpoint
curl -I https://myapp.${LOKO_DOMAIN}

# Check response code
curl -w "%{http_code}" https://myapp.${LOKO_DOMAIN}
```

### Health Check Tests

Verify health checks function correctly.

**TCP Health Check:**

```bash
# Manual TCP check
nc -zv myapp.${LOKO_DOMAIN} 8080
```

**HTTP Health Check:**

```bash
# Test health endpoint
curl https://myapp.${LOKO_DOMAIN}/health
```

**Command Health Check:**

```bash
# Run health check command manually
kubectl exec -n loko-workloads deployment/myapp -- \
  /health-check-command
```

### Connection String Tests

Verify connection strings work correctly.

**Database Connection:**

```bash
# PostgreSQL example
psql "postgresql://postgres:${PASSWORD}@postgres.${LOKO_DOMAIN}:5432/testdb"

# MySQL example
mysql -h mysql.${LOKO_DOMAIN} -P 3306 -u root -p${PASSWORD}

# MongoDB example
mongosh "mongodb://root:${PASSWORD}@mongodb.${LOKO_DOMAIN}:27017/testdb?authSource=admin"
```

**Application Connection:**

```python
# Test with Python
import psycopg2

conn = psycopg2.connect(
    host='postgres.${LOKO_DOMAIN}',
    port=5432,
    user='postgres',
    password='${PASSWORD}',
    database='testdb'
)

cursor = conn.cursor()
cursor.execute('SELECT version()')
print(cursor.fetchone())
conn.close()
```

### Secret Generation Tests

Verify secrets are generated correctly.

**Check secret exists:**

```bash
kubectl get secret -n loko-workloads myapp-password
```

**Verify secret content:**

```bash
# Get password value
kubectl get secret -n loko-workloads myapp-password \
  -o jsonpath='{.data.password}' | base64 -d
```

**Test secret in connection:**

```bash
# Use secret in connection string
loko workloads connect myapp --show-password
```

### UI Tests

For workloads with web UIs.

**Access web UI:**

```bash
# Open in browser
open https://myapp-ui.${LOKO_DOMAIN}
```

**Check login functionality:**

- Verify credentials work
- Test basic navigation
- Verify data is accessible

**Check linked workload:**

```bash
# Verify UI workload is deployed
loko workloads status myapp-ui

# Check it's linked to main workload
loko workloads info myapp
```

---

## Test Scenarios

### Minimal System Workload

Test a simple system workload:

```yaml
workloads:
  test-app:
    type: system
    category: test
    description: "Test application"

    chart:
      repo: groundhog2k
      name: groundhog2k/nextcloud
      version: "0.20.6"

    defaults:
      namespace: loko-workloads

    presets:
      service:
        type: ClusterIP
        port: 80

      ingress:
        enabled: true
        className: traefik
        hosts:
          - host: test-app.${LOKO_DOMAIN}
```

**Test steps:**

1. Deploy: `loko workloads add test-app --now`
2. Verify: `curl https://test-app.${LOKO_DOMAIN}`
3. Cleanup: `loko workloads remove test-app`

### TCP Service Workload

Test TCP port exposure:

```yaml
workloads:
  test-db:
    type: system
    category: database
    description: "Test database"

    chart:
      repo: groundhog2k
      name: groundhog2k/postgres
      version: "1.6.1"

    defaults:
      namespace: loko-workloads
      ports: [5432]

    secrets:
      - name: password
        type: password
        length: 16

    presets:
      service:
        type: ClusterIP
        port: 5432
```

**Test steps:**

1. Deploy with port exposure
2. Test TCP connectivity: `nc -zv test-db.${LOKO_DOMAIN} 5432`
3. Test connection string with password
4. Cleanup

### Linked Workload

Test workload with UI link:

```yaml
workloads:
  main-app:
    links:
      - type: addon
        target: main-app-ui
        auto-deploy: true
        required: false
        lifecycle-binding: true
```

**Test steps:**

1. Deploy main workload
2. Verify UI auto-deploys
3. Test both workloads accessible
4. Remove main workload, verify UI is also removed

---

## Automated Testing

### Pre-Deployment Validation

```bash
# Validate YAML syntax
yamllint public/catalog/workloads/myapp.yaml

# Validate with LoKO (dry-run)
loko workloads add myapp --dry-run
```

### Post-Deployment Checks

```bash
#!/bin/bash
# test-workload.sh

WORKLOAD=$1
NAMESPACE=loko-workloads

echo "Testing workload: $WORKLOAD"

# Check deployment
echo "Checking deployment..."
kubectl wait --for=condition=available \
  deployment/$WORKLOAD -n $NAMESPACE --timeout=300s

# Check service
echo "Checking service..."
kubectl get svc $WORKLOAD -n $NAMESPACE

# Check pods
echo "Checking pods..."
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=$WORKLOAD

# Test endpoint (HTTP)
echo "Testing endpoint..."
curl -f https://$WORKLOAD.${LOKO_DOMAIN} || echo "HTTP test failed"

echo "Tests complete!"
```

Usage:

```bash
chmod +x test-workload.sh
./test-workload.sh myapp
```

---

## Common Issues

### Pod Not Starting

**Check pod status:**

```bash
kubectl describe pod -n loko-workloads <pod-name>
```

**Common causes:**

- Image pull failures
- Resource constraints
- Configuration errors
- Volume mount issues

**Debug:**

```bash
# Check events
kubectl get events -n loko-workloads --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n loko-workloads <pod-name>
```

### Service Not Accessible

**Check service:**

```bash
kubectl get svc -n loko-workloads myapp
```

**Check endpoints:**

```bash
kubectl get endpoints -n loko-workloads myapp
```

**Test from within cluster:**

```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://myapp.loko-workloads.svc.cluster.local:8080
```

### Ingress Not Working

**Check ingress:**

```bash
kubectl describe ingress -n loko-workloads myapp
```

**Verify Traefik routing:**

```bash
# Check IngressRoute (for TCP services)
kubectl get ingressroute -n loko-workloads

# Check Traefik logs
kubectl logs -n kube-system deployment/traefik
```

### Secret Issues

**Verify secret exists:**

```bash
kubectl get secrets -n loko-workloads | grep myapp
```

**Check secret is mounted:**

```bash
kubectl describe pod -n loko-workloads <pod-name> | grep -A 5 Mounts
```

**Verify secret values:**

```bash
kubectl get secret myapp-password -n loko-workloads -o yaml
```

---

## Performance Testing

### Resource Usage

Monitor resource consumption:

```bash
# Pod resource usage
kubectl top pods -n loko-workloads

# Node resource usage
kubectl top nodes

# Detailed resource info
kubectl describe pod -n loko-workloads <pod-name> | grep -A 10 Resources
```

### Load Testing

Simple load test for HTTP services:

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://myapp.${LOKO_DOMAIN}/

# Using curl in loop
for i in {1..100}; do
  curl -s https://myapp.${LOKO_DOMAIN}/ > /dev/null
  echo "Request $i completed"
done
```

---

## Cleanup

Always clean up test workloads:

```bash
# Remove workload
loko workloads remove myapp

# Verify removal
kubectl get all -n loko-workloads -l app.kubernetes.io/name=myapp

# Remove namespace (if testing in custom namespace)
kubectl delete namespace test-workloads
```

---

## Testing Checklist

Before submitting your workload:

### Deployment

- [ ] Workload deploys without errors
- [ ] Pods reach Running state within 5 minutes
- [ ] Service is created correctly
- [ ] Ingress/IngressRoute is configured (if applicable)

### Connectivity

- [ ] Service is accessible via connection string
- [ ] Web UI loads (if applicable)
- [ ] TCP ports are reachable (if applicable)
- [ ] TLS certificates are valid

### Functionality

- [ ] Basic operations work correctly
- [ ] Secrets are generated and accessible
- [ ] Health checks pass
- [ ] Linked workloads auto-deploy (if applicable)

### Documentation

- [ ] Connection strings are accurate
- [ ] Code examples work
- [ ] Endpoints are documented
- [ ] Known issues are noted

### Cleanup

- [ ] Workload removes cleanly
- [ ] No orphaned resources
- [ ] Linked workloads are removed (if lifecycle-binding)

---

## Next Steps

- [Contributing Guidelines](contributing) - How to contribute
- [Schema Reference](schema) - Workload schema documentation
- [Browse Workloads](workloads/index) - Existing workloads
