# minecraft — vanilla server on the cluster

One server = one Deployment (`itzg/minecraft-server`). No control panel: AMP and
friends need to create sibling containers, which means handing something a Docker
socket, and that is the opposite of what Talos + Flux buy us. A second server is a
second Deployment with its own IP and world directory.

| | |
|---|---|
| **Address** | `192.168.50.25:25565` (LAN, and over Tailscale from anywhere) |
| **Public access** | None, by design — see *Why no public address* |
| **World data** | NAS `/volume1/homelab/minecraft/data`, via the `homelab-nfs-pvc` NFS PVC |
| **Version** | Pinned by `VERSION` in `deployment.yaml` (currently `26.3`, needs the **java25** image) |
| **Type** | `VANILLA` — supports neither plugins nor mods as-is |

## Deploying and changing settings

Everything is env vars in `deployment.yaml`. Edit, commit, push; Flux applies it, or
`task reconcile` to hurry it along. The Deployment uses `Recreate`, so the old pod is
fully gone before the new one starts — two servers must never write one world.

First start generates the world and can take a few minutes. The `startupProbe` allows
up to 10 minutes before giving up, so a slow first boot will not restart-loop.

```bash
kubectl -n default logs -f deploy/minecraft          # watch it come up
kubectl -n default get pod -l app=minecraft          # status
```

### Version and Java must move together

The image tag carries the JRE. Minecraft 26.3 is compiled for Java 25, so the
`java21` image fails immediately with:

```
UnsupportedClassVersionError: ... class file version 69.0,
this version of the Java Runtime only recognizes class file versions up to 65.0
```

Class file 65 is Java 21, 69 is Java 25. When you change `VERSION`, check which JRE
that Minecraft release needs and move the image tag's `-javaNN` suffix with it.

## Server console

`rcon-cli` is in the image and reads the RCON password from the pod's own env, so no
port is published and no credential leaves the pod.

```bash
# one-shot command
kubectl -n default exec deploy/minecraft -- rcon-cli list
kubectl -n default exec deploy/minecraft -- rcon-cli say Server restarting in 5 min

# interactive console (type `exit` to leave)
kubectl -n default exec -it deploy/minecraft -- rcon-cli
```

## Permissions: whitelist and operators

The server ships whitelist-enforced and empty, which means **nobody can join until you
add them**. That is deliberate: it is reachable from the LAN and the whole tailnet.

Two ways to manage it, and they cooperate rather than fight:

- **Declarative (preferred)** — set `WHITELIST` and `OPS` in `deployment.yaml` to
  comma-separated gamertags, then push. These are Mojang usernames or UUIDs.
- **Live** — `rcon-cli whitelist add <name>` / `rcon-cli op <name>` takes effect
  immediately, no restart.

The image defaults `EXISTING_OPS_FILE` and `EXISTING_WHITELIST_FILE` to
`SYNC_FILE_MERGE_LIST`, so on restart the env list is *merged into* the existing
`whitelist.json` / `ops.json` rather than replacing it. Players added live therefore
survive a restart. The consequence: **removing a name from the env var does not remove
that player** — use `rcon-cli whitelist remove <name>` for that.

`ONLINE_MODE` is `TRUE`, so players are verified against Mojang. Do not set it to
`FALSE` on a network anything else can reach; it makes usernames unauthenticated and
the whitelist meaningless.

## Mods and plugins

`TYPE=VANILLA` runs neither. Pick the right server type first — this is the single
decision that determines what you can install:

| Want | Set `TYPE` | Installs into | Clients need it too? |
|---|---|---|---|
| **Plugins** (server-side: permissions, economy, anti-grief) | `PAPER` | `/data/plugins` | No — vanilla clients connect fine |
| **Mods** (new blocks, items, rendering) | `FABRIC` or `NEOFORGE` | `/data/mods` | **Yes** — every client needs the same mods and loader |

`PAPER` is also markedly faster than vanilla, at the cost of small vanilla-parity
differences in some redstone and mob-farm mechanics. That is the only reason the
default here is `VANILLA`: it behaves exactly like upstream, with no surprises.

Install by adding env vars, so the set of mods stays in git rather than in a directory
nobody can reconstruct:

```yaml
- { name: TYPE,    value: "PAPER" }
- { name: PLUGINS, value: "https://example.com/SomePlugin.jar" }   # comma/newline list of URLs

# or, for mods, by project rather than URL:
- { name: TYPE,              value: "FABRIC" }
- { name: MODRINTH_PROJECTS, value: "fabric-api,lithium,sodium" }
```

`MODS`/`PLUGINS` take JAR URLs or container paths; `MODRINTH_PROJECTS` and
`CURSEFORGE_FILES` resolve projects for you (CurseForge needs `CF_API_KEY`).
You can also drop jars straight into `/volume1/homelab/minecraft/data/plugins` on the
NAS and restart, but then the server's contents are no longer described by git.

**Changing `TYPE` on an existing world is not always reversible.** Mods add blocks and
entities that vanilla cannot load. Copy the world directory before switching.

## World saves and backups

The world lives on the NAS at `/volume1/homelab/minecraft/data`, reachable over SMB in
UGOS Files or over SSH (`ssh poweruser@192.168.50.254`). Everything is there: `world/`,
`server.properties`, `whitelist.json`, `ops.json`, plugins and mods.

**⚠️ This path is not backed up.** `nas-backup` covers `/volume2/nas-apps` only — the
app-config SSD. `/volume1/homelab` is RAID 5, which survives a disk failure but does
**not** protect against an accidental delete, a corrupt save or a bad mod. The same gap
applies to every other PVC on this share (Trilium notes, Home Assistant, Pi-hole,
Homarr). claude-db and kcal-assistant run their own nightly dumps, but those write back
to the same share.

Take a copy before anything risky. Always stop the server first so the region files are
not mid-write:

```bash
kubectl -n default scale deploy/minecraft --replicas=0
kubectl -n default rollout status deploy/minecraft --timeout=180s
# on the NAS: cp -a /volume1/homelab/minecraft/data/world \
#                   /volume1/homelab/minecraft/backups/world-$(date +%F)
kubectl -n default scale deploy/minecraft --replicas=1
```

For a graceful save without stopping, `rcon-cli save-all flush` forces a flush to disk.

The proper fix is a nightly snapshot of `/volume1/homelab` alongside the existing
`nas-backup` project. That is not built yet.

## Why no public address

Minecraft speaks raw TCP. It cannot pass through ingress-nginx, and the Cloudflare
tunnel carries only HTTP(S) for this cluster, so there is deliberately no route from
the internet to port 25565. Friends outside the house either join the tailnet or do
not join. Exposing it would mean a port-forward on the router, which is the one thing
this homelab's whole ingress design avoids.

## Resources

4 GiB heap inside a 6 GiB limit — the JVM needs headroom beyond the heap for metaspace
and GC. If you raise `MEMORY`, raise the container limit by more than the same amount.
Note the world is on NFS, which is slower than local disk for chunk I/O; that is the
trade for having it on the redundant volume where the rest of the homelab data lives.
