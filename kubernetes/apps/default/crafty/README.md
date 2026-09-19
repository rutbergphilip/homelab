# crafty — Minecraft server panel

[Crafty Controller](https://craftycontrol.com) runs and manages the Minecraft
server(s). It replaced the bare `itzg/minecraft-server` Deployment on 2026-09-19.

| | |
|---|---|
| **Panel** | `https://crafty.rutberg.dev` — Authentik first, then Crafty's own login |
| **Game address** | `192.168.50.25:25565` (LAN, and over Tailscale from anywhere) |
| **Public game access** | None, on purpose — see *Why no public address* |
| **Admin login** | `admin`; password in `secret.sops.yaml` (`sops -d`), see below |
| **Data** | NAS `/volume1/homelab/crafty/{config,servers,backups,logs,import}` via the `homelab-nfs-pvc` NFS PVC |
| **Java** | OpenJDK 8/11/17/21/25 in the image; Minecraft 26.x needs 25 |

## Why this panel

AMP, Pterodactyl and Pelican spawn every game server as a *sibling container*, so
their daemon needs the Docker socket — the opposite of what Talos + Flux buy here.
Crafty runs servers as **child processes inside its own container**, which makes it
one ordinary Deployment with no privileged escape hatch. The Minecraft JVM lives
inside the `crafty` pod; the pod's memory limit has to cover the panel plus every
server's heap plus JVM overhead.

## Day to day

Everything is in the panel: create a server from the version picker (Vanilla, Paper,
Fabric, Forge, …), edit `server.properties` / whitelist / ops through forms, live
console, players, kick/ban, start/stop/restart, scheduled tasks, backups, and Crafty
users with per-server roles so a friend can get console access without touching the
cluster.

The **"Vanilla"** server (Minecraft 26.3, 2G–4G heap, port 25565) was imported from the
previous itzg Deployment's world. It autostarts with the pod, has crash detection on,
and a **nightly backup at 04:30** (7 kept, compressed, `logs/` excluded) to
`/crafty/backups/<server-id>/`.

Whitelist is empty and enforced: add gamertags under *Players* before anyone can join.

## What the panel changes, and what git still owns

Server config now lives in Crafty's database, not in env vars. That is the point of a
panel. What stays in git:

- **The platform** — `deployment.yaml` (image, memory limit, mounts, security context),
  Services, Ingress. A new server that needs another game port needs that port added
  to the container *and* to the `minecraft` LoadBalancer Service here.
- **The memory ceiling** — if you raise a server's max heap in the panel past ~4G,
  raise the container limit first (8Gi today), by more than the same amount.
- **Authentik gating** — the provider/application in
  `security/authentik/app/blueprints/forward-auth.yaml`.

## Admin credentials

Crafty generated a random admin password on first boot (`app/config/default-creds.txt`;
that file has been deleted). It was then changed by API and the new value stored in
`secret.sops.yaml` here as a **git-only record** — it is not in the kustomization and is
never applied to the cluster, because nothing there consumes it. To
rotate: change it in the panel (or `PATCH /api/v2/users/1`), then update the Secret.

## Backups

Crafty's nightly zip is a **second copy on the same NFS share**. It protects against a
bad mod, a corrupt save or a mis-click — not against losing the volume. `/volume1/homelab`
itself still has no off-volume backup (`nas-backup` covers `/volume2/nas-apps` only).

The world from before the migration is kept untouched at
`/volume1/homelab/minecraft/data` and mounted read-only at `/crafty/import/vanilla`
inside the pod. Once you have played on the imported server and are happy, both that
mount (in `deployment.yaml`) and the directory can go. The import archive
`crafty/import/upload/vanilla.zip` (124 MB) can be deleted any time.

## Friends: joining over Tailscale

The pod carries a Tailscale sidecar that makes the server its own tailnet node,
**`minecraft`**, so it can be *shared* with friends' tailnets. Sharing is per-machine:
a friend gets that one node on the game port and nothing else — not the LAN, not the
routers. Tagged nodes cannot be shared, so the node logs in as Philip's user.

**Activate once** (needs Philip — only a person can log the node in as a user):

1. `scripts/tailscale-minecraft-secret.sh` — prints the sidecar's login URL. Open it,
   sign in as yourself (no tags). The script then waits for the node, disables its key
   expiry, and publishes `mc.rutberg.dev` as an unproxied public A record to the node's
   100.x address. (Alternative: pipe a personal auth key from the admin console into
   the same script.)
2. Apply the `autogroup:shared` grant in `docs/tailscale-policy.hujson` (admin console
   → Access controls). Without it the share is accepted but connections are dropped.

**Per friend:** admin console → Machines → `minecraft` → *Share* → send the link. They
install Tailscale, accept, and add `mc.rutberg.dev` in Minecraft. Whitelist them first.

Same name everywhere: on the LAN and Philip's own devices split DNS resolves it to
`192.168.50.25`; for a shared-in friend public DNS gives the tailnet address, which
only routes for them. Until step 2 has run, the public name does not exist and the
sidecar idles logged-out (it has no probes on purpose, so it can never take the
server off the LAN).

## Why no public address

Minecraft is raw TCP. It cannot pass through ingress-nginx and the Cloudflare tunnel
only carries HTTP(S) for this cluster, so there is deliberately no route from the
internet to port 25565. Friends join over the tailnet or not at all. Exposing it would
mean a router port-forward, which this ingress design exists to avoid.

## Operating notes

```bash
kubectl -n default logs -f deploy/crafty                   # panel log
kubectl -n default exec deploy/crafty -- ls /crafty/servers  # server dirs by id
kubectl -n default port-forward svc/crafty 8443:8443       # panel without Authentik (LAN debug)
```

- Runs as uid 1000 / gid 0, the launcher's non-root ("likely Kubernetes") path. The
  NFS export forces every file to `1000:10` mode 0777 whoever writes it, so ownership
  never blocks Crafty or the JVM.
- `Recreate` strategy: two Crafty instances would run two JVMs against one world.
- `terminationGracePeriodSeconds: 180` gives Crafty time to `stop` the server and let
  the world flush before SIGKILL. Do not shorten it.
- The panel is HTTPS-only with a self-signed cert; the Ingress uses
  `backend-protocol: HTTPS` and a long read timeout for the console websocket.
- Java and Minecraft version must match: 26.x needs the Java 25 the image ships. A
  future Minecraft major may need a newer image tag before the version bump.
