---
title: "Sharing"
description: "Expose an HTTP(S) workload or Ingress to the public internet via ngrok"
---

`loko share` puts an **HTTP(S)** workload — or any Kubernetes Ingress — on the
public internet through [ngrok](https://ngrok.com). Useful for webhook testing,
demos, and OAuth redirect URIs that need a public URL.

This is separate from the [Tunnel](/user-guide/tunnel/), which forwards raw TCP ports on your
LAN. `loko share` is HTTP(S)-only and public.

## Prerequisites

1. A free [ngrok account](https://ngrok.com/signup)
2. `ngrok` installed (`brew install ngrok`)
3. ngrok authenticated **once**, in ngrok's own config:

   ```bash
   ngrok config add-authtoken <your-token>
   ```

   (The token lives in ngrok's own config, not `loko.yaml`.)
   Get your token at
   [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).

## Commands

```bash
loko share start   # start a share (foreground, or --detach)
loko share status  # is a share running for this environment?
loko share stop    # stop a detached share (or clear a stale lock)
```

### `loko share start`

```
loko share start -w <workload> | -i <ingress> [-n <namespace>] [--detach] [--verbose]
```

| Flag | | Description |
|---|---|---|
| `--workload` | `-w` | Workload name from `loko.yaml` |
| `--ingress` | `-i` | Kubernetes Ingress resource name |
| `--namespace` | `-n` | Namespace for `--ingress` (default: the system namespace) |
| `--detach` | `-d` | Run in the background |
| `--verbose` | `-v` | Print the resolved hostname and the ngrok traffic-policy file path |

Exactly one of `--workload` / `--ingress` is required. `--namespace` requires
`--ingress`.

```bash
# a workload from loko.yaml, in the foreground
loko share start -w mysql-ui

# any Ingress, in a namespace
loko share start -i my-ingress -n my-namespace

# background
loko share start -w myapp --detach
```

When it starts, LoKO prints the public URL:

```
✅ Share active: https://a1b2c3d4.ngrok.app  →  https://mysql-ui.dev.me
   Press Ctrl-C to stop
```

## Foreground vs detached

| | Foreground (default) | `--detach` |
|---|---|---|
| Runs | attached to your terminal | background process |
| Shows the URL | yes, on start | yes, on start |
| Stop with | `Ctrl-C` | `loko share stop` |
| Survives closing the terminal | no | yes |

`loko share stop` on a **foreground** share that's running in another terminal
refuses and tells you to use `Ctrl-C` there.

## Lifecycle & the lock

Each environment has its own lock file (`<env-dir>/ngrok.lock`, JSON), so two
environments can each hold a share at once.

```bash
loko share status
# running   mode=detached  pid=41234  target=https://myapp.dev.me  started=2026-08-30T09:12:03Z

loko share stop
# Share stopped
```

If a detached share's process dies without cleanup, `loko share status` reports
it as **stale** and `loko share stop` clears the lock.

## How it works

LoKO points an ngrok tunnel at your cluster's Traefik ingress endpoint
(`<network.ip>:443`) and generates an ngrok traffic policy that rewrites the
`Host` header on inbound requests — so Traefik routes them to the right
workload, exactly as it would for a local request. Only HTTP(S) is supported.

## Common uses

**Webhooks** — expose a local API to receive events from Stripe, GitHub, Slack:

```bash
loko share start -w my-api
# paste the ngrok URL into the provider's webhook settings
```

**Demos** — share a running service without exposing your IP:

```bash
loko share start -w my-frontend --detach
```

**OAuth** — some providers require a public redirect URI; use the ngrok URL.

## Troubleshooting

**`ngrok requires authentication`** — run `ngrok config add-authtoken <token>`.

**`ERR_NGROK_108` (tunnel limit reached)** — free ngrok accounts allow one
active tunnel. `loko share stop` (or stop other ngrok sessions) and retry.

**`502 Bad Gateway` from ngrok** — the workload or its Ingress isn't healthy.
Check `loko status` and `kubectl get ingress -A`.

**Wrong workload served** — use the exact workload name from `loko.yaml`, or the
exact Ingress name from `kubectl get ingress -A`.
