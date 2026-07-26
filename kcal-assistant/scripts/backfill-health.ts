// Seed / repair daily_metrics from Home Assistant long-term statistics.
//
// Run from a workstation, not deployed. The in-cluster endpoint is not routable
// from outside, so port-forward first:
//
//   kubectl port-forward -n home-automation deploy/kcal-assistant 3001:3001
//   bun scripts/backfill-health.ts --dry-run
//   bun scripts/backfill-health.ts
//
// Why statistics and not the /api/history REST endpoint: the recorder keeps only
// 10 days, but long-term statistics are not purged on that schedule and the Oura
// integration's historical import populates them (~70 days back to 2026-05-18 as
// of 2026-07-26). Queried with period:'day', HA returns one row per day whose
// periods align to Stockholm midnight, matching the `date` primary key exactly.
//
// Which field carries the value depends on the sensor's state_class, verified
// against the live instance:
//   total / total_increasing -> `state` (the day's final value); `mean` is null
//   measurement              -> `mean`, which is exact here because each of
//                               these sensors holds one constant value per day
// A measurement sensor that changed mid-day (a recorded nap, a late sync) would
// blend its mean. That is small, self-corrects the next night, and never affects
// the nightly push, which reads live state rather than statistics.

export {}; // top-level await requires module scope

const HA_URL = process.env.HA_URL ?? "https://home.rutberg.dev";
const KCAL_URL = process.env.KCAL_URL ?? "http://127.0.0.1:3001";
const TOKEN_FILE = process.env.HA_TOKEN_FILE ?? `${process.env.HOME}/Development/homelab/.claude/ha-token`;
const START = process.env.START ?? "2026-05-01"; // before the earliest statistics
const DRY_RUN = process.argv.includes("--dry-run");

interface Source {
  column: string;
  entity: string;
  field: "state" | "mean";
  factor?: number;
  /** Values failing this are stored as unknown (null) rather than as fact. */
  plausible?: (value: number) => boolean;
}

const SOURCES: Source[] = [
  { column: "oura_total_kcal", entity: "sensor.oura_ring_total_calories", field: "state" },
  { column: "oura_active_kcal", entity: "sensor.oura_ring_active_calories", field: "state" },
  { column: "oura_steps", entity: "sensor.oura_ring_steps", field: "state" },
  { column: "sleep_score", entity: "sensor.oura_ring_sleep_score", field: "mean" },
  // Reports HOURS; the column is minutes by definition.
  //
  // The floor rejects a nap artifact: the integration takes sleep_data[-1] as
  // "latest sleep", so a short afternoon nap can leave the sensor ending the day
  // reading minutes instead of the night's total. Two such days exist in the
  // history (2026-05-21 → 9 min, 2026-06-18 → 4 min, both on days whose sleep
  // SCORE was normal). The next lowest genuine value is 264 min, so 60 separates
  // artifacts from real bad nights with room to spare. Recording these as
  // unknown is truthful; recording 4 minutes is not.
  {
    column: "sleep_duration_min",
    entity: "sensor.oura_ring_total_sleep_duration",
    field: "state",
    factor: 60,
    plausible: (min) => min >= 60,
  },
  { column: "readiness_score", entity: "sensor.oura_ring_readiness_score", field: "mean" },
  { column: "hrv_ms", entity: "sensor.oura_ring_average_sleep_hrv", field: "mean" },
  { column: "resting_hr", entity: "sensor.oura_ring_lowest_sleep_heart_rate", field: "mean" },
];

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const stockholmDate = (ms: number): string => dateFmt.format(new Date(ms));

async function fetchStatistics(token: string): Promise<Record<string, Array<Record<string, number | null>>>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${HA_URL.replace(/^http/, "ws")}/api/websocket`);
    let id = 0;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.type === "auth_required") {
        ws.send(JSON.stringify({ type: "auth", access_token: token }));
        return;
      }
      if (msg.type === "auth_invalid") {
        reject(new Error("HA rejected the token"));
        ws.close();
        return;
      }
      if (msg.type === "auth_ok") {
        ws.send(
          JSON.stringify({
            id: ++id,
            type: "recorder/statistics_during_period",
            start_time: `${START}T00:00:00+00:00`,
            statistic_ids: SOURCES.map((s) => s.entity),
            period: "day",
          }),
        );
        return;
      }
      if (msg.type === "result") {
        if (!msg.success) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
        ws.close();
      }
    });
    ws.addEventListener("error", () => reject(new Error("websocket error")));
  });
}

const token = (await Bun.file(TOKEN_FILE).text()).trim();
const stats = await fetchStatistics(token);

// Pivot from per-sensor series to per-day payloads.
const byDate = new Map<string, Record<string, number>>();
const rejected: string[] = [];
for (const source of SOURCES) {
  const rows = stats[source.entity] ?? [];
  if (rows.length === 0) console.warn(`warn: no statistics for ${source.entity}`);
  for (const row of rows) {
    const value = row[source.field];
    if (value === null || value === undefined) continue;
    const date = stockholmDate(row.start as number);
    const scaled = Math.round(value * (source.factor ?? 1));
    if (source.plausible && !source.plausible(scaled)) {
      rejected.push(`${date} ${source.column}=${scaled}`);
      continue;
    }
    const day = byDate.get(date) ?? {};
    day[source.column] = scaled;
    byDate.set(date, day);
  }
}

const dates = [...byDate.keys()].sort();
console.log(`${dates.length} days: ${dates[0]} -> ${dates.at(-1)}`);
// Never drop data silently — a quiet filter reads as "covered everything".
if (rejected.length > 0) {
  console.log(`${rejected.length} implausible value(s) left unknown: ${rejected.join(", ")}`);
}
if (DRY_RUN) {
  for (const date of dates) console.log(date, JSON.stringify(byDate.get(date)));
  console.log("\n--dry-run: nothing posted");
  process.exit(0);
}

let ok = 0;
const failures: string[] = [];
for (const date of dates) {
  const res = await fetch(`${KCAL_URL}/internal/daily`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date, ...byDate.get(date) }),
  });
  if (res.ok) ok++;
  else failures.push(`${date}: ${res.status} ${await res.text()}`);
}

console.log(`posted ${ok}/${dates.length}`);
if (failures.length > 0) {
  console.error(`${failures.length} failed:`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
