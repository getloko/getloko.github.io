---
title: DevOps & CI/CD Workloads
---

Git hosting and CI/CD runners for development workflows.

## Available Workloads

### Forgejo

Self-hosted Git service (Gitea fork) with Actions support.

**Features:**

- Git repository hosting
- Pull requests and code review
- Issue tracking
- GitHub Actions compatible CI/CD (Forgejo Actions)
- Lightweight and fast
- Built-in package registry

**Use Cases:**

- Private Git hosting
- Code collaboration
- CI/CD pipelines
- Package management

**Deployment:**

```bash
loko workloads add forgejo --deploy
loko workloads connect forgejo
```

**Endpoints:**

- **Web UI**: `https://forgejo.${LOKO_DOMAIN}`
- **Git HTTPS**: Port 3000 (SSH disabled for simplicity)

**Default Credentials:**

- Username: `forgejo`
- Password: Auto-generated (use `loko workloads connect forgejo --show-password`)

**Git Operations:**

```bash
# Clone via HTTPS (SSH disabled)
git clone https://forgejo.${LOKO_DOMAIN}/username/repo.git

# Push changes
git push origin main
```

**Chart:** forgejo-helm/forgejo

---

### Forgejo Runner

CI/CD runner for Forgejo Actions (GitHub Actions compatible).

**Features:**

- GitHub Actions workflow syntax
- Docker-based execution
- Automatic registration with Forgejo
- Parallel job execution

**Deployment:**

```bash
# Automatically deploys with Forgejo
# Or deploy separately:
loko workloads add forgejo-runner --deploy
```

**Workflow Example:**

```yaml
# .forgejo/workflows/test.yml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          echo "Running tests..."
          npm test
```

**Chart:** forgejo-runner/forgejo-runner

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
