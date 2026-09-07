# jellyfin — Ugreen NAS

Compose project `jellyfin` (UGOS Docker → Project). Design + measurements:
`docs/superpowers/specs/2026-09-07-jellyfin-performance-design.md`.

- WebUI `http://192.168.50.254:38096`, public `https://jellyfin.rutberg.dev` (cluster ingress).
- Config `/volume1/nas-apps/jellyfin/configurations`, cache `…/cache`, media read-only.
- Transcodes live in a 6 GB tmpfs; Jellyfin's segment deletion keeps it bounded.
- Memory: 5 GB container limit, 3 GiB .NET heap ceiling, workstation GC.
- Hardware: Intel QSV on `/dev/dri/renderD128` — decode all codecs incl. AV1, low-power
  H.264/HEVC encoders, VPP tone mapping (OpenCL tone mapping does **not** work here).
- Never UGOS "Restart" a project blindly; Stop → Enable or Redeploy.
- Rollback of the Jellyfin settings: copy `config/backup-2026-09-07/*.xml` back over
  `config/` and the two library `options.xml`, then Stop → Enable.
