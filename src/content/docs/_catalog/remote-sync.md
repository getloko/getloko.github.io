---
title: "Catalog Source & Updates"
---


LoKO reads its workload catalog from a **local directory**. There is no
in-CLI catalog download — you manage the catalog directory yourself with
`git`, which keeps it fully under your control and versioned.

## Where LoKO looks

```
$LOKO_CONFIG_DIR/catalog/catalog.yaml     # $LOKO_CONFIG_DIR defaults to ~/.loko
```

So by default: `~/.loko/catalog/catalog.yaml`, with its `includes:` (the
`workloads/*.yaml` and `repositories.yaml` files) resolved relative to it.

If that file is missing, `loko config generate` and `loko create` fail with:

```
catalog not found at ~/.loko/catalog/catalog.yaml (populate ~/.loko/catalog first)
```

## Set it up

Clone the official catalog into place:

```bash
git clone https://github.com/getloko/catalog.git ~/.loko/catalog
```

**Repository**: [github.com/getloko/catalog](https://github.com/getloko/catalog)

Verify LoKO can read it:

```bash
loko catalog info      # location, workload/component counts
loko catalog list      # every catalog workload
```

## Keep it current

```bash
git -C ~/.loko/catalog pull
```

The catalog is decoupled from the LoKO binary — pulling new workload
definitions never requires upgrading `loko`. After pulling, redeploy any
workload whose chart version changed:

```bash
loko workloads deploy <name>
```

## Team or custom catalogs

Point `LOKO_CONFIG_DIR` at a directory whose `catalog/` is your team's fork,
or replace `~/.loko/catalog` with a clone of it:

```bash
git clone https://github.com/your-org/loko-catalog.git ~/.loko/catalog
```

Because it's just a git checkout you get branches, PR previews, and history
for free:

```bash
git -C ~/.loko/catalog checkout my-feature-branch   # test catalog changes
git -C ~/.loko/catalog checkout main                # back to stable
```

## Overriding a single workload

To tweak one workload without forking the whole catalog, edit its definition
directly in `~/.loko/catalog/workloads/<category>.yaml`. Your change stays
local until you `git pull` (which will conflict) or `git stash` it.

To contribute the change back, open a PR against
[getloko/catalog](https://github.com/getloko/catalog).

## See also

- **[Catalog Overview](/_catalog/)** — catalog system overview
- **[Catalog Schema](/_catalog/schema/)** — the `catalog.yaml` / workload file format
- **[Commands Reference](/reference/commands/)** — `loko catalog` commands
