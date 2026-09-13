---
title: "Catalog Source & Updates"
---


LoKO reads its workload catalog from a **local directory**. `loko` fetches
and caches it there automatically over HTTPS — there's no manual clone or
git management involved.

## Where LoKO looks

```
$LOKO_CONFIG_DIR/catalog/catalog.yaml     # $LOKO_CONFIG_DIR defaults to ~/.loko
```

So by default: `~/.loko/catalog/catalog.yaml`, with its `includes:` (the
`workloads/*.yaml` and `repositories.yaml` files) resolved relative to it.

If that file is missing, the first command that needs it (`loko config
generate`, `loko create`, `loko catalog list`, etc.) fetches the official
catalog for you automatically, after a one-time notice.

## Set it up

Nothing to do — the first command that needs the catalog fetches it for you.
To fetch (or re-fetch) it explicitly:

```bash
loko catalog sync
```

Verify LoKO can read it:

```bash
loko catalog info      # location, workload/component counts
loko catalog list      # every catalog workload
```

## Keep it current

```bash
loko catalog sync
```

The catalog is decoupled from the LoKO binary — syncing new workload
definitions never requires upgrading `loko`. After syncing, redeploy any
workload whose chart version changed:

```bash
loko workloads deploy <name>
```

## Team or custom catalogs

Point `loko catalog sync` at your team's fork instead of the official
catalog:

```bash
loko catalog sync --url https://raw.githubusercontent.com/your-org/loko-catalog/main/catalog.yaml
```

This overwrites `$LOKO_CONFIG_DIR/catalog/` with your fork's content. Run it
again any time your fork changes — there's no persistent "remembered" URL,
pass `--url` each time or wrap it in a script/alias.

## Overriding a single workload

To tweak one workload without forking the whole catalog, edit its definition
directly in `~/.loko/catalog/workloads/<category>.yaml`. The edit persists
until the next `loko catalog sync`, which overwrites the whole catalog
directory from its source — re-apply your edit after syncing, or fork the
catalog (above) if you need it to survive syncs.

To contribute the change back, open a PR against
[getloko/catalog](https://github.com/getloko/catalog).

## See also

- **[Catalog Overview](/_catalog/)** — catalog system overview
- **[Catalog Schema](/_catalog/schema/)** — the `catalog.yaml` / workload file format
- **[Commands Reference](/reference/commands/)** — `loko catalog` commands
