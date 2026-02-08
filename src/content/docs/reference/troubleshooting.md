---
title: "Troubleshooting"
---

This guide covers common issues and their solutions for LoKO v0.3.0. Start with the diagnostic workflow, then find your issue in the sections below.

## Diagnostic Workflow

When encountering issues, follow this diagnostic sequence:

### 1. Check Component Health

The `loko status` command is your primary diagnostic tool:

```bash
# Check overall environment health
loko status

# Compact table view
loko status --short

# Include workload details
loko status --workloads

# JSON format for scripting
loko status --format json
```

**Health States:**

- **healthy** (✓ green) - Component running normally
- **degraded** (⚠ yellow) - Running but has issues
- **stopped** (✗ red) - Component not running
- **not_configured** (○ dim) - Component not set up

**Component Order:**

1. **Cluster** - Kubernetes cluster state
2. **Registry** - Local OCI registry (if enabled)
3. **DNS** - DNS service and OS resolver
4. **Tunnel** - HAProxy for database connections
5. **Workloads** - Deployed services

### 2. Interpret Status Output

Based on health states, take action:

- **All healthy** → Environment ready
- **Cluster stopped** → Run `loko env start`
- **DNS degraded** → Check port conflicts (see Issue #1 below)
- **Workloads not_configured** → Deploy with `loko workloads deploy <name>`
- **Registry stopped** → Check if enabled in config, restart if needed

### 3. Use Targeted Diagnostics

```bash
# DNS-specific check
loko check dns

# View component logs
loko logs dns|loko logs tunnel|loko logs workload <workload-name>

# Kubernetes events
kubectl get events -A --sort-by='.lastTimestamp'

# Docker container status
docker ps -a
```

---

## Top 10 Common Issues

### Issue 1: DNS Not Resolving

**Symptom:** Domains like `postgres.dev.me` don't resolve after environment creation

**Root Cause:** CoreDNS or the dns-operator may not be running, or the host resolver isn't configured correctly

**Solution:**

```bash
# Check CoreDNS and dns-operator pods
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get pods -n loko-components -l app.kubernetes.io/name=dns-operator

# Inspect the dynamic hosts ConfigMap
kubectl get configmap loko-dynamic-hosts -n loko-components -o yaml

# Check dns-operator logs
kubectl logs -n loko-components -l app.kubernetes.io/name=dns-operator

# Recreate DNS configuration
loko dns recreate
```

**Verification:**
```bash
loko status
# DNS should show "healthy"
```

**Related:** [DNS Issues](#issue-7-dns-not-resolving-test-domains)

---

### Issue 2: Missing Prerequisites

**Symptom:** Command not found errors, installation failures

**Error Message:**
```
Docker not found - install Docker Desktop or Docker Engine
kind not found - install Kind (Kubernetes in Docker)
mkcert not found - install mkcert for TLS certificates
```

**Root Cause:** Required tools not installed on system (v0.3.0 checks prerequisites on first run)

**Solution:**

**macOS:**
```bash
# Install via Homebrew
brew install docker kind mkcert helmfile

# Install Docker Desktop separately
brew install --cask docker
```

**Linux:**
```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# mkcert
brew install mkcert  # or apt/yum

# helmfile
brew install helmfile
```

**Verification:**
```bash
docker --version
kind --version
mkcert --version
helmfile --version
```

**Related:** [Prerequisites](../getting-started/prerequisites)

---

### Issue 3: Docker Not Running

**Symptom:** Cannot connect to Docker daemon

**Error Message:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```

**Root Cause:** Docker Desktop not started or Docker daemon not running

**Solution:**

**macOS:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start
docker ps
```

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Verification:**
```bash
docker ps
# Should show running containers or empty list
```

---

### Issue 4: Config File Not Found

**Symptom:** LoKO commands fail with config error

**Error Message:**
```
Configuration file 'loko.yaml' not found
```

**Root Cause:** No explicit `--config` was provided, there is no active environment in inventory, and LoKO could not fall back to a local `loko.yaml`.

**Solution:**

```bash
# Create configuration with wizard
loko wizard

# Or create and activate an environment
loko env create

# See known environments and the active one
loko inventory list

# Activate an existing environment
loko activate my-env

# Or use an explicit config file
loko status --config /path/to/loko.yaml
```

**Verification:**
```bash
loko status
```

**Related:** [Configuration Guide](../user-guide/configuration)

---

### Issue 5: Cluster Creation Fails

**Symptom:** `loko env create` fails during cluster creation

**Error Message:**
```
Failed to create cluster: port conflicts detected
ERROR: failed to create cluster: node(s) already exist
```

**Root Cause:** Port conflicts, insufficient resources, or stale cluster state

**Solution:**

**Port Conflicts:**
```bash
# Check for port usage (API server usually 6443)
sudo lsof -i :6443

# Stop conflicting service or use different port
loko init --api-port 6444
```

**Stale Cluster:**
```bash
# Delete existing cluster
kind delete cluster --name <cluster-name>

# Clean up Docker networks
docker network prune

# Recreate environment
loko env create
```

**Insufficient Resources:**
```bash
# Check Docker resources
docker system df
docker stats --no-stream

# Increase Docker Desktop memory
# Docker Desktop → Settings → Resources → Memory (8GB minimum)

# Or reduce worker nodes in loko.yaml
cluster:
  nodes:
    workers: 1
```

**Verification:**
```bash
loko status
kind get clusters
```

**Related:** [Environment Lifecycle](../user-guide/environment-lifecycle)

---

### Issue 6: Workload Deployment Fails

**Symptom:** Helm release fails, pods not starting

**Error Message:**
```
Error: failed to install chart
ImagePullBackOff
CrashLoopBackOff
```

**Root Cause:** Image pull errors, resource constraints, configuration issues

**Solution:**

**Image Pull Errors:**
```bash
# Check pod status
kubectl get pods -A

# Describe failed pod
kubectl describe pod <pod-name> -n <namespace>

# Check registry status
loko status

# Verify image exists
docker pull <image-name>

# Retry deployment
loko workloads undeploy <name>
loko workloads deploy <name>
```

**Resource Constraints:**
```bash
# Check node resources
kubectl describe nodes

# Reduce resource requests in workload config
# Edit loko.yaml:
workloads:
  system:
    - name: postgres
      config:
        values:
          resources:
            requests:
              memory: 256Mi
              cpu: 100m
```

**Check Logs:**
```bash
# Workload logs
loko logs workload <workload-name>

# Kubernetes events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

**Verification:**
```bash
loko status --workloads
kubectl get pods -A
```

---

### Issue 7: DNS Not Resolving .test Domains

**Symptom:** Cannot access services via domain names (e.g., postgres.dev.me)

**Error Message:**
```
nslookup: can't resolve 'postgres.dev.me'
```

**Root Cause:** DNS service not running, resolver not configured, or systemd-resolved conflicts

**Solution:**

**macOS:**
```bash
# Check DNS status
loko check dns

# Verify resolver file
cat /etc/resolver/dev.me

# Recreate DNS service
loko dns recreate

# Test resolution
dig postgres.dev.me
nslookup postgres.dev.me
```

**Linux (systemd-resolved conflict):**
```bash
# Check port 53 usage
sudo lsof -i :53

# If systemd-resolved is blocking:
sudo systemctl stop systemd-resolved

# Or configure systemd-resolved to use different port
# Edit /etc/systemd/resolved.conf:
[Resolve]
DNSStubListener=no

# Restart
sudo systemctl restart systemd-resolved

# Restart LoKO DNS
loko dns recreate
```

**Check DNS Container:**
```bash
# Verify DNS container running
docker ps | grep dns

# Check container logs
docker logs loko-<env-name>-dns
```

**Verification:**
```bash
loko status
# DNS should show "healthy"

dig postgres.dev.me
# Should return configured IP
```

**Related:** [DNS Configuration](../user-guide/dns-configuration)

---

### Issue 8: Certificate Errors (Browser "Not Secure")

**Symptom:** Browser shows certificate warnings for HTTPS endpoints

**Error Message:**
```
NET::ERR_CERT_AUTHORITY_INVALID
Your connection is not private
```

**Root Cause:** mkcert CA not trusted in system trust store

**Solution:**

**Install/Reinstall CA:**
```bash
# Verify mkcert CA location
mkcert -CAROOT

# Install CA in trust store
mkcert -install

# View CA certificate
ls -la "$(mkcert -CAROOT)"
```

**macOS Keychain:**
```bash
# Open Keychain Access
open -a "Keychain Access"

# Search for "mkcert"
# Double-click certificate
# Expand "Trust" section
# Set "When using this certificate" to "Always Trust"
```

**Firefox (requires NSS tools):**
```bash
# macOS
brew install nss

# Linux
sudo apt install libnss3-tools

# Reinstall mkcert CA
mkcert -install
```

**Regenerate Certificates (if expired):**
```bash
# Check expiration
openssl x509 -in .loko/<env-name>/certs/<domain>.pem -noout -dates

# Recreate certificates
loko init

# Restart workloads
kubectl rollout restart deployment -A
```

**Verification:**
```bash
# Open service in browser
open https://postgres.dev.me
# Should show valid certificate
```

---

### Issue 9: Health Status Shows Degraded Components

**Symptom:** `loko status` shows components in degraded state

**Error Message:**
```
⚠ DNS degraded - port conflict detected
⚠ Workloads degraded - 2/5 pods not ready
```

**Root Cause:** Component-specific issues requiring targeted fixes

**Solution:**

**Degraded Cluster:**
```bash
# Check node status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Restart cluster
loko env stop
loko env start
```

**Degraded DNS:**
```bash
# Check port conflicts (see Issue #1)
sudo lsof -i :53

# Recreate DNS
loko dns recreate
```

**Degraded Workloads:**
```bash
# Check pod status
kubectl get pods -A

# View detailed status
loko status --workloads

# Check specific workload logs
loko logs workload <workload-name>

# Redeploy workload
loko workloads undeploy <name>
loko workloads deploy <name>
```

**Degraded Registry:**
```bash
# Check registry pod
kubectl get pods -n kube-system -l app=zot

# Check registry logs
loko logs zot

# Restart registry
kubectl rollout restart deployment -n kube-system zot
```

**Verification:**
```bash
loko status
# All components should show "healthy"
```

---

### Issue 10: Old CLI Commands Not Working

**Symptom:** Commands fail after upgrading to v0.3.0

**Error Message:**
```
Error: unknown command "create" for "loko"
```

**Root Cause:** v0.3.0 restructured CLI commands (migration from flat structure to grouped commands)

**Solution:**

**Command Migration:**

| Old Command | New Command (v0.3.0) |
|-------------|---------------------|
| `loko create` | `loko env create` |
| `loko start` | `loko env start` |
| `loko stop` | `loko env stop` |
| `loko destroy` | `loko env destroy` |
| `loko deploy <name>` | `loko workloads deploy <name>` |
| `loko logs workload <name>` | `loko logs workload <name>` (unchanged) |
| `loko list` | `loko workloads list` |

**Check CLI Structure:**
```bash
# View all commands
loko --help

# View subcommand help
loko env --help
loko workloads --help
loko dns --help
```

**Update Aliases:**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias loko-create='loko env create'
alias loko-start='loko env start'
alias loko-stop='loko env stop'
```

**Verification:**
```bash
loko --version
# Should show v0.3.0 or higher
```

**Related:** [CLI Reference](../user-guide/cli-reference)

---

## Platform-Specific Issues

### macOS

#### Firefox Certificate Issues

**Problem:** Firefox doesn't trust mkcert certificates

**Solution:**
```bash
# Install NSS tools (Firefox certificate database)
brew install nss

# Reinstall mkcert CA
mkcert -install

# Restart Firefox
```

#### Docker Desktop Not Starting

**Problem:** Docker Desktop stuck on "Starting"

**Solution:**
```bash
# Reset Docker Desktop
# Docker Desktop → Troubleshoot → Reset to factory defaults

# Or clean restart
pkill -f Docker
rm -rf ~/Library/Containers/com.docker.docker
open -a Docker
```

### Linux

#### systemd-resolved Port Conflicts

**Problem:** systemd-resolved always uses port 53

**Solution:**
```bash
# Disable DNS stub listener
sudo mkdir -p /etc/systemd/resolved.conf.d
cat <<EOF | sudo tee /etc/systemd/resolved.conf.d/loko.conf
[Resolve]
DNSStubListener=no
EOF

# Restart systemd-resolved
sudo systemctl restart systemd-resolved

# Verify port 53 is free
sudo lsof -i :53

# Start LoKO DNS
loko dns recreate
```

#### SELinux Denials

**Problem:** SELinux blocking Docker operations

**Solution:**
```bash
# Check SELinux status
getenforce

# View denials
sudo ausearch -m avc -ts recent

# Temporarily permissive (testing only)
sudo setenforce 0

# Permanent fix: add SELinux policy
# Or disable SELinux (not recommended)
```

### Windows

**LoKO v0.3.0 does not support Windows.**

Windows Subsystem for Linux (WSL2) support is planned for future releases. For now, use Linux or macOS.

---

## Advanced Troubleshooting

### Enable Debug Logging

Get detailed diagnostic output:

```bash
# Set debug level
export LOKO_LOG_LEVEL=DEBUG

# Run command
loko env create

# Or inline
LOKO_LOG_LEVEL=DEBUG loko env create
```

### Inspect Kind Cluster Directly

Access cluster internals with kubectl:

```bash
# Get cluster context
kubectl config current-context

# View all resources
kubectl get all -A

# Describe nodes
kubectl describe nodes

# View cluster info
kubectl cluster-info

# Access control plane container
docker exec -it <cluster-name>-control-plane bash
```

### Registry Troubleshooting

Diagnose local registry issues:

```bash
# Check registry accessibility
curl -k https://cr.dev.me/v2/

# List repositories
loko registry list-repos

# Check registry pod
kubectl get pods -n kube-system -l app=zot

# View registry logs
kubectl logs -n kube-system -l app=zot

# Test image push
docker tag hello-world:latest cr.dev.me/test:latest
docker push cr.dev.me/test:latest
```

### Network Diagnostics

Check DNS and connectivity:

```bash
# Check DNS resolution
loko check dns

# Test specific domain
dig postgres.dev.me
nslookup postgres.dev.me

# Check DNS container
docker ps | grep dns
docker logs loko-<env-name>-dns

# Verify resolver configuration
# macOS:
cat /etc/resolver/dev.me

# Linux:
cat /etc/systemd/resolved.conf.d/dev.me.conf

# Test connectivity to cluster
kubectl cluster-info
kubectl get nodes
```

### Collect Full Diagnostics

Gather comprehensive diagnostic data:

```bash
# Environment status
loko status --format json > status.json

# Cluster info
kubectl cluster-info > cluster-info.txt
kubectl describe nodes > nodes.txt

# All resources
kubectl get all -A > resources.txt

# Events
kubectl get events -A --sort-by='.lastTimestamp' > events.txt

# Docker status
docker ps > docker-ps.txt
docker system df > docker-df.txt
docker info > docker-info.txt

# LoKO version
loko --version > version.txt

# Package manifest
tar czf loko-diagnostics.tar.gz *.txt *.json
```

---

## Getting Help

### Check Documentation

- [FAQ](faq) - Frequently asked questions
- [CLI Reference](../user-guide/cli-reference) - Command reference
- [Configuration Guide](../user-guide/configuration) - Config options

### Report Issues

If you can't resolve the issue:

1. **Gather diagnostics** (see above)
2. **Check existing issues**: [GitHub Issues](https://github.com/getloko/loko/issues)
3. **Open new issue**: [New Issue](https://github.com/getloko/loko/issues/new)

**Include in report:**
- LoKO version (`loko --version`)
- OS and version (`uname -a`)
- Docker version (`docker --version`)
- Error messages (exact text)
- Steps to reproduce
- Diagnostic output

### Community

- GitHub Discussions: Ask questions, share tips
- GitHub Issues: Report bugs, request features

---

## Next Steps

- [Environment Lifecycle](../user-guide/environment-lifecycle) - Managing environments
- [CLI Reference](../user-guide/cli-reference) - Full command reference
- [Configuration Guide](../user-guide/configuration) - Customize your setup
