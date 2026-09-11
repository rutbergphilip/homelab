# recyclarr config (live on the NAS, not in git)

The live configs are `/volume2/nas-apps/recyclarr/configs/web-1080p.yml` (Sonarr) and
`/volume2/nas-apps/recyclarr/configs/hd-bluray-web.yml` (Radarr). They were generated
on 2026-09-11 from Recyclarr's own config templates and only two lines were edited in
each: `base_url` (`http://sonarr:8989` / `http://radarr:7878`) and `api_key` (from the
arr `config.xml`). Regenerate with:

```sh
recyclarr config create --template web-1080p --template hd-bluray-web
```

(Container → recyclarr → Terminal.) The first attempt used an `include:`-based
`recyclarr.yml`; those include names do not exist in the template repo any more and the
generated templates need Recyclarr 8.x (`quality_profiles` with `trash_id`,
`custom_format_groups`), which is why the image was bumped from 7.5.2 to 8.7.2 the same
day. Keys never go in git.
