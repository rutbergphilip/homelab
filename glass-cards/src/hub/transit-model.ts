/** A single SL Transport API departure (only the fields the hub reads). */
export interface SlDeparture {
  destination?: string;
  display?: string;
  expected?: string;
  scheduled?: string;
  state?: string;
  line?: { designation?: string };
}

/** Sort key: expected time in ms, falling back to scheduled, else +Infinity (last). */
function departAt(d: SlDeparture): number {
  const t = Date.parse(d.expected ?? d.scheduled ?? '');
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Departures for one bus line, minus any bound the other way, soonest first.
 *
 * `line` is matched against `line.designation`; `excludePattern` is a
 * case-insensitive substring tested against `destination` (a departure with no
 * destination is kept). Robust to missing fields and non-array input.
 */
export function filterBusDepartures(
  departures: SlDeparture[] | null | undefined,
  line: string,
  excludePattern: string,
): SlDeparture[] {
  if (!Array.isArray(departures)) return [];
  const exclude = excludePattern ? new RegExp(excludePattern, 'i') : null;
  return departures
    .filter((d) => d?.line?.designation === line)
    .filter((d) => !(exclude && d.destination && exclude.test(d.destination)))
    .sort((a, b) => departAt(a) - departAt(b));
}

/** One slimmed SL deviation as emitted by the sensor.sl_storningar command. */
interface RawDeviation {
  header?: unknown;
  priority?: unknown;
  lines?: unknown;
}

export interface ShapedDeviation {
  badges: string[]; // line designations, e.g. ['18', '19']
  header: string;
}

const MAX_DEVIATIONS = 5;

/**
 * Sensor payload → UI rows: validate defensively, merge duplicate headers
 * (one incident often spans several lines), highest priority first, cap at 5.
 */
export function shapeDeviations(raw: unknown): ShapedDeviation[] {
  if (!Array.isArray(raw)) return [];
  const byHeader = new Map<string, { badges: Set<string>; priority: number }>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as RawDeviation;
    if (typeof rec.header !== 'string' || rec.header.length === 0) continue;
    const priority = typeof rec.priority === 'number' ? rec.priority : 0;
    const badges = Array.isArray(rec.lines)
      ? rec.lines
          .map((l) => (l && typeof l === 'object' ? (l as { designation?: unknown }).designation : null))
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
      : [];
    const existing = byHeader.get(rec.header);
    if (existing) {
      for (const b of badges) existing.badges.add(b);
      existing.priority = Math.max(existing.priority, priority);
    } else {
      byHeader.set(rec.header, { badges: new Set(badges), priority });
    }
  }
  return [...byHeader.entries()]
    .sort((a, b) => b[1].priority - a[1].priority)
    .slice(0, MAX_DEVIATIONS)
    .map(([header, v]) => ({ badges: [...v.badges].sort(), header }));
}
