---
title: "Tunnel"
description: "TCP port forwarding from your host into the cluster via HAProxy"
---

The **tunnel** is a HAProxy container that forwards TCP ports from your host (or
LAN) into the Kind cluster's internal network. It's how database clients and
other raw-TCP tools reach workloads at your domain, e.g. `postgres.dev.me:5432`.

For exposing an **HTTP(S)** workload to the **public internet**, see
[Sharing](/user-guide/share/) — that's a separate mechanism (`loko share`, via ngrok).

## How it works

`loko create` automatically:

1. Creates a HAProxy container named `loko-<env>-tunnel`
2. Discovers the TCP ports your workloads need (from the catalog, or the
   `ports:` field in `loko.yaml`)
3. Binds each port on your local network IP (`network.ip`, overridable with
   `tunnel.bind-address`)
4. Forwards traffic to the Kind node's internal Docker network IP

The tunnel container is independent of the cluster — recreate it without
touching the cluster or losing data.

## Configuration

```yaml
tunnel:
  enabled: true          # create the HAProxy tunnel (default: true)
  bind-address: null      # host IP to bind ports on; null = network.ip
```

## Commands

```bash
loko tunnel status      # container state and forwarded ports
loko tunnel start       # start the tunnel container
loko tunnel stop        # stop and remove it
loko tunnel recreate    # rebuild it after adding/removing TCP workloads
```

## Adding TCP workloads

System workloads with TCP ports (`postgres`, `mysql`, `nats`, …) get their
ports from the catalog automatically. For a custom user workload, declare them:

```yaml
workloads:
  user:
    - name: my-service
      enabled: true
      ports: [8080]
      config:
        chart: my-repo/my-service
        version: "1.0.0"
```

After enabling or removing a TCP workload, pick up the change with:

```bash
loko tunnel recreate
```

No cluster restart is needed.

## Troubleshooting

**Port already in use** — another process holds a port LoKO needs. LoKO names
the port and process. Stop it, then `loko tunnel recreate`.

**Not forwarding** — `loko tunnel status`; if the container isn't running,
`loko tunnel start`.

**New workload's port isn't reachable** — `loko tunnel recreate` after
enabling the workload.
