---
title: Contributing Guidelines
---

Help improve LoKO by contributing catalog workloads, bug reports, documentation improvements, or core code changes.

## How to Contribute

You can contribute to LoKO in several ways:

- **Catalog workloads** - Add new system or user workloads to the catalog (most common)
- **Bug reports and feature requests** - Submit issues for bugs or suggest improvements
- **Documentation improvements** - Fix typos, clarify instructions, add examples
- **Core code contributions** - Fix bugs or add features to the LoKO CLI

### Catalog Workload Contributions

The most common contribution type. Follow the process below.

#### 1. Fork the Repository

```bash
# Fork on GitHub
# https://github.com/getloko/getloko.github.io

# Clone your fork
git clone https://github.com/YOUR-USERNAME/getloko.github.io.git
cd getloko.github.io

# Install pre-commit hooks (optional but recommended)
pip install pre-commit
pre-commit install
```

#### 2. Create a Branch

```bash
git checkout -b add-workload-myapp
```

#### 3. Add Your Workload

Add your workload definition to the appropriate category file in `public/catalog/workloads/`:

- `databases.yaml` - Database workloads
- `cache.yaml` - Cache and key-value stores
- `messaging.yaml` - Message queues and streaming
- `storage.yaml` - Object storage
- `devops.yaml` - Git hosting, CI/CD
- `devtools.yaml` - Development and testing tools
- `gitops.yaml` - GitOps tools
- `collaboration.yaml` - Team collaboration

#### 4. Test Your Workload

```bash
# Test with LoKO CLI
loko workloads add myapp
loko workloads enable myapp --deploy

# Verify deployment
loko workloads info myapp
loko workloads connect myapp
```

#### 5. Update Documentation

Create or update the workload documentation page in `src/content/docs/catalog/workloads/`.

#### 6. Submit Pull Request

```bash
git add .
git commit -m "Add workload: myapp"
git push origin add-workload-myapp
```

Open a pull request on GitHub with:

- Clear description of the workload
- Why it's useful for local development
- Any special requirements or dependencies

---

### Core Code Contributions

Contributing to the LoKO CLI requires Python development setup.

#### Development Setup

```bash
# Fork the repository
# https://github.com/getloko/loko

# Clone your fork
git clone https://github.com/YOUR-USERNAME/loko.git
cd loko

# Install in development mode with dev dependencies
pip install -e ".[dev]"

# Or using uv (faster)
uv pip install -e ".[dev]"
```

#### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=loko --cov-report=html

# Run specific test file
pytest tests/test_cli.py

# Run with debug output
pytest -v -s
```

#### Code Quality

LoKO uses [Ruff](https://docs.astral.sh/ruff/) for linting and formatting:

```bash
# Install ruff
pip install ruff

# Format code
ruff format .

# Lint code
ruff check .

# Fix auto-fixable issues
ruff check --fix .
```

#### Making Changes

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b fix-dns-resolution
   ```

2. **Make your changes** following the existing code style

3. **Add or update tests** for your changes

4. **Run tests** to ensure nothing breaks:
   ```bash
   pytest
   ruff check .
   ```

5. **Commit your changes** using conventional commit format:
   ```bash
   git commit -m "fix: resolve DNS timeout on macOS Sequoia"
   ```

6. **Push to your fork**:
   ```bash
   git push origin fix-dns-resolution
   ```

7. **Open a pull request** on GitHub

---

## Pull Request Guidelines

Follow these guidelines when submitting PRs (both catalog and core contributions):

### PR Title Format

Use conventional commit format:

- `feat: add PostgreSQL workload` - New feature
- `fix: correct Redis connection string template` - Bug fix
- `docs: clarify installation prerequisites` - Documentation
- `test: add cluster creation tests` - Tests
- `refactor: simplify DNS configuration logic` - Code refactoring
- `chore: update Helm chart versions` - Maintenance

### PR Description

Include:

1. **What**: Clear description of what changed
2. **Why**: Why the change is needed (problem being solved)
3. **Testing**: What testing you did (commands run, test results)

Example:

```markdown
## What

Add MinIO workload to object storage category.

## Why

MinIO provides S3-compatible object storage for local development,
useful for testing applications that use AWS S3.

## Testing

- Deployed with `loko workloads add minio --deploy`
- Verified Web UI accessible at https://minio.dev.me
- Tested S3 client connection using boto3
- Validated secret generation and storage
```

### Review Process

Pull requests will be reviewed when maintainers have time. There is no guaranteed timeline for reviews or merges.

**What we look for:**

- Code quality and clarity
- Test coverage (for core contributions)
- Documentation completeness
- Adherence to existing patterns
- Clear value to users

**Approval process:**

- No specific approval count required
- Maintainers merge when ready
- May request changes or clarification

---

## Workload Requirements

### System Workloads

System workloads are pre-configured services for common use cases.

**Must have:**

- ✅ Clear description and category
- ✅ Tested Helm chart configuration
- ✅ Pre-configured presets (sensible defaults)
- ✅ Connection strings for common use cases
- ✅ Health checks
- ✅ Documentation page

**Should have:**

- Auto-generated secrets
- Web UI (as linked workload if separate chart)
- Endpoints documentation
- Code examples

**Example:**

```yaml
workloads:
  redis:
    type: system
    category: cache
    description: "Redis in-memory cache"

    chart:
      repo: groundhog2k
      name: groundhog2k/redis
      version: "0.5.0"

    defaults:
      namespace: loko-workloads
      ports: [6379]

    secrets:
      - name: password
        type: password
        length: 16

    presets:
      # Pre-configured values
      service:
        type: ClusterIP
        port: 6379

    endpoints:
      - name: client
        protocol: tcp
        port: 6379

    connection-strings:
      - name: default
        template: "redis://:${PASSWORD}@${HOST}:6379"
```

### User Workloads

User workloads are examples showing how to deploy custom applications.

**Should provide:**

- Example YAML configuration
- Clear documentation
- Common patterns (HTTP vs TCP services)

---

## Adding Helm Repositories

If your workload uses a chart from a repository not in the catalog:

### Add Repository to repositories.yaml

```yaml
helm-repositories:
  - name: my-repo
    url: https://charts.example.com/
```

For OCI registries:

```yaml
helm-repositories:
  - name: my-oci-repo
    url: ghcr.io/myorg/charts
    oci: true
```

### Reference Repository in Workload

```yaml
workloads:
  myapp:
    chart:
      repo: my-repo
      name: my-repo/myapp
      version: "1.0.0"
```

---

## Documentation Guidelines

### Create Workload Documentation

Add a section to the appropriate category page in `src/content/docs/catalog/workloads/`:

```markdown
### MyApp

Brief description of what it does.

**Features:**
- Feature 1
- Feature 2
- Feature 3

**Deployment:**

\```bash
loko workloads add myapp --deploy
loko workloads connect myapp
\```

**Endpoints:**
- **Web UI**: `https://myapp.${LOKO_DOMAIN}`
- **API**: Port 8080

**Connection String:**
\```
https://myapp.${LOKO_DOMAIN}
\```

**Code Example:**

\```python
import requests

response = requests.get('https://myapp.${LOKO_DOMAIN}/api')
print(response.json())
\```

**Chart:** my-repo/myapp
```

### Documentation Standards

- Use clear, concise language
- Include practical code examples
- Show both deployment and usage
- Document all endpoints and ports
- Provide connection strings for external access (using `${LOKO_DOMAIN}`)

---

## YAML Style Guide

### Formatting

- Use 2-space indentation
- Quote strings with special characters
- Use lowercase for keys
- Use kebab-case for workload names

### Structure

```yaml
workloads:
  my-app:                        # kebab-case name
    type: system                 # system | user
    category: database           # lowercase category
    description: "Short description"  # quoted string

    chart:
      repo: groundhog2k
      name: groundhog2k/myapp
      version: "1.0.0"           # quoted version

    defaults:
      namespace: loko-workloads
      ports: [8080]              # inline array for short lists
      storage:
        size: 10Gi

    presets:
      # Group related settings
      service:
        type: ClusterIP
        port: 8080

      # Use YAML anchors for common patterns
      ingress:
        <<: *ingress-traefik
        hosts:
          - host: myapp.${LOKO_DOMAIN}
```

### YAML Anchors

Reuse common patterns from `public/catalog/catalog.yaml`:

```yaml
presets:
  ingress:
    <<: *ingress-traefik         # Traefik ingress template
  service:
    <<: *service-clusterip       # ClusterIP service
  chart:
    <<: *chart-bjw-s             # bjw-s app-template
```

---

## Testing Checklist

Before submitting your contribution:

- [ ] Workload deploys successfully with `loko workloads add <name> --deploy`
- [ ] Service is accessible at documented endpoints
- [ ] Connection strings work correctly
- [ ] Health checks pass
- [ ] Secrets are generated properly (if applicable)
- [ ] Web UI is accessible (if applicable)
- [ ] Documentation is complete and accurate
- [ ] YAML is valid and follows style guide
- [ ] No Bitnami charts used (use groundhog2k or others)

---

## Validation

The catalog uses automated validation:

### Pre-Commit Hooks (Recommended)

Automatically validate changes before committing:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

**What it checks:**

- YAML syntax and formatting
- Markdown formatting
- Trailing whitespace
- Large files
- Potential secrets
- Broken links

### YAML Syntax

```bash
# Install yamllint
pip install yamllint

# Validate all YAML files
cd public/catalog
yamllint catalog.yaml workloads/*.yaml repositories.yaml
```

### Pydantic Models

Workload definitions are validated against Python models in the LoKO CLI. Common validation errors:

**Missing required fields:**

```yaml
# ❌ Invalid
workloads:
  myapp:
    chart:
      repo: groundhog2k

# ✅ Valid
workloads:
  myapp:
    type: system
    description: "My app"
    chart:
      repo: groundhog2k
      name: groundhog2k/myapp
      version: "1.0.0"
```

**Invalid port numbers:**

```yaml
# ❌ Invalid
defaults:
  ports: [0, 70000]

# ✅ Valid
defaults:
  ports: [8080, 5432]
```

---

## Review Process

1. **Automated checks** - YAML validation, link checking
2. **Manual review** - Workload configuration, documentation quality
3. **Testing** - Deploy and verify functionality
4. **Merge** - PR merged and workload available in catalog

**Review criteria:**

- Workload serves a clear purpose
- Configuration is correct and tested
- Documentation is complete
- Follows catalog standards

---

## Getting Help

Need help with your contribution?

- **GitHub Discussions**: [getloko/loko/discussions](https://github.com/getloko/loko/discussions) - Ask questions
- **GitHub Issues**: [getloko/loko/issues](https://github.com/getloko/loko/issues) - Report bugs, request features
- **Documentation**: [https://getloko.github.io/](https://getloko.github.io/) - Comprehensive guides
- **FAQ**: [Frequently Asked Questions](../reference/faq) - Common questions answered

### Suggest Workloads

Don't have time to contribute? Suggest workloads by opening an issue:

```
Title: Add workload: PostgreSQL with pgAdmin
Description: PostgreSQL database with pgAdmin web UI for local development

- Chart: groundhog2k/postgres
- Category: database
- Use case: Application development with database
```

---

## Code of Conduct

Be respectful and professional in all interactions. We're building tools to help developers be more productive, and a positive community makes that easier for everyone.

## License

By contributing, you agree that your contributions will be licensed under the same license as the LoKO project.

---

## Next Steps

- [Schema Reference](schema) - Complete workload schema
- [Testing Guidelines](testing) - How to test workloads
- [Browse Workloads](workloads/index) - Existing workloads
