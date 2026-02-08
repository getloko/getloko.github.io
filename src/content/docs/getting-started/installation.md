---
title: "Installation"
---


Get LoKO installed and ready to create your first local Kubernetes cluster.

---

## Prerequisites

LoKO requires these tools to be installed:

- **Docker Desktop** (v20.10+) or Docker Engine
- **kubectl** (v1.25+)
- **Helm** (v3.10+)
- **kind** (v0.20+)
- **helmfile** (v0.150+)
- **cfssl** (for LoKO-managed TLS certificates)
- **git** (required for GitOps repository seeding)

:::tip[Quick Check]
After installing prerequisites, run:
```bash
loko check prerequisites
```
This verifies all tools are installed and reports any missing dependencies.
:::

---

## Install LoKO

Choose the installation method that works best for you:

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **pip** | Python developers | Simple, familiar | May conflict with other packages |
| **Homebrew** | macOS users | System integration, auto-updates | macOS only (formula coming soon) |
| **pipx** | Isolated install | No conflicts, clean | Extra tool to install |
| **uv** | Fast installs | 10-100x faster than pip | Newer tool, less common |

---

### Using pip (Recommended for Python Developers)

The simplest method if you already use Python:

```bash
pip install getloko
```

**Pros**:
- ✅ Simple and familiar to Python developers
- ✅ Works on all platforms (macOS, Linux, Windows)
- ✅ No additional tools needed

**Cons**:
- ❌ May conflict with other Python packages
- ❌ Requires manual upgrades

**Verify installation**:
```bash
loko --version
```

---

### Using Homebrew (macOS - Coming Soon)

The easiest way to install LoKO on macOS:

```bash
# Add the LoKO tap
brew tap getloko/tap

# Install LoKO
brew install loko
```

**Pros**:
- ✅ Auto-installs all prerequisites
- ✅ Automatic updates with `brew upgrade`
- ✅ System integration (shell completions, man pages)
- ✅ Manages dependencies automatically

**Cons**:
- ❌ macOS only
- ❌ Requires Homebrew installed

**Repository**: [getloko/homebrew-tap](https://github.com/getloko/homebrew-tap)

#### Pinning a version

Homebrew always tracks the latest release. If you need to stay on a specific version, pin it after installing:

```bash
brew pin loko       # prevent upgrades
brew unpin loko     # resume upgrades
```

> **Note**: `brew install loko@0.1.2`-style version selectors are not supported. Pinning is the recommended way to stay on a specific version.

---

### Using pipx (Recommended for Isolated Environment)

[pipx](https://pipx.pypa.io/) installs Python CLI tools in isolated environments:

```bash
# Install pipx if you don't have it
brew install pipx  # macOS
# or
python3 -m pip install --user pipx

# Ensure pipx is in PATH
pipx ensurepath

# Install LoKO
pipx install getloko
```

**Pros**:
- ✅ Isolated Python environment (no dependency conflicts)
- ✅ Easy upgrades: `pipx upgrade getloko`
- ✅ Works on macOS, Linux, Windows
- ✅ Multiple Python tools can coexist

**Cons**:
- ❌ Requires installing pipx first
- ❌ Slightly more complex than pip

**Verify installation**:
```bash
loko --version
```

---

### Using uv (Fast Alternative)

[uv](https://github.com/astral-sh/uv) is a fast Python package installer:

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install LoKO
uv tool install getloko
```

**Pros**:
- ✅ 10-100x faster than pip
- ✅ Automatic environment management
- ✅ Built-in Python version management
- ✅ Isolated like pipx

**Cons**:
- ❌ Newer tool, less widely adopted
- ❌ Requires installing uv first

**Verify installation**:
```bash
loko --version
```

---

### From Source (Development)

For contributing or testing unreleased features:

```bash
# Clone repository
git clone https://github.com/getloko/loko.git
cd loko

# Install in development mode
pip install -e ".[dev]"

# Or using uv (faster)
uv pip install -e ".[dev]"
```

**Pros**:
- ✅ Access to latest unreleased features
- ✅ Easy to modify and test changes
- ✅ Required for contributing code

**Cons**:
- ❌ Not suitable for production use
- ❌ Requires manual updates (`git pull`)
- ❌ May be unstable

See the [Contributing Guide](../catalog/contributing) for development setup details.

---

## Install Prerequisites

### macOS

**Using Homebrew** (installs everything):

```bash
brew install docker kubectl helm kind helmfile cfssl git
```

Start Docker Desktop from Applications or:
```bash
open -a Docker
```

**TLS trust is handled by LoKO during init/create**:
```bash
loko init
```

---

### Linux (Ubuntu/Debian)

**Docker**:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes
```

**kubectl**:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**Helm**:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**kind**:
```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
sudo install -o root -g root -m 0755 kind /usr/local/bin/kind
```

**helmfile**:
```bash
wget https://github.com/helmfile/helmfile/releases/latest/download/helmfile_linux_amd64
sudo install -o root -g root -m 0755 helmfile_linux_amd64 /usr/local/bin/helmfile
```

**cfssl**:
```bash
# Install from your distro packages or the official Cloudflare releases
```

**git**:
```bash
sudo apt install git
```

---

### Windows (WSL2)

**Prerequisites**:
1. Enable WSL2 and install Ubuntu
2. Install Docker Desktop for Windows with WSL2 backend

Then follow the **Linux** installation steps above inside WSL2.

---

## Verify Installation

Check that LoKO is installed:

```bash
loko --version
```

**Expected output**:
```
loko, version 0.3.x
```

Check all prerequisites:

```bash
loko check prerequisites
```

**Expected output**:
```
✓ Docker: v24.0.6 (required: 20.10+)
✓ kubectl: v1.35.0 (required: 1.25+)
✓ Helm: v3.13.2 (required: 3.10+)
✓ kind: v0.23.0 (required: 0.20+)
✓ helmfile: v0.161.0 (required: 0.150+)
✓ cfssl: installed
✓ git: installed

All prerequisites installed ✓
```

---

## Upgrade LoKO

Upgrade method depends on how you installed:

### pip

```bash
pip install --upgrade getloko
```

### Homebrew

```bash
brew upgrade loko
```

### pipx

```bash
pipx upgrade getloko
```

### uv

```bash
uv tool upgrade getloko
```

### From Source

```bash
cd loko
git pull
pip install -e ".[dev]"
```

---

## Troubleshooting

### "Command not found: loko"

**If installed via pipx**:
```bash
pipx ensurepath
# Restart your terminal
```

**If installed via pip**:
```bash
# Check if ~/.local/bin is in PATH
echo $PATH | grep -q "$HOME/.local/bin" || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

### "Docker daemon not running"

**macOS**:
```bash
open -a Docker
# Wait for Docker Desktop to start
```

**Linux**:
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Start on boot
```

---

### "Permission denied" on Docker commands

**Linux**:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

---

### LoKO CA not trusted

**macOS/Linux**:
```bash
loko init
```

**Windows**:
```bash
# WSL2 support is not yet complete
```

---

## Next Steps

✅ LoKO installed
✅ Prerequisites verified

**Ready to create your first cluster?** → [Quick Start Guide](quick-start)

**Want to customize?** → [Configuration Guide](../user-guide/configuration)
