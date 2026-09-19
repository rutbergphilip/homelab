# homarr — dashboard

Gated by Authentik forward-auth on `dashboard.rutberg.dev` (single-application
pattern; the handshake is served from `/outpost.goauthentik.io` on the same host by
`ingress-outpost.yaml`).

## The image is pinned to a digest, and pinned *back*

`deployment.yaml` pins `ghcr.io/homarr-labs/homarr@sha256:ae875bf…`, which is an older
build than the current release. That is deliberate.

Homarr **cannot be upgraded on this volume as configured**. Since roughly v1.77 the
entrypoint (`scripts/entrypoint.sh`) does this whenever `PUID`/`PGID` are non-zero,
with `set -e` in force:

```sh
chown "${PUID}:${PGID}" /appdata
```

`/appdata` is the NFS share at `/volume1/homelab/homarr/appdata`. The export
root-squashes, so the container's root maps to `nobody`, and `chown` on a directory
owned by uid 1000 returns `EPERM`. `set -e` turns that into an immediate abort:

```
Starting with UID='1000', GID='1000'
Changing owner to 1000:1000...
chown: /appdata: Operation not permitted
```

The chown is not even needed — the directory is already `1000:10` with mode `0777`, so
the process can read and write it. There is simply no flag to skip the step.

This was latent, not new. The pod had been running a `:latest` image cached long enough
that the registry's `latest` had moved on twice over; any restart that re-pulled would
have hit the same wall. Pinning surfaced it rather than causing it.

### What a real upgrade needs

Pick one; none is a one-liner:

- **Run as root** (`PUID=0`, `PGID=0`) so the entrypoint skips the whole block. Mode
  `0777` means writes still work under root-squash. Costs the non-root guarantee, and
  the existing files are owned by 1000, so verify writes before trusting it.
- **Move homarr's appdata off NFS** to `local-path-provisioner`. Fastest fix for the
  ownership problem, but the data then lives on one node and is outside the NAS share.
- **Relax the export** for this path. Broad blast radius; not worth it for a dashboard.

Test any of these against a **copy** of `appdata`, never the live directory — the
entrypoint runs DB migrations on start, and a failed upgrade can leave the sqlite
database in a state the pinned version will not read.
