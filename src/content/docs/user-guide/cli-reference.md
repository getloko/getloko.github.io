---
title: "CLI Reference"
---


The complete, always-current command list lives at
**[Command Reference](../reference/commands)** — it is generated from
`loko <command> --help`. This page covers the concepts that apply across all
commands.

## Command targeting

Most runtime commands resolve their target environment in this order:

1. `--config` / `-c <path>` if you pass it explicitly
2. the **active environment** from inventory (`loko activate <name>` sets it)
3. `./loko.yaml` in the current directory

So after `loko activate dev` you can run `loko status`, `loko workloads deploy`,
`loko dns recreate`, `loko gitops reconcile` etc. from anywhere.

Commands that *generate* a config (`loko config generate`) act on the path you
give them (`-o`, default `loko.yaml`), not on the active environment.

## Command groups

| Group | Purpose |
|---|---|
| `env` | environment lifecycle (also top-level: `create`, `destroy`, `start`, `stop`, `restart`, `recreate`, `status`, `init`, `activate`, `clean`, `validate`) |
| `workloads` | enable / disable / deploy workloads, inspect endpoints, connections, health |
| `catalog` | inspect the workload catalog (`list`, `info`) |
| `config` | generate, sync, validate, diff, expand `loko.yaml`; port / DNS / helm-repo checks |
| `dns` | dnsmasq container + host resolver (`start`, `stop`, `status`, `recreate`, `sync`) |
| `certs` | LoKO CA and wildcard certificates (`ca install/status/remove/regenerate`, `show`, `renew`) |
| `registry` | the local Zot registry (`status`, `repos`, `repo`, `list-tags`, `load-image`, `purge`, `purge-repo`) |
| `tunnel` | HAProxy **TCP** port forwarding (`start`, `stop`, `status`, `recreate`) |
| `share` | expose an HTTP(S) workload/ingress publicly via **ngrok** (`start`, `stop`, `status`) |
| `gitops` | bootstrap and drive ArgoCD / FluxCD (`init`, `enable`, `disable`, `reconcile`, `reset`, `destroy`, `status`, `provider`) |
| `helm` | extra Helm repositories (`repo add/list/remove`) |
| `secrets` | workload credentials (`fetch`, `show`) |
| `aws` | AWS-compatible workload profile helper (`profile`) |
| `logs` | `logs workload`, `logs k8s`, `logs tunnel` |
| `inventory` | the global environment registry (`list`, `check`, `vacuum`) |
| `check` | prerequisite / port / DNS / terminal diagnostics |
| `doctor` | one aggregated diagnostic pass |
| `selftest` | deploy a test app and validate HTTPS end-to-end |

## Global flags

```
-h, --help      help for any command
-v, --version   print the version and exit
```

There is **no** global `--debug`, `--verbose`, or `--quiet`. A few subcommands
have their own `-v/--verbose` (for example `loko share start`,
`loko gitops enable --now`).

Almost every runtime command takes `-c, --config <path>` (default `loko.yaml`).

## Environment variables

| Variable | Effect |
|---|---|
| `LOKO_CONFIG_DIR` | Base directory for all LoKO state (default `~/.loko`) — the catalog, per-environment directories, inventory, secrets, and CA all live under here |

LoKO also reads standard `CI` / `GITHUB_ACTIONS` / `TERM` variables to adjust
output for non-interactive terminals.

## Exit status

`0` on success, `1` on any error. LoKO prints the failure reason to stderr.

## Shell completion

```bash
eval "$(loko completion bash)"     # bash
eval "$(loko completion zsh)"      # zsh
loko completion fish | source      # fish
```

See [Shell Completions](shell-completions) to make it permanent.

## Next steps

- [Command Reference](../reference/commands) — every command and flag
- [Environment Lifecycle](environment-lifecycle)
- [Workload Management](workload-management)
- [Troubleshooting](../reference/troubleshooting)
