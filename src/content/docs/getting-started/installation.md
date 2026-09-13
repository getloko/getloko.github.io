---
title: "Installation"
---


Get LoKO installed and ready to create your first local Kubernetes cluster.

LoKO ships as a single self-contained binary. There is no runtime to install
and no language dependency — download it (or `brew install` it) and run.

---

## Prerequisites

LoKO drives a set of standard tools that must be on your `PATH`:

- **Docker Desktop** (v20.10+) or Docker Engine
- **kubectl** (v1.25+)
- **Helm** (v3.10+)
- **kind** (v0.20+)
- **helmfile** (v0.150+)
- **cfssl** (for LoKO-managed TLS certificates)
- **git** (required for GitOps repository seeding)
- **ngrok** (optional — only for `loko share`)

:::tip[Quick Check]
After installing prerequisites, run:
```bash
loko check prerequisites
```
This verifies all tools are installed and reports any missing dependencies.
:::

---

## Install LoKO

| Method | Best for | Notes |
|--------|----------|-------|
| **Homebrew** | macOS / Linux | Recommended. Tracks the latest release. |
| **Direct download** | Any platform, CI, air-gapped | Grab the archive for your OS/arch. |
| **From source** | Contributors, unreleased changes | Needs the Go toolchain. |

### Homebrew (macOS / Linux)

```bash
brew install getloko/tap/loko
```

Verify:

```bash
loko --version
```

Upgrade with `brew upgrade loko`. To stay on a specific release, `brew pin loko`
(and `brew unpin loko` to resume upgrades) — version selectors like
`loko@1.2.3` are not supported.

**Tap repository**: [getloko/homebrew-tap](https://github.com/getloko/homebrew-tap)

### Direct download

Go to the
[latest release](https://github.com/getloko/loko-releases/releases/latest) and
download the archive matching your OS and architecture (darwin/linux/windows ×
amd64/arm64), plus `checksums.txt`. Then verify, extract, and install:

```bash
ARCHIVE=loko_*_darwin_arm64.tar.gz    # the file you downloaded

shasum -a 256 -c checksums.txt --ignore-missing
tar -xzf "$ARCHIVE"
sudo install loko /usr/local/bin/loko
loko --version
```

On macOS, a downloaded binary is quarantined by Gatekeeper. Clear it once:

```bash
xattr -d com.apple.quarantine /usr/local/bin/loko
```

### From source

For contributing or testing unreleased changes. This requires access to the private
`loko` source repository (internal contributors only) and Go (see the version in
`go.mod`):

```bash
git clone https://github.com/getloko/loko.git
cd loko
make build          # produces ./loko
sudo install loko /usr/local/bin/loko
```

See the [Contributing Guide](/_catalog/contributing/) for the full development
setup.

---

## The workload catalog

LoKO reads its workload catalog from a local directory, `~/.loko/catalog/`
(or `$LOKO_CONFIG_DIR/catalog/`). `loko` fetches it there automatically the
first time it's needed — nothing to clone or set up manually.

Keep it current with `loko catalog sync`. See
[Catalog → Remote Sync](/_catalog/remote-sync/) for details.

---

## Install prerequisites

### macOS

```bash
brew install docker kubectl helm kind helmfile cfssl git
brew install ngrok   # optional, for `loko share`
```

Start Docker Desktop from Applications or `open -a Docker`. TLS trust is set up
by LoKO during `loko init` / `loko create`.

### Linux (Ubuntu/Debian)

**Docker**:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in
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

**cfssl**: install from your distro packages or the official Cloudflare releases.

**git**: `sudo apt install git`

### Windows (WSL2)

1. Enable WSL2 and install Ubuntu.
2. Install Docker Desktop for Windows with the WSL2 backend.
3. Follow the **Linux** steps above inside WSL2.

Native Windows is build-only; run LoKO from WSL2.

---

## Verify installation

```bash
loko --version
```

```
loko version v1.0.0
```

```bash
loko check prerequisites
```

```
  [present] docker (recommended: 20.10+)
  [present] kind (recommended: 0.33.0)
  [present] kubectl (recommended: 1.35.1)
  [present] helm (recommended: 3.17.1)
  [present] helmfile (recommended: 0.171.0)
  [present] cfssl (recommended: 1.6.5)
  [present] cfssljson (recommended: 1.6.5)
```

Each line is either `[present]` or `[missing] <name> - install: <url>`; there is no version-comparison or closing summary banner — a zero exit code means everything required is present.

---

## Upgrade

| Installed via | Upgrade |
|---|---|
| Homebrew | `brew upgrade loko` |
| Direct download | Re-download the latest archive and replace the binary |
| Source | `git pull && make build` |

---

## Troubleshooting

### "command not found: loko"

The binary isn't on your `PATH`. Move it to a directory that is
(`/usr/local/bin`, `~/.local/bin`), or add its location to `PATH`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

### macOS: "loko" cannot be opened / "Apple could not verify"

Gatekeeper quarantined the downloaded binary. Clear it:

```bash
xattr -d com.apple.quarantine /usr/local/bin/loko
```

(Not needed for the Homebrew install.)

### "Docker daemon not running"

**macOS**: `open -a Docker`, then wait for it to start.
**Linux**: `sudo systemctl start docker` (and `sudo systemctl enable docker`).

### "permission denied" on Docker commands (Linux)

```bash
sudo usermod -aG docker $USER   # then log out and back in
```

### LoKO CA not trusted

```bash
loko certs ca install
```

---

## Next steps

✅ LoKO installed &nbsp; ✅ Prerequisites verified &nbsp; ✅ Catalog cloned

→ [Quick Start Guide](/getting-started/quick-start/) · [Configuration Guide](/user-guide/configuration/)
