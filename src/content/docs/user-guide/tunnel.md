---
title: "Tunnel"
description: "TCP port forwarding via HAProxy and public HTTP(S) sharing via ngrok"
---

LoKO uses two complementary tunneling mechanisms:

| | TCP Tunnel (HAProxy) | Public Sharing (ngrok) |
|---|---|---|
| **Purpose** | Forward TCP ports to your local network | Expose HTTP(S) workloads to the public internet |
| **Setup** | Automatic | Requires a free ngrok account |
| **Access** | Local network only | Public internet |
| **Protocols** | TCP (databases, raw sockets) | HTTP/HTTPS only |
| **Lifecycle** | Always-on while cluster is running | On-demand per workload |
| **Commands** | `tunnel start/stop/recreate/status` | `tunnel share` |

---

## TCP Tunnel (HAProxy)

The TCP tunnel is a HAProxy container that runs alongside your Kind cluster and forwards TCP ports from your host machine into the cluster's internal network. This allows database clients and other TCP tools to connect directly to workloads using your configured domain (e.g., `mysql.dev.me:3306`).

### How It Works

When you run `loko create`, LoKO automatically:

1. Creates an HAProxy container named `loko-<env>-tunnel`
2. Discovers which TCP ports are needed from your workloads (from the catalog or your `loko.yaml` `ports:` field)
3. Binds each port to your local network IP (from `network.ip`)
4. Forwards traffic through to the Kind node's internal Docker network IP

The tunnel container is separate from the Kind cluster — it can be recreated without touching the cluster or losing data.

### Configuration

```yaml
tunnel:
  enabled: true           # Enable or disable the HAProxy tunnel
  bind-address: null      # IP to bind ports on; defaults to network.ip
```

### Managing the Tunnel

```bash
loko tunnel status      # Show container status and forwarded ports
loko tunnel start       # Start the tunnel container
loko tunnel stop        # Stop and remove the tunnel container
loko tunnel recreate    # Recreate after adding/removing TCP workloads
```

### Adding TCP Workloads

When you add a system workload with TCP ports (e.g., `mysql`, `postgres`, `nats`), LoKO picks up the ports automatically from the catalog. For custom user workloads, declare the ports explicitly:

```yaml
workloads:
  user:
  - name: my-service
    enabled: true
    ports: [8080]
    config:
      chart: my-chart/my-service
      version: "1.0.0"
```

After adding or removing a TCP workload, recreate the tunnel to pick up the change (no cluster restart needed):

```bash
loko tunnel recreate
```

---

## Public Sharing (ngrok)

LoKO integrates with [ngrok](https://ngrok.com) to expose any HTTP(S) workload publicly — useful for webhook testing, demos, or OAuth redirect URIs that require a public URL.

### Prerequisites

1. A free [ngrok account](https://ngrok.com/signup)
2. `ngrok` installed on your machine
3. Your auth token exported:

```bash
export NGROK_AUTHTOKEN=your_token_here
```

:::tip[Persist your token]
Add `export NGROK_AUTHTOKEN=...` to your shell profile (`.zshrc`, `.bashrc`) so you don't need to set it each session. Find your token at [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).
:::

### Usage

Share a workload defined in your `loko.yaml`:

```bash
loko tunnel share --workload mysql-ui
# or
loko tunnel share -w mysql-ui
```

Share any Kubernetes `Ingress` resource by name:

```bash
loko tunnel share --ingress my-ingress
# in a specific namespace:
loko tunnel share --ingress my-ingress --namespace my-namespace
```

When the tunnel is active, LoKO prints the public URL:

```
✅ Tunnel active: https://a1b2c3d4.ngrok.io → https://mysql-ui.dev.me
   Press Ctrl+C to stop
```

### Options

| Flag | Short | Description |
|---|---|---|
| `--workload` | `-w` | Workload name from `loko.yaml` |
| `--ingress` | `-i` | Kubernetes Ingress resource name |
| `--namespace` | `-n` | Namespace for `--ingress` (default: system namespace) |
| `--detach` | `-d` | Run tunnel in background |
| `--verbose` | `-v` | Show resolved hostname and ngrok policy file path |

`--workload` and `--ingress` are mutually exclusive. `--namespace` requires `--ingress`.

### How It Works

LoKO creates an ngrok tunnel pointing at your cluster's ingress endpoint (`<network.ip>:443`). It generates an ngrok traffic policy that rewrites the `Host` header on inbound requests so Traefik routes them to the correct workload — the same as when you access it locally.

### Running in the Background

```bash
loko tunnel share -w myapp --detach
```

The tunnel runs as a background ngrok process. To stop it:

```bash
pkill ngrok
```

### Common Use Cases

**Webhook testing** — expose your local app to receive webhooks from Stripe, GitHub, Slack, etc.:

```bash
loko tunnel share -w my-api
# Paste the ngrok URL into your webhook settings
```

**Demos** — share a running service without exposing your IP:

```bash
loko tunnel share -w my-frontend --detach
# Send the ngrok URL to your colleague
```

**OAuth flows** — some OAuth providers require a public redirect URI:

```bash
loko tunnel share -w my-app
# Use the ngrok URL as your OAuth redirect URI
```

---

## Troubleshooting

### TCP Tunnel

**Port already in use** — Another process is binding a port that LoKO needs. LoKO will tell you which port and process. Stop the conflicting process and run `loko tunnel recreate`.

**Tunnel not forwarding** — Run `loko tunnel status` to check if the container is running. If not, run `loko tunnel start`.

**New workload ports not accessible** — Run `loko tunnel recreate` after enabling a TCP workload.

### ngrok Sharing

**`NGROK_AUTHTOKEN not set`** — Export your token before running the command.

**`ERR_NGROK_108` (tunnel limit reached)** — Free ngrok accounts allow 1 active tunnel. Stop any existing ngrok sessions (`pkill ngrok`) and retry.

**`502 Bad Gateway` from ngrok** — The workload may not be running or its ingress isn't healthy. Check with `loko status` and `kubectl get ingress -A`.

**Tunnel connects but shows wrong workload** — Make sure you're using the correct workload name from `loko.yaml` or the exact Ingress resource name from `kubectl get ingress -A`.
