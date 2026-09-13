---
title: "Companion Tools"
---

Several system workloads (databases, caches, object storage) have an optional companion UI — pgAdmin for PostgreSQL, phpMyAdmin for MySQL, mongo-express for MongoDB, a DynamoDB admin UI, and so on. This page explains how LoKO wires credentials from the parent workload into its companion automatically, so you never hand-copy a password into a UI's config.

## The mechanism: catalog `links:`

A companion relationship is declared entirely in the catalog, on the **parent** workload's `links:` array:

```yaml
# catalog/workloads/databases.yaml (mongodb)
workloads:
  mongodb:
    links:
      - type: addon
        target: mongodb-ui
        auto-deploy: false
        required: false
        lifecycle-binding: true
        config-template:
          mongodbServer: "{{ parent.service_dns }}"
          mongodbAuthPassword: "{{ parent.secrets.password }}"
```

`config-template` is a Helm-values fragment with template placeholders. At config-generation/deploy time, `internal/generator/links.go`'s `ProcessLinks` resolves every workload's `links:` and does one of two things:

- **Target explicitly configured** (the common case — you ran `loko workloads add mongodb-ui` yourself): the parent is added to the companion's `depends-on` (so Helmfile deploys the parent first), and `config-template` is expanded and deep-merged into the companion's own values, overriding nothing the companion already set explicitly.
- **Target not configured, but the link has `auto-deploy: true`** (e.g. `forgejo-runner` alongside `forgejo`): LoKO synthesizes a full child release from the target's catalog presets + the expanded `config-template`, with no user action required.

Either way, the templating and merge logic is the same generic function for every companion — there's no per-workload branch of code to add when a new companion is wired up, just a `links:` entry.

## Template variables

`config-template` values may reference:

| Placeholder | Resolves to |
|---|---|
| `{{ parent.name }}` | The parent workload's name |
| `{{ parent.namespace }}` | The parent's namespace |
| `{{ parent.service_dns }}` | `<parent-name>.<namespace>.svc.cluster.local` |
| `{{ parent.port }}` | The parent's first configured port |
| `{{ parent.domain }}` | `$LOKO_DOMAIN` |
| `{{ parent.secrets.<key> }}` | Any key from the parent's persisted `secrets.json` entry (e.g. `.password`, `.username`) |

Secret values come from the same per-environment `secrets.json` store `loko secrets show` reads from — nothing is re-generated or duplicated for the companion.

## Worked example: MongoDB → mongo-express

```bash
loko workloads add mongodb mongodb-ui
loko workloads deploy mongodb mongodb-ui
```

Because `mongodb-ui` is explicitly configured, `ProcessLinks` merges the expanded template into its values before Helmfile runs — mongo-express starts up already pointed at the right host with the right password, no manual config step.

## Other companions using this pattern

| Parent | Companion | What gets templated |
|---|---|---|
| `mysql` | `mysql-ui` (phpMyAdmin) | `PMA_HOST` env var → `{{ parent.service_dns }}` |
| `postgres` | `postgres-ui` (pgAdmin) | A `servers.json` secret's `Host` field → `{{ parent.service_dns }}` |
| `dynamodb-local` | `dynamodb-ui` | `DYNAMO_ENDPOINT` env var → `{{ parent.service_dns }}` |

## Not this mechanism: bundled UIs

Not every workload+UI pairing is a companion link. `garage`'s web UI, for example, is a preset flag on the garage chart itself (`presets.webui.enabled: true`) — one Helm release, not two. If a workload's UI ships in the same chart, there's no `links:` entry and nothing to template; check the workload's catalog entry for a `webui:`/`ui:`-style preset instead.

## Adding a new companion link

To wire up a new companion, no Go code changes are needed — add a `links:` entry to the parent's catalog YAML with the right `config-template` for that companion's config shape, following the worked examples above. See the [Catalog Schema Reference](/_catalog/schema/) for the full `links:` field spec.
