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

## Verified 2026-09-07 after cutover

- `/cache/transcodes` = tmpfs 6 GB; cgroup `memory.max` = 5 GiB; DOTNET vars present.
- `/dev/dri/card0` + `renderD128` visible; Jellyfin log lists hwaccel types `qsv`, `vaapi`.
- `encoding.xml` keeps the 7 hardware decoders, low-power encoders, throttling and
  segment deletion; startup complete in 6.6 s, no errors.
- Old hand-made container deleted (its settings are reproduced in `compose.yaml`).

## Abyss theme (2026-09-07)

Custom CSS lives in Dashboard → Branding ("Märke") and is served from
`/config/config/branding.xml`; nothing on disk in the container was touched, so the
File-Transformation-based plugins (Intro Skipper, Jellyfin Enhanced, Media Bar) keep
injecting normally. Pinned to a release tag instead of `@main` so the UI cannot change
under us:

```css
/* ABYSS THEME START */
@import url('https://cdn.jsdelivr.net/gh/AumGupta/abyss-jellyfin@v1.2.2/abyss.css');
@import url('https://cdn.jsdelivr.net/gh/AumGupta/abyss-jellyfin@v1.2.2/styles/abyss-je.css');
@import url('https://cdn.jsdelivr.net/gh/AumGupta/abyss-jellyfin@v1.2.2/styles/abyss-mbe.css');
/* Customise Abyss: https://aumgupta.github.io/abyss-jellyfin/ */
/* ABYSS THEME END */
```

Abyss' own "Spotlight" hero was deliberately NOT installed: Media Bar 2.4 already
provides the home banner and Spotlight would duplicate it (and needs edits to
`index.html` inside the image, lost on every image update). To upgrade the theme,
bump the tag in all three lines. To remove it, clear the field and save.

Subtitle defaults set the same day for every user: preferred language `eng`,
mode `Always` (Default mode honoured the "default" flag on Nordic releases, which
is usually Danish). Switch to `Smart` if subtitles should stay off for English audio.

## Later on 2026-09-07

- Memory limit 12 GB, .NET heap 5 GiB (tmpfs transcode segments are charged to the cgroup).
- Abyss: extra branding CSS forces the Dark page background so other per-device base
  themes (Blue Radiance leaked a navy tint) render correctly; per-device "Theme" in
  Settings → Display should still be Dark for the exact Abyss look. The full block
  currently in Branding is:

  ```css
  html:not(.transparentDocument) { background-color: #101010 !important; }
  .backgroundContainer:not(.withBackdrop):not(.backgroundContainer-transparent) { background: #101010 !important; }
  .backgroundContainer.withBackdrop { background-image: none !important; }
  .skinHeader-withBackground, .detailRibbon { background-image: none !important; }
  ```

  **Gotcha (fixed 2026-09-10):** the first version lacked the two `:not(...)` guards and
  broke video playback in the web client (audio only, black picture). During playback
  Jellyfin adds `transparentDocument` to `<html>` and `backgroundContainer-transparent`
  to `.backgroundContainer`, which is stacked *above* the `<video>` element, and its own
  `background: transparent !important` lost to our later rule of equal specificity.
  Any future `!important` background on those elements must keep the guards (webOS TVs
  render video natively behind the page, so the `html` guard matters there too).
- Plugins added: TMDb Box Sets (auto collections), Playback Reporting (stats), Open
  Subtitles (needs an opensubtitles.com login under Dashboard → Plugins → Open Subtitles
  before it fetches anything). Trickplay generation already runs daily at 03:00.

## Backups (2026-09-11)

Two layers, both off the single M.2 that holds `/volume2/nas-apps`:

1. **Jellyfin application backup** — Jellyfin 10.11's own Backup/Restore
   (`POST /Backup/Create`, DB + metadata, no trickplay/subtitles) runs nightly at 02:30,
   triggered by the Home Assistant automation `jellyfin_nightly_backup` →
   `rest_command.jellyfin_backup` (HA → `192.168.50.254:38096`, LAN, not the tunnel).
   The API key `ha-backup` lives in HA helper `input_text.jellyfin_backup_api_key`.
   Archives land in `/config/data/backups/jellyfin-backup-<stamp>.zip`
   (= `/volume2/nas-apps/jellyfin/configurations/data/backups`). Restore via
   Dashboard → Backup, or `POST /Backup/Restore`.
2. **nas-backup snapshot** (`nas/nas-backup/`) copies the whole `nas-apps` share,
   including those zips, to the RAID volume at 04:00 and prunes zips older than 7 days.

## Browsing like a streaming service (2026-09-12)

Philip: the stock library grid is clunky; Netflix-style themed rows and franchise groups
wanted, mainly for the web client and the Apple TV / smart TV.

**What is live**

- **SmartLists 12.0.1** (repo `https://raw.githubusercontent.com/jyourstone/jellyfin-plugin-manifest/main/manifest.json`)
  with 12 rule-based **collections** that refresh themselves on library changes
  (names carry a `[Smart]` suffix, the plugin adds it): Svenskt (audio `swe` or made in
  Sweden), Nordiskt (dan/nor/nob/fin/isl or NO/DK/FI/IS), Komedi, Drama, Action &
  äventyr, Sci-fi & fantasy, Thriller & kriminal, Familj & barn, Skräck, Toppbetyg
  (community rating ≥ 7.5), 80- och 90-tal, Klassiker (före 1980). Created through
  `POST /Plugins/SmartLists` (needs `UserId`/`CreatedByUserId` when using an API key);
  refresh one with `POST /Plugins/SmartLists/{id}/refresh` (the global `/refresh` only
  touches playlists). Manage them under hamburger menu → SmartLists.
- **TMDb Box Sets** (already installed) keeps grouping franchises (Star Wars, Indiana
  Jones, Emil, Pippi …). Together with the smart ones the Collections library is the
  "browse by theme" entry point; Media Bar keeps the hero banner.

**What was tried and rolled back**

`Home Screen Sections` 3.0.0 + `Collection Sections` 2.3.10 + `Plugin Pages` 3.0.0
(iamparadox repo) would have turned the home page into themed rows. On this server the
`/HomeScreen/Sections` aggregator never completes — it spin-waits forever even with only
the three stock rows and lazy loading, pins CPU, and the web client shows a spinner or
"Ingenting här". Uninstalled the same day; `useModularHome` reset to false for both users.
Do not reinstall without testing on a copy first. Notes: the plugin's per-user settings
live in `/config/plugins/configurations/Jellyfin.Plugin.HomeScreenSections/ModularHomeSettings.json`,
the client-side switch is `CustomPrefs.useModularHome` in the user's display
preferences, and a section that throws poisons the user's page cache until a restart.

**Apple TV / smart TV:** the official Swiftfin app renders collections as folders and
has no themed rows; Infuse (paid) presents the same Jellyfin library with genre and
collection rows and is the closest thing to the Netflix layout on tvOS.
