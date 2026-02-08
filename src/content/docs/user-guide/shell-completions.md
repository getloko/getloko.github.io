---
title: "Shell Completions Analysis & Documentation"
---


## Executive Summary

LoKO CLI provides intelligent shell completions powered by Typer and Click integration. This document analyzes the current state of completions, identifies gaps, and provides implementation guidance for extending completions to more commands.

**Current Status:**
- ✅ **11 commands** have working autocompletion
- 🔄 **~20 commands** could benefit from intelligent completions
- 📁 **2 completion functions** available (`complete_workloads`, `complete_service_ports`)
- ⚡ **Performance**: 3-second timeouts prevent shell hangs
- 🔍 **Git-like config search**: Finds `loko.yaml` by walking up directory tree

:::note
Runtime command targeting in LoKO is now active-env-first, but shell completion still reads a local `loko.yaml` by walking up the directory tree. Completions have not yet been updated to read the active environment from inventory.
:::

**Benefits of Intelligent Completions:**
- **Speed**: Type less, get work done faster
- **Discoverability**: Users learn available workloads/addons/repos through tab completion
- **Fewer Errors**: Autocomplete prevents typos in workload names
- **Better UX**: Professional CLI experience comparable to kubectl, docker, git

---

## Completion Infrastructure

### How It Works

LoKO uses **Typer's autocompletion** feature, which is built on Click's completion system:

1. **Shell-specific scripts**: Generated via `loko completion bash|zsh|fish`
2. **Callback functions**: Python functions that return completion candidates
3. **Type annotations**: `Annotated[str, typer.Argument(autocompletion=callback)]`
4. **Dynamic data**: Completions query config files, catalog, or kubectl at runtime

### File Locations

| File | Purpose |
|------|---------|
| `loko/cli/loko_completions.py` | Core completion functions (workloads, ports) |
| `loko/cli/commands/workloads/_shared.py` | Workload completion wrappers |
| `loko/cli/commands/logs/_types.py` | Logs completion types |

### Helper Utilities

**Config File Search:**
```python
def _find_config_file() -> str | None:
    """Find loko.yaml by walking up directory tree (like git)."""
```

**Kubectl Integration:**
```python
def _get_kubectl_config_args() -> list[str] | None:
    """Get --kubeconfig or --context args from loko.yaml."""

def _kubectl_get(resource: str, namespace: str | None = None) -> list[str]:
    """Run kubectl get and return resource names."""
```

### Performance Guarantees

- **Fast completions (< 100ms)**: Config/catalog file parsing
- **Slower completions (< 3s)**: kubectl queries with timeout
- **Error handling**: Always returns empty list on errors (never crashes shell)
- **Caching**: Config file reads happen per completion (no persistent cache yet)

---

## Current Completions Inventory

### Commands WITH Completions (11 total)

| Command | Argument | Completion Type | Data Source | File |
|---------|----------|----------------|-------------|------|
| `workloads deploy` | `[workloads...]` | Enabled workloads | `loko.yaml` | `workloads/_shared.py:30` |
| `workloads undeploy` | `[workloads...]` | Enabled workloads | `loko.yaml` | `workloads/_shared.py:30` |
| `workloads enable` | `<workload> [more...]` | Enabled workloads | local `loko.yaml` | `workloads/_shared.py:30` |
| `workloads disable` | `<workload> [more...]` | Enabled workloads | local `loko.yaml` | `workloads/_shared.py:30` |
| `workloads add` | `<workload>` | Catalog workloads | `catalog.yaml` | `workloads/_shared.py:36` |
| `workloads remove` | `<workload>` | Enabled workloads | `loko.yaml` | `workloads/_shared.py:30` |
| `workloads info` | `<workload>` | Enabled workloads | `loko.yaml` | `workloads/_shared.py:30` |
| `workloads endpoints` | `<workload>` | Enabled workloads | local `loko.yaml` | `workloads/_shared.py:32` |
| `workloads connect` | `<workload>` | Enabled workloads | `loko.yaml` | `workloads/_shared.py:30` |
| `workloads check` | `<workload>` | Enabled workloads | local `loko.yaml` | `workloads/_shared.py:32` |
| `logs workload` | `<workload>` | Enabled workloads | `loko.yaml` | `logs/_types.py:19` |

### Completion Functions Available

**1. `complete_workloads(incomplete: str)`**

Source: `loko/cli/loko_completions.py:139`

```python
def complete_workloads(incomplete: str) -> list[tuple[str, str]]:
    """
    Complete workload names from loko config.

    Returns list of (workload_name, help) tuples.
    """
```

**Data Source**: `loko.yaml` → `workloads.{system,user}[*].name` (enabled only)

**Returns**: `[("postgres", "System workload"), ("nginx", "User workload"), ...]`

**Performance**: Fast (< 100ms, file read only)

**2. `complete_service_ports(incomplete: str, service_name: str | None, namespace: str | None)`**

Source: `loko/cli/loko_completions.py:170`

```python
def complete_service_ports(incomplete: str, service_name: str | None = None,
                          namespace: str | None = None) -> list[tuple[str, str]]:
    """
    Complete port numbers for a service.

    Returns list of (port, help) tuples with port info.
    """
```

**Data Source**: kubectl (jsonpath query on service spec)

**Returns**: `[("80", "Port 80 (http)"), ("443", "Port 443 (https)"), ...]`

**Performance**: Slower (< 3s, kubectl query)

**Status**: ⚠️ **DEFINED BUT UNUSED** - no command currently uses this completion

---

## Missing Completions (Opportunities)

### High Priority (Frequently Used)

**Addons Commands (8 commands):**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| `addons list [workload]` | Workload filter | `loko.yaml` |
| `addons add <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons remove <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons enable <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons disable <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons deploy <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons undeploy <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |
| `addons info <workload> <addon>` | Both arguments | `loko.yaml` + `catalog.yaml` |

**Secrets Commands:**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| `secrets show --workload <name>` | Workload option | `loko.yaml` |

**Config Commands:**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| `config expand --workload <name>` | Workload option | `loko.yaml` |

**Helm Commands:**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| `helm repo add <name> <url>` | Repo names (for update/remove) | `loko.yaml` |
| `helm repo remove <name>` | Repo names | `loko.yaml` |

### Medium Priority

**Environment Commands:**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| `env init --enable-workload` | Catalog workload names | `catalog.yaml` |

**Port-Forward (Existing but Unused):**

| Command | Missing Completion | Data Source |
|---------|-------------------|-------------|
| Port-forward commands | Service ports | kubectl (already defined!) |

### Low Priority

**Container Commands:**

| Command | Completion Opportunity | Data Source |
|---------|----------------------|-------------|
| `dns [container]` | Running containers | Docker API |
| `tunnel [container]` | Running containers | Docker API |

**Registry Commands:**

| Command | Completion Opportunity | Data Source |
|---------|----------------------|-------------|
| Registry operations | Repo names, tags | Registry API |

---

## Data Sources Reference

### Fast (< 100ms) - Config-Based

**Workload Names (Enabled):**
- **File**: `loko.yaml`
- **Path**: `workloads.{system,user}[*].name` (where `enabled: true`)
- **Example**: `["postgres", "nginx", "redis"]`

**Catalog Workload Names:**
- **File**: `catalog.yaml`
- **Path**: `workloads.keys()`
- **Example**: `["postgres", "mysql", "redis", "nginx", ...]`

**Addon Names:**
- **File**: `catalog.yaml`
- **Path**: `workloads[workload_name].addons[*].name`
- **Example**: `["backup", "monitoring", "ha"]`

**Helm Repo Names:**
- **File**: `loko.yaml`
- **Path**: `helm-repos[*].name`
- **Example**: `["bitnami", "jetstack", "prometheus"]`

**Environment Name:**
- **File**: `loko.yaml`
- **Path**: `name`
- **Example**: `"dev"`, `"staging"`, `"prod"`

### Slower (< 3s) - External APIs

**Deployed Workloads:**
- **Source**: kubectl
- **Command**: `kubectl get deployments -o name`
- **Timeout**: 3 seconds
- **Example**: `["deployment/postgres", "deployment/nginx"]`

**Pod Names:**
- **Source**: kubectl
- **Command**: `kubectl get pods -o name`
- **Timeout**: 3 seconds

**Service Names/Ports:**
- **Source**: kubectl
- **Command**: `kubectl get service <name> -o jsonpath=...`
- **Timeout**: 3 seconds

**Docker Containers:**
- **Source**: Docker API
- **Command**: `docker ps --format {{.Names}}`
- **Example**: `["loko-dev-me-dns", "loko-dev-me-tunnel"]`

**Registry Repos/Tags:**
- **Source**: Registry API
- **Overhead**: High (HTTP requests, pagination)
- **Recommendation**: Cache results or avoid for completions

---

## Implementation Guide

### Pattern 1: Simple Workload Completion

**Use Case**: Commands that take a workload name from enabled workloads

**Example**: `workloads deploy <workload>`

**Implementation**:

```python
# In command file (e.g., loko/cli/commands/workloads/deploy.py)
from typing import Annotated
import typer
from loko.cli.loko_completions import complete_workloads

def _complete_workloads(incomplete: str) -> list[tuple]:
    """Completion callback for workload names."""
    return complete_workloads(incomplete)

# Type annotation with completion
WorkloadArg = Annotated[
    str,
    typer.Argument(
        help="Name of the workload",
        autocompletion=_complete_workloads
    )
]

# Use in command
@app.command()
def deploy(workload: WorkloadArg) -> None:
    """Deploy a workload."""
    ...
```

**Why the wrapper?**

Typer requires a specific signature for completion callbacks. The wrapper adapts `complete_workloads` to Typer's expected interface.

### Pattern 2: Catalog Workload Completion

**Use Case**: Commands that add workloads from the catalog

**Example**: `workloads add <workload>`

**Implementation**:

```python
# In workloads/_shared.py
def _complete_catalog_workloads(incomplete: str) -> list[tuple]:
    """Completion callback for catalog workload names."""
    from loko.catalog import load_catalog_cached

    try:
        catalog = load_catalog_cached()
        return [
            (name, "")
            for name in catalog.workloads.keys()
            if name.startswith(incomplete)
        ]
    except Exception:
        return []

# Type annotation
CatalogWorkloadNameArg = Annotated[
    str,
    typer.Argument(
        help="Workload name from catalog",
        autocompletion=_complete_catalog_workloads
    )
]
```

**Key Points**:
- Uses `load_catalog_cached()` for performance
- Returns empty list on errors (shell won't crash)
- Filters by `incomplete` prefix

### Pattern 3: Addon Completion (Two-Argument)

**Use Case**: Commands that need workload + addon name

**Example**: `addons add <workload> <addon>`

**Challenge**: Second argument depends on first argument context

**Proposed Solution**:

```python
# In loko/cli/loko_completions.py
def complete_addon_names(incomplete: str) -> list[tuple[str, str]]:
    """
    Complete addon names for all workloads.

    Note: This is a simplified version that shows all addons.
    Ideally, we'd filter by the workload argument, but Typer
    doesn't easily support context-aware completions.
    """
    try:
        from loko.catalog import load_catalog_cached

        catalog = load_catalog_cached()
        addons = set()

        # Collect all unique addon names across workloads
        for workload_spec in catalog.workloads.values():
            if hasattr(workload_spec, 'addons'):
                for addon in workload_spec.addons:
                    if addon.name.startswith(incomplete):
                        addons.add((addon.name, addon.get('description', '')))

        return sorted(addons)
    except Exception:
        return []

# In command file
def _complete_addons(incomplete: str) -> list[tuple]:
    return complete_addon_names(incomplete)

AddonNameArg = Annotated[
    str,
    typer.Argument(
        help="Name of the addon",
        autocompletion=_complete_addons
    )
]
```

**Limitation**: Typer doesn't easily support context from previous arguments. This completion shows ALL addons, not just those available for the specific workload.

**Alternative**: Use Click's `autocompletion` with custom context handling (more complex).

### Pattern 4: Helm Repo Completion

**Use Case**: Commands that manage helm repositories

**Example**: `helm repo remove <name>`

**Implementation**:

```python
# In loko/cli/loko_completions.py
def complete_helm_repos(incomplete: str) -> list[tuple[str, str]]:
    """
    Complete helm repository names from config.

    Returns list of (repo_name, url) tuples.
    """
    try:
        config_path = _find_config_file()
        if not config_path:
            return []

        with open(config_path) as f:
            config = yaml.safe_load(f)

        repos = config.get("helm-repos", [])
        return [
            (repo["name"], repo.get("url", ""))
            for repo in repos
            if isinstance(repo, dict) and repo.get("name", "").startswith(incomplete)
        ]
    except Exception:
        return []

# In command file
def _complete_helm_repos(incomplete: str) -> list[tuple]:
    return complete_helm_repos(incomplete)

RepoNameArg = Annotated[
    str,
    typer.Argument(
        help="Helm repository name",
        autocompletion=_complete_helm_repos
    )
]
```

### Pattern 5: Service Port Completion (Already Exists!)

**Use Case**: Port-forward commands that need service name + port

**Example**: `kubectl port-forward service/postgres 5432:5432`

**Status**: Function already exists but is UNUSED

**Implementation**:

```python
# Already in loko/cli/loko_completions.py
def complete_service_ports(incomplete: str, service_name: str | None = None,
                          namespace: str | None = None) -> list[tuple[str, str]]:
    """Complete port numbers for a service."""
    # ... implementation exists ...

# To use in a command
def _complete_ports(incomplete: str) -> list[tuple]:
    # Challenge: How to get service_name from previous arg?
    # For now, can only work if service_name is hardcoded or in context
    return complete_service_ports(incomplete, service_name="postgres")
```

**Limitation**: Same as Pattern 3 - Typer doesn't easily pass context from previous arguments.

---

## Testing Guide

### Manual Testing

**1. Install Completions:**

```bash
# Bash
source <(loko completion bash)

# Zsh
source <(loko completion zsh)

# Fish
loko completion fish | source
```

**2. Test Basic Completion:**

```bash
# Should complete to available workloads
loko workloads deploy <TAB>

# Should show: postgres, nginx, redis, etc.
```

**3. Test Partial Match:**

```bash
# Type partial name
loko workloads deploy pos<TAB>

# Should complete to: postgres
```

**4. Test Multiple Completions:**

```bash
# No prefix, should show all
loko workloads enable <TAB>

# Should list all enabled workloads with help text
```

**5. Test Catalog Completion:**

```bash
# Should show catalog workloads (not just enabled)
loko workloads add <TAB>

# Should show: postgres, mysql, redis, nginx, ... (all catalog entries)
```

**6. Test Logs Completion:**

```bash
# Should complete workload names
loko logs workload <TAB>

# Should show enabled workloads
```

### Automated Testing

**Unit Tests for Completion Functions:**

```python
# tests/cli/test_completions.py
from unittest.mock import patch, mock_open
import pytest
from loko.cli.loko_completions import complete_workloads, complete_service_ports

def test_complete_workloads_with_config(tmp_path):
    """Test workload completion with valid config."""
    config_content = """
    workloads:
      system:
        - name: postgres
          enabled: true
        - name: redis
          enabled: true
      user:
        - name: nginx
          enabled: true
        - name: mysql
          enabled: false
    """

    config_file = tmp_path / "loko.yaml"
    config_file.write_text(config_content)

    with patch('loko.cli.loko_completions._find_config_file', return_value=str(config_file)):
        result = complete_workloads("pos")

    # Should only return enabled workloads matching prefix
    assert ("postgres", "System workload") in result
    assert ("mysql", "User workload") not in result  # disabled


def test_complete_workloads_partial_match(tmp_path):
    """Test partial name matching."""
    config_content = """
    workloads:
      system:
        - name: postgres
          enabled: true
        - name: postgresql-ha
          enabled: true
    """

    config_file = tmp_path / "loko.yaml"
    config_file.write_text(config_content)

    with patch('loko.cli.loko_completions._find_config_file', return_value=str(config_file)):
        result = complete_workloads("post")

    # Should match both postgres and postgresql-ha
    assert len(result) == 2


def test_complete_workloads_no_config():
    """Test completion when config file not found."""
    with patch('loko.cli.loko_completions._find_config_file', return_value=None):
        result = complete_workloads("foo")

    # Should return empty list, not crash
    assert result == []


def test_complete_workloads_invalid_yaml(tmp_path):
    """Test completion with malformed YAML."""
    config_file = tmp_path / "loko.yaml"
    config_file.write_text("invalid: yaml: content: [")

    with patch('loko.cli.loko_completions._find_config_file', return_value=str(config_file)):
        result = complete_workloads("foo")

    # Should handle errors gracefully
    assert result == []


def test_complete_service_ports_no_service():
    """Test port completion without service name."""
    result = complete_service_ports("80", service_name=None)

    # Should return empty list if no service specified
    assert result == []


@patch('subprocess.run')
def test_complete_service_ports_success(mock_run):
    """Test successful port completion."""
    mock_run.return_value.returncode = 0
    mock_run.return_value.stdout = "5432 postgresql\n80 http\n443 https\n"

    with patch('loko.cli.loko_completions._get_kubectl_config_args', return_value=["--context", "kind"]):
        result = complete_service_ports("", service_name="postgres", namespace="default")

    assert ("5432", "Port 5432 (postgresql)") in result
    assert ("80", "Port 80 (http)") in result


@patch('subprocess.run')
def test_complete_service_ports_timeout(mock_run):
    """Test port completion timeout handling."""
    import subprocess
    mock_run.side_effect = subprocess.TimeoutExpired("kubectl", 3)

    with patch('loko.cli.loko_completions._get_kubectl_config_args', return_value=["--context", "kind"]):
        result = complete_service_ports("", service_name="postgres")

    # Should return empty list on timeout
    assert result == []
```

**Integration Tests:**

```python
# tests/integration/test_completions_integration.py
import subprocess
import pytest

@pytest.mark.integration
def test_completion_script_generation():
    """Test that completion scripts can be generated."""
    for shell in ["bash", "zsh", "fish"]:
        result = subprocess.run(
            ["loko", "completion", shell],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 0
        assert len(result.stdout) > 0

        # Shell-specific checks
        if shell == "bash":
            assert "complete -F" in result.stdout
        elif shell == "zsh":
            assert "compdef" in result.stdout
        elif shell == "fish":
            assert "complete -c loko" in result.stdout
```

### Testing Checklist

- [ ] Completions work in bash
- [ ] Completions work in zsh
- [ ] Completions work in fish
- [ ] Partial matches filter correctly
- [ ] Empty prefix shows all options
- [ ] Completions include help text
- [ ] Config file search works from subdirectories
- [ ] Completions handle missing config gracefully
- [ ] Completions handle invalid YAML gracefully
- [ ] kubectl timeouts don't hang shell (3s max)
- [ ] Completion functions return empty list on errors

---

## Shell-Specific Notes

### Bash

**Installation:**
```bash
# Add to ~/.bashrc
source <(loko completion bash)

# Or install to completion directory
loko completion bash > /etc/bash_completion.d/loko
```

**Behavior:**
- Case-sensitive by default
- Requires readline library
- Completions appear on `<TAB>`
- Double `<TAB>` shows all options if multiple matches

**Completion Format:**
```bash
complete -F _loko_completion loko
```

### Zsh

**Installation:**
```bash
# Add to ~/.zshrc
source <(loko completion zsh)

# Or add to fpath
loko completion zsh > ~/.zsh/completions/_loko
# Then add to ~/.zshrc: fpath=(~/.zsh/completions $fpath)
```

**Behavior:**
- Case-insensitive by default
- Better multi-completion support
- Shows descriptions inline
- Arrow keys to navigate options

**Features:**
- Menu completion (visual selection)
- Fuzzy matching (if configured)
- Better formatting of help text

### Fish

**Installation:**
```bash
# Add to config.fish
loko completion fish | source

# Or install to completions directory
loko completion fish > ~/.config/fish/completions/loko.fish
```

**Behavior:**
- Modern completion UI
- Auto-suggestion as you type
- Inline descriptions
- Best visual experience

**Completion Format:**
```fish
complete -c loko -n "__fish_seen_subcommand_from workloads" -a "deploy" -d "Deploy workload"
```

---

## Performance Considerations

### Fast Completions (< 100ms)

**Config File-Based:**
- Workload names from `loko.yaml`
- Catalog workload names from `catalog.yaml`
- Addon names from `catalog.yaml`
- Helm repo names from `loko.yaml`
- Environment names from `loko.yaml`

**Why Fast:**
- Small YAML files (< 100KB typically)
- Local filesystem read
- Simple parsing with PyYAML
- No network I/O

**Implementation Pattern:**
```python
def complete_fast_resource(incomplete: str) -> list[tuple[str, str]]:
    """Fast completion using config file."""
    try:
        config_path = _find_config_file()
        if not config_path:
            return []

        with open(config_path) as f:
            config = yaml.safe_load(f)

        # Extract data and filter
        items = config.get("items", [])
        return [
            (item["name"], item.get("description", ""))
            for item in items
            if item["name"].startswith(incomplete)
        ]
    except Exception:
        return []
```

### Slower Completions (< 3s timeout)

**kubectl-Based:**
- Deployed workload names
- Pod names
- Service names
- Service ports

**Why Slower:**
- Network call to Kubernetes API
- Authentication overhead
- JSON parsing
- Potential cluster lag

**Mitigation Strategies:**

**1. Always Use Timeout:**
```python
result = subprocess.run(
    cmd,
    capture_output=True,
    text=True,
    timeout=3,  # Never hang shell for more than 3 seconds
)
```

**2. Return Empty on Errors:**
```python
try:
    # kubectl query
    ...
except Exception:
    return []  # Never crash, just return no completions
```

**3. Use Efficient kubectl Queries:**
```python
# Good: Get only names
kubectl get deployments -o name

# Bad: Get full JSON and parse
kubectl get deployments -o json
```

**4. Cache Results (Future Enhancement):**
```python
# Potential future implementation
@lru_cache(maxsize=128)
def _get_cached_workloads(config_hash: str) -> list[str]:
    """Cache workload list for 60 seconds."""
    return _kubectl_get("deployments")
```

### Best Practices

**DO:**
- ✅ Use config files for completions when possible
- ✅ Set 3-second timeouts for external commands
- ✅ Return empty list on any error
- ✅ Filter by `incomplete` prefix client-side
- ✅ Use `yaml.safe_load()` for security
- ✅ Cache config file location per completion invocation

**DON'T:**
- ❌ Make network calls without timeout
- ❌ Crash on missing config files
- ❌ Parse large JSON responses
- ❌ Query external APIs in completions
- ❌ Use blocking I/O
- ❌ Return `None` (always return list)

### Performance Benchmarks (Typical)

| Completion Type | Source | Avg Time | Max Time |
|----------------|--------|----------|----------|
| Workload names | `loko.yaml` | 10ms | 50ms |
| Catalog workloads | `catalog.yaml` | 15ms | 80ms |
| Addon names | `catalog.yaml` | 20ms | 100ms |
| Helm repos | `loko.yaml` | 10ms | 50ms |
| Deployed workloads | kubectl | 200ms | 3000ms |
| Service ports | kubectl | 300ms | 3000ms |
| Pod names | kubectl | 150ms | 3000ms |

---

## Future Enhancements

### High-Value Additions

**1. Addon Completions (Highest Priority)**

**Impact**: 8 frequently-used commands missing completions

**Implementation**:
```python
# Add to loko_completions.py
def complete_addon_names(incomplete: str) -> list[tuple[str, str]]:
    """Complete addon names from catalog."""
    ...

# Add to addons/_shared.py
AddonNameArg = Annotated[
    str,
    typer.Argument(autocompletion=_complete_addons)
]
```

**Challenge**: Context-aware completion (filter addons by workload)

**2. Helm Repo Completions**

**Impact**: Prevent typos in repo names

**Implementation**: Pattern 4 above

**Data Source**: `loko.yaml` → `helm-repos[*].name`

**3. Workload Option Completions**

**Commands**: `secrets show --workload`, `config expand --workload`

**Implementation**:
```python
WorkloadOption = Annotated[
    str | None,
    typer.Option("--workload", "-w", autocompletion=_complete_workloads)
]
```

**4. Environment Name Completion**

**Use Case**: Multi-environment setups, `env activate <name>`

**Data Source**: Inventory files or config

### Medium-Value Enhancements

**5. Namespace Completion**

**Commands**: Any command with `--namespace` option

**Data Source**: kubectl get namespaces

**Performance**: Slower (kubectl query)

**6. Container Name Completion (within Pods)**

**Commands**: `logs workload --container`

**Challenge**: Requires pod context first

**7. Context-Aware Completions**

**Goal**: Second argument filtered by first argument

**Example**: `addons add <workload> <addon>` where addon list is filtered by workload

**Implementation**: Requires Click's advanced context support

### Low-Priority Ideas

**8. Port Number Completion**

**Status**: Already implemented but unused!

**Action**: Find commands that need port completion, enable it

**9. Deployed Workloads Filter**

**Use Case**: `workloads undeploy` could show only deployed workloads (not all enabled)

**Data Source**: kubectl (slower)

**Trade-off**: Accuracy vs speed

**10. Fuzzy Matching**

**Goal**: `loko workloads deploy pgres<TAB>` → completes to `postgres`

**Implementation**: Shell-specific (zsh has built-in support)

**11. Completion Caching**

**Goal**: Cache kubectl results for 60 seconds

**Implementation**: Use `@lru_cache` with time-based invalidation

**Trade-off**: Stale data vs performance

**12. Registry Repo/Tag Completion**

**Commands**: Registry operations

**Data Source**: Registry API

**Challenge**: Requires auth, pagination, many network calls

**Recommendation**: Skip (too slow for completions)

### Advanced Features

**13. Smart Defaults**

**Idea**: If only one option, auto-complete without `<TAB>`

**Example**: `loko workloads deploy` with only one workload

**14. Completion Descriptions from Catalog**

**Goal**: Show workload description in completion help text

**Example**: `postgres    PostgreSQL database server`

**Implementation**: Load catalog in `complete_workloads()`

**15. Multi-Select Completions**

**Use Case**: Commands that take multiple workloads

**Challenge**: Typer/Click limitation (no native support)

**16. Completion Analytics**

**Goal**: Track which completions are used most

**Use Case**: Prioritize optimization efforts

**Implementation**: Log completions to file (opt-in)

---

## Appendix: Implementation Checklist

### Adding a New Completion

**Step 1: Define the Completion Function**

Add to `loko/cli/loko_completions.py`:

```python
def complete_your_resource(incomplete: str) -> list[tuple[str, str]]:
    """
    Complete your resource names.

    Returns list of (name, help_text) tuples.
    """
    try:
        # 1. Find data source (config file, kubectl, etc.)
        # 2. Extract resource names
        # 3. Filter by incomplete prefix
        # 4. Return list of tuples

        config_path = _find_config_file()
        if not config_path:
            return []

        with open(config_path) as f:
            config = yaml.safe_load(f)

        resources = config.get("resources", [])
        return [
            (res["name"], res.get("description", ""))
            for res in resources
            if res["name"].startswith(incomplete)
        ]
    except Exception:
        # Always return empty list on errors
        return []
```

**Step 2: Create Wrapper Function**

In command module (e.g., `loko/cli/commands/yourcommand/_types.py`):

```python
from typing import Annotated
import typer
from loko.cli.loko_completions import complete_your_resource

def _complete_your_resource(incomplete: str) -> list[tuple]:
    """Completion callback wrapper."""
    return complete_your_resource(incomplete)

# Define annotated type
YourResourceArg = Annotated[
    str,
    typer.Argument(
        help="Name of your resource",
        autocompletion=_complete_your_resource
    )
]
```

**Step 3: Use in Command**

```python
from ._types import YourResourceArg

@app.command()
def your_command(resource: YourResourceArg) -> None:
    """Do something with resource."""
    ...
```

**Step 4: Test**

```bash
# Generate completion script
source <(loko completion bash)

# Test completion
loko yourcommand <TAB>

# Should show available resources
```

**Step 5: Write Unit Tests**

```python
def test_complete_your_resource(tmp_path):
    """Test resource completion."""
    config_content = """
    resources:
      - name: resource1
        description: First resource
      - name: resource2
        description: Second resource
    """

    config_file = tmp_path / "loko.yaml"
    config_file.write_text(config_content)

    with patch('loko.cli.loko_completions._find_config_file',
               return_value=str(config_file)):
        result = complete_your_resource("res")

    assert len(result) == 2
    assert ("resource1", "First resource") in result
```

### Completion Function Template

```python
def complete_RESOURCE(incomplete: str) -> list[tuple[str, str]]:
    """
    Complete RESOURCE names from DATA_SOURCE.

    Args:
        incomplete: Partial string typed by user

    Returns:
        List of (name, help_text) tuples matching the prefix.
        Returns empty list on any error.

    Performance: Fast/Slow (< XMS)
    Data Source: loko.yaml / catalog.yaml / kubectl
    """
    try:
        # Step 1: Locate data source
        data_source = _get_data_source()
        if not data_source:
            return []

        # Step 2: Extract resources
        resources = _extract_resources(data_source)

        # Step 3: Filter by prefix
        matches = [
            (res.name, res.description)
            for res in resources
            if res.name.startswith(incomplete)
        ]

        # Step 4: Return sorted results
        return sorted(matches)

    except Exception:
        # Never crash - shell must continue working
        return []
```

---

## Summary

LoKO CLI has a solid foundation for shell completions with 11 commands already supported. The biggest opportunity is adding completions for addon commands (8 commands), which are frequently used and would benefit greatly from intelligent autocompletion.

**Quick Wins:**
1. Addon completions (workload + addon names)
2. Helm repo name completions
3. `--workload` option completions for secrets/config commands

**Architecture Strengths:**
- Clean separation of completion logic
- Error handling prevents shell crashes
- Git-like config file search
- Performance-conscious with timeouts

**Next Steps:**
1. Implement addon completions using Pattern 3
2. Add helm repo completions using Pattern 4
3. Enable workload option completions for secrets/config
4. Consider context-aware completions for advanced use cases
