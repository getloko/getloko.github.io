---
title: "Frequently Asked Questions"
---


Common questions and answers about LoKO.

## General Questions

### What is LoKO?

LoKO (Local Kubernetes Oasis) is a single-binary CLI tool that simplifies local Kubernetes development with Kind. It provides:

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
| **DNS** | Automatic (dnsmasq) | Manual | Manual |
| **TLS** | Automatic (cfssl + local trust install) | Manual | Manual |
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
# Homebrew (macOS / Linux)
brew install getloko/tap/loko
```

Or download the binary for your platform from the
[latest release](https://github.com/getloko/loko-releases/releases/latest).
See the [Installation Guide](../getting-started/installation) for details.

---

### What are the prerequisites?

LoKO itself is a single binary with no runtime dependency. It drives these tools,
which must be on your `PATH`:

- **Docker** - container runtime
- **git** - GitOps repo seeding
- **kind** - Kubernetes in Docker
- **Helm** - package manager
- **helmfile** - declarative Helm deployments
- **kubectl** - Kubernetes CLI
- **cfssl** - certificate toolkit
- **ngrok** - optional, only for `loko share`

Check them with:

```bash
loko check prerequisites
```

See [Prerequisites](../getting-started/prerequisites) for details.

---

## Configuration

### Where is the configuration file?

LoKO configuration lives in a YAML file, usually `loko.yaml`.

For existing environments, many runtime commands no longer require you to be in that directory. They resolve the target environment in this order:

1. explicit `--config` / `-c`
2. active environment from inventory
3. local `./loko.yaml`

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
loko env create -c loko-dev.yaml

# Create staging environment
loko env create -c loko-staging.yaml

# Activate one as current
loko activate dev
loko status

# Or target a specific config directly
loko status -c loko-staging.yaml
```

Use `loko inventory list` to see known environments and which one is active.

---

### How do I customize workload settings?

Edit `loko.yaml`:

```yaml
workloads:
  system:
    - name: postgres
      enabled: true
      config:
        values:
          primary:
            extendedConfiguration: |
              max_connections = 500
```

See [Workload Management](../user-guide/workload-management) for details.

---

## DNS & Networking

### How does DNS work?

LoKO runs a dedicated dnsmasq container that serves your local domain:

1. LoKO generates dnsmasq host records from deployed workloads and system endpoints
2. The dnsmasq container listens on `network.dns-port` on your host IP
3. The OS resolver (for example `/etc/resolver/dev.me` on macOS) forwards `*.dev.me` queries to that dnsmasq endpoint
4. dnsmasq resolves hostnames directly to your configured local IP

**Example**:
```bash
# Resolves to cluster
ping postgres.dev.me
curl https://app.dev.me
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

By default, LoKO binds to your machine. For LAN access:

1. **HAProxy TCP tunnel** — forward TCP workload ports onto your local network IP:
```yaml
tunnel:
  enabled: true
  bind-address: null   # defaults to network.ip
```
See [Tunnel](../user-guide/tunnel).

2. **Public internet** — expose an HTTP(S) workload with `loko share` (needs
   ngrok). See [Sharing](../user-guide/share).

---

### DNS not working on macOS?

Try:

```bash
# Check DNS container and resolver state
loko dns status

# Check resolver
cat /etc/resolver/dev.me

# Run DNS diagnostic checks
loko config dns-check

# Recreate DNS
loko dns recreate
```

---

## Workloads

### How do I deploy a database?

```bash
# Enable PostgreSQL in loko.yaml, then deploy it
loko workloads add postgres --now
loko workloads deploy postgres

# Connection details
loko workloads connect postgres --show-password
```

See [Deploy Database Tutorial](../tutorials/deploy-database) for details.

---

### Where are workload credentials?

Generated credentials are stored per-environment in `secrets.json` under the
environment directory. View them with:

```bash
loko secrets show postgres        # one workload
loko secrets show --all           # everything, as JSON
loko workloads connect postgres --show-password   # ready-to-use connection strings
```

---

### Can I use custom Helm charts?

Yes. Define them as user workloads in `loko.yaml` and reference any extra Helm repositories under `workloads.helm-repositories`:

```yaml
workloads:
  helm-repositories:
    - name: my-repo
      url: https://charts.example.com/
  user:
    - name: my-app
      enabled: true
      config:
        repo:
          ref: my-repo
        chart: my-chart
        version: 1.0.0
        values: {}
```

---

### How do I update workload versions?

Pull the latest catalog into your local clone, then redeploy:

```bash
git -C ~/.loko/catalog pull
loko workloads deploy postgres
```

To pin a specific chart version, set it in `loko.yaml` under the workload's
`config.version`.

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

4. **Re-run and read the full error output**:
```bash
loko env create
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
loko workloads deploy postgres
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

DNS runs in-cluster via an auto-selected DNS port — no host port conflict possible for DNS.

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
# Destroy cluster and remove loko.yaml
loko env clean

# Start fresh
loko config generate
```

If you only want to remove the cluster but keep `loko.yaml`, use:

```bash
loko env destroy
```

---

## Performance

### Cluster is slow

**Causes**: Resource constraints, too many workloads

**Solutions**:

1. **Check resource usage**:
```bash
loko status
kubectl top nodes
```

2. **Reduce worker nodes**:
```yaml
cluster:
  nodes:
    workers: 1  # Instead of 2-3
```

3. **Disable unused workloads**:
```bash
loko workloads disable mysql
loko workloads disable postgres
loko workloads disable mongodb
```

4. **Increase Docker resources** (Docker Desktop → Settings → Resources)

---

### Deployment takes too long

**Causes**: Image pulls, resource limits

**Solutions**:

1. **Enable registry mirror**:
```yaml
registry:
  mirroring:
    enabled: true
    sources:
      - name: docker_hub
```

2. **Pre-pull images**:
```bash
# deploy every enabled workload
loko workloads deploy
```

---

## Advanced Usage

### Can I use LoKO in CI/CD?

**Limited support**. LoKO is designed for local development, but you can:

```bash
# In CI pipeline
loko env create
loko workloads deploy
# Run tests
loko env destroy
```

**Note**: Requires Docker-in-Docker or similar setup.

---

### Can I extend LoKO with plugins?

Not currently. LoKO ships as a single static binary with no plugin loader.
To add workloads, extend the catalog: add or override definitions in your local
`~/.loko/catalog/` clone (or contribute them upstream to
[getloko/catalog](https://github.com/getloko/catalog)).

---

### How do I backup my environment?

```bash
# Backup configuration
cp loko.yaml loko.yaml.backup
cp -r ~/.loko ~/.loko.backup   # includes per-environment secrets.json

# Backup persistent data (optional)
# Use Velero or similar tools
```

---

**Native support**. LoKO ships native binaries for Windows (amd64/arm64) as well as macOS and Linux.

Requirements:

- Docker Desktop for Windows
- Windows Subsystem for Linux (WSL2) is not required — LoKO runs natively

---

## Getting Help

### Where can I get help?

- **Documentation**: [https://getloko.github.io/](https://getloko.github.io/)
- **GitHub Issues**: [https://github.com/getloko/loko/issues](https://github.com/getloko/loko/issues)
- **GitHub Discussions**: [https://github.com/getloko/loko/discussions](https://github.com/getloko/loko/discussions)

---

### How do I report a bug?

1. Check [existing issues](https://github.com/getloko/loko/issues)
2. Reproduce and capture the full output
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

See the [Contributing Guide](../_catalog/contributing) for details.

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
- Full error message
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
- **cfssl**: [https://github.com/cloudflare/cfssl](https://github.com/cloudflare/cfssl)

---

## See Also

- [Troubleshooting Guide](troubleshooting) - Detailed troubleshooting
- [Commands Reference](commands) - All CLI commands
- [User Guide](../user-guide/index) - Complete user documentation
- [Tutorials](../tutorials/first-cluster) - Step-by-step guides
