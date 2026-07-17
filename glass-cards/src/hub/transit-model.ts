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
