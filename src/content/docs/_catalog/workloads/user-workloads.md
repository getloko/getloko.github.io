---
title: User Workloads
---

Custom applications where you provide your own Helm chart values directly.

## Overview

Unlike system workloads (which have pre-configured presets), **user workloads** require you to specify all Helm values yourself. This gives you full control over the chart configuration.

## HTTP Service Example

HTTP services use Traefik ingress for routing. No TCP port configuration needed.

```yaml
workloads:
  http-webhook:
    type: user
    description: HTTP service with Traefik ingress
    chart:
      repo: securecodebox  # From catalog repositories
      name: securecodebox/http-webhook
      version: "5.5.0"
    defaults:
      namespace: default
    values:
      # You provide ALL Helm values (no presets)
      ingress:
        enabled: true
        ingressClassName: traefik
        annotations:
          traefik.ingress.kubernetes.io/router.entrypoints: websecure
          traefik.ingress.kubernetes.io/router.tls: "true"
        hosts:
          - host: echo.${LOKO_APPS_DOMAIN}
            paths: [/]
        tls:
          - hosts:
              - echo.${LOKO_APPS_DOMAIN}
```

**HTTP Service Access:** `https://echo.${LOKO_APPS_DOMAIN}`

---

## TCP Service Example

TCP services require port exposure and special routing configuration.

```yaml
workloads:
  tcp-echo:
    type: user
    description: TCP service requiring port exposure
    chart:
      repo: istio
      name: istio/tcp-echo-server
      version: "1.2.0"
    defaults:
      namespace: default
      ports: [9000]  # Dynamically routed via HAProxy tunnel
    values:
      service:
        type: ClusterIP
        ports:
          - port: 9000
            name: tcp
            protocol: TCP
```

**Requirements:**

1. Port exposed via HAProxy tunnel (automatically updated when ports change)
2. DNS host record configuration
3. Traefik TCPIngressRoute for routing (automatically configured)

**TCP Service Access:** `telnet tcp-echo.${LOKO_DOMAIN} 9000`

---

## Using External Repositories

If your chart is **not** from a [catalog repository](../repositories), add the Helm repository to your config:

```yaml
# loko.yaml
workloads:
  helm-repositories:
    - name: my-custom-repo
      url: https://my-charts.example.com/
```

Then reference it in your workload:

```yaml
workloads:
  my-app:
    type: user
    chart:
      repo: my-custom-repo
      name: my-custom-repo/my-chart
      version: "1.0.0"
    values:
      # Your chart values here
```

---

## System vs User Workloads

| Feature | System Workloads | User Workloads |
|---------|------------------|----------------|
| **Presets** | Pre-configured values | You provide all values |
| **Secrets** | Auto-generated | You manage |
| **Configuration** | Simplified | Full Helm control |
| **Use Case** | Standard services | Custom applications |
| **Examples** | PostgreSQL, RabbitMQ, ArgoCD | Your own apps, custom charts |

## Deployment

```bash
# Add workload to config
loko workloads add my-app

# Enable and deploy
loko workloads enable my-app --now

# Check status
loko workloads status my-app
```

## Next Steps

- [Helm Repositories](../repositories) - Available catalog repos
- [System Workloads](databases) - Pre-configured workloads
- [Contributing Guide](../contributing) - Add your workload to the catalog
