// Transforms a Tibber price-series sensor (sensor.elpris_timserie) into the
// shape the Energi page renders. The sensor exposes `today` / `tomorrow` as
// arrays of { total: SEK/kWh, startsAt: ISO8601 }; everything here is in öre
// (SEK/kWh × 100), decimals preserved — the page rounds for display.

export type PriceView = 'spot' | 'allin';

export interface HourPrice {
  start: Date;
  ore: number; // öre/kWh in the ACTIVE view
  totalOre: number; // Tibber total (spot+påslag+skatt/moms) öre/kWh
  spotOre: number | null; // Tibber energy part, null when the sensor lacks it
}

export interface PriceBreakdown {
  spot: number; // öre/kWh
  taxes: number; // Tibber total − spot (påslag + skatt + moms)
  grid: number; // configured elnät add-on
}

export interface EnergyModel {
  now: HourPrice | null;
  level: 'låg' | 'normal' | 'hög'; // vs today's average: <0.85 låg, >1.15 hög
  today: HourPrice[]; // 24 entries once published
  tomorrow: HourPrice[]; // empty until ~13:00 the day before
  cheapestWindow: { start: Date; end: Date } | null; // cheapest contiguous 3h ahead
}

const HOUR_MS = 3_600_000;
const WINDOW_HOURS = 3;
const LOW = 0.85;
const HIGH = 1.15;

const DEAD = new Set(['unavailable', 'unknown', 'none', '']);

function emptyModel(): EnergyModel {
  return { now: null, level: 'normal', today: [], tomorrow: [], cheapestWindow: null };
}

function parseHours(raw: unknown, view: PriceView, gridAddOre: number): HourPrice[] {
  if (!Array.isArray(raw)) return [];
  const out: HourPrice[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const total = typeof rec.total === 'number' ? rec.total : Number(rec.total);
    if (!Number.isFinite(total) || typeof rec.startsAt !== 'string') continue;
    const start = new Date(rec.startsAt);
    if (Number.isNaN(start.getTime())) continue;
    const energyRaw = typeof rec.energy === 'number' ? rec.energy : Number(rec.energy);
    const spotOre = Number.isFinite(energyRaw) ? energyRaw * 100 : null;
    const totalOre = total * 100;
    const ore =
      view === 'spot' && spotOre !== null
        ? spotOre
        : totalOre + (view === 'allin' ? gridAddOre : 0);
    out.push({ start, ore, totalOre, spotOre });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Cheapest contiguous 3h window among hours that have not fully elapsed. */
function cheapestWindow(future: HourPrice[]): { start: Date; end: Date } | null {
  if (future.length < WINDOW_HOURS) return null;
  let best = Infinity;
  let bestIdx = -1;
  for (let i = 0; i + WINDOW_HOURS <= future.length; i++) {
    // require the three hours to be truly consecutive (no gap across a missing hour)
    let contiguous = true;
    let sum = future[i].ore;
    for (let j = i + 1; j < i + WINDOW_HOURS; j++) {
      if (future[j].start.getTime() - future[j - 1].start.getTime() !== HOUR_MS) {
        contiguous = false;
        break;
      }
      sum += future[j].ore;
    }
    if (contiguous && sum < best) {
      best = sum;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) return null;
  return {
    start: future[bestIdx].start,
    end: new Date(future[bestIdx + WINDOW_HOURS - 1].start.getTime() + HOUR_MS),
  };
}

export interface StripHour {
  start: Date;
  ore: number;
  current: boolean; // the hour containing `now`
  cheap: boolean; // falls inside the model's cheapest 3h window
}

/**
 * The next 12 hourly slots from `now` (the current hour first), flagged for the
 * compact Hem energy strip: which one is live, and which sit in the cheapest
 * window. Slots whose hour has fully elapsed are dropped, so the strip always
 * starts at the current hour and looks forward. Fewer than 12 near midnight
 * before tomorrow's prices publish — the strip renders whatever it has.
 */
export function next12Hours(model: EnergyModel, now: Date): StripHour[] {
  const series = [...model.today, ...model.tomorrow].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const nowMs = now.getTime();
  const win = model.cheapestWindow;
  const winStart = win ? win.start.getTime() : null;
  const winEnd = win ? win.end.getTime() : null;

  return series
    .filter((h) => h.start.getTime() + HOUR_MS > nowMs)
    .slice(0, 12)
    .map((h) => {
      const t = h.start.getTime();
      return {
        start: h.start,
        ore: h.ore,
        current: t <= nowMs && nowMs < t + HOUR_MS,
        cheap: winStart !== null && t >= winStart && t < winEnd!,
      };
    });
}

export function buildEnergyModel(
  attrs: Record<string, unknown> | null | undefined,
  state: string,
  now: Date,
  view: PriceView = 'allin',
  gridAddOre = 0,
): EnergyModel {
  if (DEAD.has(String(state ?? '').toLowerCase())) return emptyModel();

  const today = parseHours(attrs?.today, view, gridAddOre);
  const tomorrow = parseHours(attrs?.tomorrow, view, gridAddOre);
  if (today.length === 0 && tomorrow.length === 0) return emptyModel();

  const series = [...today, ...tomorrow].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const nowMs = now.getTime();

  const current =
    series.find((h) => h.start.getTime() <= nowMs && nowMs < h.start.getTime() + HOUR_MS) ??
    null;

  let level: EnergyModel['level'] = 'normal';
  if (current && today.length) {
    const avg = today.reduce((s, h) => s + h.ore, 0) / today.length;
    if (avg > 0) {
      const ratio = current.ore / avg;
      if (ratio < LOW) level = 'låg';
      else if (ratio > HIGH) level = 'hög';
    }
  }

  const future = series.filter((h) => h.start.getTime() + HOUR_MS > nowMs);

  return { now: current, level, today, tomorrow, cheapestWindow: cheapestWindow(future) };
}

/** True when every parsed hour carries the Tibber energy (spot) component. */
export function hasSpotSeries(model: EnergyModel): boolean {
  const all = [...model.today, ...model.tomorrow];
  return all.length > 0 && all.every((h) => h.spotOre !== null);
}

/** Spot / taxes / elnät split for the detail flyout; null without spot data. */
export function priceBreakdown(h: HourPrice, gridAddOre: number): PriceBreakdown | null {
  if (h.spotOre === null) return null;
  return { spot: h.spotOre, taxes: h.totalOre - h.spotOre, grid: gridAddOre };
}
