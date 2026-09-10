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
