#!/usr/bin/env bash
# Rebuilds and uploads the wall-hub weather background loops from Pexels stock
# (free license, no attribution required). Clips are NOT committed to git —
# this script is the source of truth. Requires ffmpeg + kubectl.
#
#   ./scripts/fetch-weather-clips.sh          # download + bake + upload
#
# Each clip is cropped to 1280×800 (panel-native), 30 fps, and made seamlessly
# loopable by crossfading its last 1.5 s into its first 1.5 s, so the client
# just uses <video loop>.
set -euo pipefail

WORK=$(mktemp -d)
OUT="$WORK/out"
mkdir -p "$OUT"
F=1.5 # loop crossfade seconds

dl() { curl -sL "https://www.pexels.com/download/video/$1/" -o "$WORK/$1.mp4"; }

bake() { # tmp name
  local tmp=$1 name=$2
  local D OFF
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp")
  OFF=$(printf "%.3f" "$(echo "$D - 2*$F" | bc -l)")
  ffmpeg -v error -i "$tmp" -filter_complex \
    "[0]split[body][pre];[pre]trim=start=0:end=$F,setpts=PTS-STARTPTS[prefade];[body]trim=start=$F,setpts=PTS-STARTPTS[rest];[rest][prefade]xfade=transition=fade:duration=$F:offset=$OFF" \
    -an -c:v libx264 -preset slow -crf 22 -movflags +faststart -y "$OUT/$name.mp4"
}

process() { # id name pre_crop [trim_start trim_len]
  local id=$1 name=$2 pre=$3 tstart=${4:-} tlen=${5:-}
  local tmp="$WORK/tmp_$id.mp4"
  dl "$id"
  if [ -n "$tlen" ]; then
    ffmpeg -v error -ss "$tstart" -t "$tlen" -i "$WORK/$id.mp4" \
      -vf "$pre,scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,fps=30" \
      -an -c:v libx264 -preset fast -crf 21 -y "$tmp"
  else
    ffmpeg -v error -i "$WORK/$id.mp4" \
      -vf "$pre,scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,fps=30" \
      -an -c:v libx264 -preset fast -crf 21 -y "$tmp"
  fi
  bake "$tmp" "$name"
}

# Curated 2026-07-20 (see spec addendum). Crops remove land strips/tree tips.
process 12297567 sunny-day   "crop=iw:min(ih\,iw/1.6)"        # sun starburst through clouds (portrait master)
process 33623824 partly-day  "crop=ih*1.6:ih"                 # cumulus over deep blue
process 34916875 cloudy-day  "crop=iw:ih*0.92:0:0" 10 20      # flat streaming gray turbulence
process 29815312 snow-day    "crop=ih*1.6:ih"                 # bright billowy winter sky
process 35225359 storm-day   "crop=iw:ih*0.84:0:0"            # asperitas storm ceiling
process 31609259 clear-night "crop=ih*1.6:ih"                 # stars over moonlit cloud bank
process 5229463  cloudy-night "crop=ih*1.6:ih" 2 20           # moon through ink-blue clouds
process 6344301  fog         "crop=ih*1.6:ih"                 # mist over silhouetted forest

POD=$(kubectl -n home-automation get pod -l app=home-assistant -o jsonpath='{.items[0].metadata.name}')
kubectl -n home-automation exec "$POD" -c home-assistant -- mkdir -p /config/www/glass-cards/weather
for f in "$OUT"/*.mp4; do
  kubectl cp "$f" "home-automation/$POD:/config/www/glass-cards/weather/$(basename "$f")" -c home-assistant
done
echo "Uploaded $(ls "$OUT" | wc -l | tr -d ' ') weather clips to $POD"
rm -rf "$WORK"
