---
title: "Frequently Asked Questions"
---


Common questions and answers about LoKO.

## General Questions

### What is LoKO?

LoKO (Local Kubernetes Oasis) is a Python CLI tool that simplifies local Kubernetes development with Kind. It provides:

- One-command cluster creation
- Automatic DNS and TLS configuration
- Pre-configured workload catalog (databases, caches, etc.)
- Local container registry
- Comprehensive workload management

See [Overview](../index) for details.

---

### How is LoKO different from Minikube/k3d?

| Feature | LoKO | Minikube | k3d |
|---------|------|----------|-----|
| **Base** | Kind | VM/Docker | k3s in Docker |
| **DNS** | Automatic (CoreDNS) | Manual | Manual |
| **TLS** | Automatic (mkcert) | Manual | Manual |
| **Registry** | Built-in (Zot) | Addon | Manual |
| **Workloads** | Catalog system | Manual | Manual |
| **Config** | Single YAML | CLI flags | CLI flags |

LoKO focuses on **developer experience** with minimal configuration.

---

### Do I need Docker Desktop?

Yes, LoKO requires Docker. On macOS:

- **Docker Desktop** (recommended)
- **OrbStack** (alternative)
- **Colima** (alternative)

On Linux, Docker Engine is sufficient.

---

### Can I use LoKO for production?

**No.** LoKO is designed for **local development only**. For production:

- Use managed Kubernetes (GKE, EKS, AKS)
- Use production-grade distributions (k8s, k3s, RKE)
- Follow security best practices

---

## Installation

### How do I install LoKO?

```bash
# Using pip
pip install loko-k8s

# Using uv (recommended)
uv tool install loko-k8s

# Using pipx
pipx install loko-k8s
```

See [Installation Guide](../getting-started/installation) for details.

---

### What are the prerequisites?

Required tools:

- **Docker** - Container runtime
- **Kind** - Kubernetes in Docker
- **Helm** - Package manager
- **kubectl** - Kubernetes CLI
- **mkcert** - Certificate authority

Optional:
- **helmfile** - Declarative Helm deployments

LoKO can help install missing tools:

```bash
loko check prerequisites
```

See [Prerequisites](../getting-started/prerequisites) for details.

---

### Which Python version do I need?

**Python 3.10 or later**

Check your version:
```bash
python --version  # Should be 3.10+
```

---

## Configuration

### Where is the configuration file?

Configuration is stored in `loko.yaml` in your project directory.

Generate it with:
```bash
loko config generate
```

See [Configuration Guide](../user-guide/configuration) for details.

---

### Can I have multiple environments?

Yes! Each environment is independent:

```bash
# Create dev environment
loko env create --name dev

# Create staging environment
loko env create --name staging

# Switch between them
loko --env dev status
loko --env staging status
```

---

### How do I customize workload settings?

Edit `loko.yaml`:

```yaml
workloads:
  postgres:
    enabled: true
    values:
      settings:
        max_connections: "500"
    storage:
      size: "100Gi"
```

See [Workload Management](../user-guide/workload-management) for details.

---

## DNS & Networking

### How does DNS work?

LoKO uses in-cluster CoreDNS with a dns-operator that automatically tracks your workloads:

1. The dns-operator watches Ingress and IngressRoute resources
2. It updates a ConfigMap (`loko-dynamic-hosts`) with hostname → IP entries
3. CoreDNS reads that ConfigMap via its `hosts` plugin
4. macOS `/etc/resolver/dev.me` points to CoreDNS via its NodePort on the Kind node

**Example**:
```bash
# Resolves to cluster
ping postgres.dev.me
curl https://app.apps.dev.me
```

See [Network & DNS](../user-guide/network-dns) for details.

---

### Can I use a different domain?

Yes! Edit `loko.yaml`:

```yaml
network:
  domain: "local.dev"  # Instead of dev.me
```

Then recreate:
```bash
loko env recreate
```

---

### Why can't I access services from other devices?

By default, LoKO is localhost-only. For network access:

1. **Enable tunnel** (Cloudflare Tunnel):
```yaml
tunnel:
  enabled: true
  token: "your-token"
```

2. **Or use hostPort** for specific services

---

### DNS not working on macOS?

Try:

```bash
# Check dns-operator and CoreDNS pods
kubectl get pods -n loko-components -l app.kubernetes.io/name=dns-operator
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Check resolver
cat /etc/resolver/dev.me

# Inspect dynamic hosts ConfigMap
kubectl get configmap loko-dynamic-hosts -n loko-components -o yaml

# Test DNS resolution
loko check dns

# Recreate DNS
loko dns recreate
```

---

## Workloads

### How do I deploy a database?

```bash
# Add PostgreSQL
loko workloads add postgres --deploy

# Connection details in .loko-secrets.txt
cat .loko-secrets.txt
```

See [Deploy Database Tutorial](../tutorials/deploy-database) for details.

---

### Where are workload credentials?

Automatically generated credentials are saved to:

```
.loko-secrets.txt
```

**Example**:
```
=== postgres ===
POSTGRES_PASSWORD: randomly-generated-password
```

---

### Can I use custom Helm charts?

Yes! Add custom workloads to the catalog:

```yaml
# ~/.config/loko/catalog.yaml
workloads:
  my-app:
    category: "application"
    chart:
      repo: "my-repo"
      name: "my-chart"
      version: "1.0.0"
```

---

### How do I update workload versions?

```bash
# Update catalog versions
loko catalog update

# Review changes
loko catalog update --dry-run

# Redeploy workload with new version
loko workloads deploy postgres --force
```

---

## Troubleshooting

### Cluster won't create

**Symptoms**: `loko env create` fails

**Solutions**:

1. **Check Docker**:
```bash
docker ps  # Should work
```

2. **Check ports**:
```bash
loko check ports
```

3. **Check existing clusters**:
```bash
kind get clusters
kind delete cluster --name loko-dev-me
```

4. **Check logs**:
```bash
loko --debug env create
```

---

### Workload deployment fails

**Symptoms**: `loko workloads deploy` fails

**Solutions**:

1. **Check cluster status**:
```bash
loko status
```

2. **Check Helm**:
```bash
helm list -A
```

3. **Check pod logs**:
```bash
kubectl logs -n loko-workloads <pod-name>
```

4. **Re-deploy**:
```bash
loko workloads deploy postgres --force
```

---

### "Port already in use" error

**Symptoms**: Ports 80/443/5453 conflict

**Solutions**:

1. **Find what's using the port**:
```bash
lsof -i :80
lsof -i :443
```

2. **Stop conflicting service**:
```bash
# Example: Stop Apache
sudo apachectl stop
```

DNS runs in-cluster via an auto-selected NodePort — no host port conflict possible for DNS.

---

### Registry push fails

**Symptoms**: Cannot push to `cr.dev.me`

**Solutions**:

1. **Check registry is running**:
```bash
loko status
kubectl get pods -n loko-components | grep registry
```

2. **Check Docker daemon.json**:
```json
{
  "insecure-registries": ["cr.dev.me:5000"]
}
```

3. **Restart Docker** after changing daemon.json

4. **Test registry**:
```bash
docker pull alpine
docker tag alpine cr.dev.me:5000/alpine
docker push cr.dev.me:5000/alpine
```

See [Registry Guide](../user-guide/registry) for details.

---

### How do I completely reset?

```bash
# Destroy environment
loko env destroy --force

# Remove all Kind clusters
kind delete clusters --all

# Remove Docker containers
docker rm -f $(docker ps -a | grep loko | awk '{print $1}')

# Remove configuration
rm -rf .loko loko.yaml .loko-secrets.txt

# Start fresh
loko config generate
loko env create
```

---

## Performance

### Cluster is slow

**Causes**: Resource constraints, too many workloads

**Solutions**:

1. **Check resource usage**:
```bash
loko status --verbose
```

2. **Reduce worker nodes**:
```yaml
cluster:
  workers: 1  # Instead of 2-3
```

3. **Disable unused workloads**:
```bash
loko workloads disable mysql postgres mongodb
```

4. **Increase Docker resources** (Docker Desktop → Settings → Resources)

---

### Deployment takes too long

**Causes**: Image pulls, resource limits

**Solutions**:

1. **Enable registry mirror**:
```yaml
registry-mirror:
  enabled: true
  registries:
    - docker.io
```

2. **Pre-pull images**:
```bash
# Pulls images before deployment
loko workloads deploy --all
```

---

## Advanced Usage

### Can I use LoKO in CI/CD?

**Limited support**. LoKO is designed for local development, but you can:

```bash
# In CI pipeline
loko env create
loko workloads deploy --all
# Run tests
loko env destroy
```

**Note**: Requires Docker-in-Docker or similar setup.

---

### Can I extend LoKO with plugins?

Yes! LoKO has a plugin system:

```python
# Create plugin package
from loko.plugins import CatalogProvider

class MyPlugin:
    def get_catalog_extension(self):
        return LokoCatalog(...)
```

---

### How do I backup my environment?

```bash
# Backup configuration
cp loko.yaml loko.yaml.backup
cp -r ~/.config/loko ~/.config/loko.backup

# Backup secrets
cp .loko-secrets.txt .loko-secrets.txt.backup

# Backup persistent data (optional)
# Use Velero or similar tools
```

---

### Can I run LoKO on Windows?

**Limited support**. Requirements:

- WSL2 (Windows Subsystem for Linux)
- Docker Desktop for Windows
- Install LoKO inside WSL2

**Not supported**: Native Windows (PowerShell/CMD)

---

## Getting Help

### Where can I get help?

- **Documentation**: [https://getloko.github.io/](https://getloko.github.io/)
- **GitHub Issues**: [https://github.com/getloko/loko/issues](https://github.com/getloko/loko/issues)
- **GitHub Discussions**: [https://github.com/getloko/loko/discussions](https://github.com/getloko/loko/discussions)

---

### How do I report a bug?

1. Check [existing issues](https://github.com/getloko/loko/issues)
2. Run with `--debug`:
```bash
loko --debug env create
```
3. Create issue with:
   - LoKO version (`loko version`)
   - OS and Docker version
   - Full error message
   - Steps to reproduce

---

### How can I contribute?

Contributions are welcome! You can help by:

- Reporting bugs on [GitHub Issues](https://github.com/getloko/loko/issues)
- Suggesting features on [GitHub Discussions](https://github.com/getloko/loko/discussions)
- Improving documentation
- Submitting pull requests

See the [Contributing Guide](../catalog/contributing) for details.

---

## Getting Support

### LoKO-Specific Issues

For issues specific to LoKO:

- **Bug reports**: [GitHub Issues](https://github.com/getloko/loko/issues)
- **Feature requests**: [GitHub Issues](https://github.com/getloko/loko/issues)
- **Questions**: [GitHub Discussions](https://github.com/getloko/loko/discussions)
- **Documentation**: [https://getloko.github.io/](https://getloko.github.io/)

When reporting bugs, include:
- LoKO version (`loko --version`)
- Operating system and Docker version
- Full error message or debug output (`loko --debug <command>`)
- Steps to reproduce

### General Kubernetes Questions

We focus on LoKO-specific issues. For general Kubernetes questions, these resources may help:

- **Kubernetes Documentation**: [https://kubernetes.io/docs/](https://kubernetes.io/docs/)
- **Kind Documentation**: [https://kind.sigs.k8s.io/](https://kind.sigs.k8s.io/)
- **Kubernetes Slack**: [https://kubernetes.slack.com/](https://kubernetes.slack.com/)
- **Stack Overflow**: Tag your questions with `kubernetes`

### Helm and Helmfile Questions

For Helm chart and Helmfile configuration questions:

- **Helm Documentation**: [https://helm.sh/docs/](https://helm.sh/docs/)
- **Helm Community**: [https://helm.sh/community/](https://helm.sh/community/)
- **Helmfile Documentation**: [https://helmfile.readthedocs.io/](https://helmfile.readthedocs.io/)

### Tool Installation Issues

If you're having trouble installing prerequisites (Docker, kubectl, etc.), refer to the official documentation:

- **Docker Desktop**: [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
- **Docker Engine**: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- **kubectl**: [https://kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)
- **Helm**: [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)
- **Kind**: [https://kind.sigs.k8s.io/docs/user/quick-start/](https://kind.sigs.k8s.io/docs/user/quick-start/)
- **mkcert**: [https://github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert)

---

## See Also

- [Troubleshooting Guide](troubleshooting) - Detailed troubleshooting
- [Commands Reference](commands) - All CLI commands
- [User Guide](../user-guide/index) - Complete user documentation
- [Tutorials](../tutorials/first-cluster) - Step-by-step guides
