/**
 * Pure weather logic for the hub: HA condition → animated-scene descriptor,
 * sky gradient palettes (theme- and sun-elevation-aware), forecast parsing,
 * and the Hem hero's precipitation one-liner. No DOM, no hass — vitest-able.
 */

export type SkyKind = 'clear' | 'partly' | 'overcast' | 'storm' | 'fog';
export type ElevBand = 'day' | 'golden' | 'night';

export interface SceneSpec {
  sky: SkyKind;
  clouds: number;     // 0..1 cover density
  sun: boolean;       // draw sun bloom (day/golden only)
  stars: boolean;     // draw star field (night only)
  rain: number;       // drops per megapixel (0 = none)
  snow: number;       // flakes per megapixel
  hail: number;       // stones per megapixel
  lightning: boolean;
  fog: boolean;
  wind: number;       // horizontal-motion multiplier (1 = calm-ish)
}

const SCENES: Record<string, SceneSpec> = {
  sunny:              { sky: 'clear',    clouds: 0,    sun: true,  stars: true,  rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1 },
  'clear-night':      { sky: 'clear',    clouds: 0,    sun: false, stars: true,  rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1 },
  partlycloudy:       { sky: 'partly',   clouds: 0.35, sun: true,  stars: true,  rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1 },
  cloudy:             { sky: 'overcast', clouds: 0.85, sun: false, stars: false, rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1 },
  rainy:              { sky: 'storm',    clouds: 0.7,  sun: false, stars: false, rain: 110, snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1.2 },
  pouring:            { sky: 'storm',    clouds: 0.9,  sun: false, stars: false, rain: 260, snow: 0,  hail: 0,   lightning: false, fog: false, wind: 1.5 },
  snowy:              { sky: 'overcast', clouds: 0.7,  sun: false, stars: false, rain: 0,   snow: 70, hail: 0,   lightning: false, fog: false, wind: 1 },
  'snowy-rainy':      { sky: 'storm',    clouds: 0.8,  sun: false, stars: false, rain: 70,  snow: 45, hail: 0,   lightning: false, fog: false, wind: 1.2 },
  lightning:          { sky: 'storm',    clouds: 0.9,  sun: false, stars: false, rain: 0,   snow: 0,  hail: 0,   lightning: true,  fog: false, wind: 1.4 },
  'lightning-rainy':  { sky: 'storm',    clouds: 0.9,  sun: false, stars: false, rain: 170, snow: 0,  hail: 0,   lightning: true,  fog: false, wind: 1.6 },
  fog:                { sky: 'fog',      clouds: 0.45, sun: false, stars: false, rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: true,  wind: 0.5 },
  hail:               { sky: 'storm',    clouds: 0.8,  sun: false, stars: false, rain: 40,  snow: 0,  hail: 120, lightning: false, fog: false, wind: 1.3 },
  windy:              { sky: 'partly',   clouds: 0.5,  sun: false, stars: false, rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 2.6 },
  'windy-variant':    { sky: 'partly',   clouds: 0.5,  sun: false, stars: false, rain: 0,   snow: 0,  hail: 0,   lightning: false, fog: false, wind: 2.6 },
};

export function conditionScene(condition: string): SceneSpec {
  return SCENES[condition] ?? SCENES.cloudy;
}

export function elevBand(elevation: number | null): ElevBand {
  if (elevation === null) return 'night';
  if (elevation > 10) return 'day';
  if (elevation > -4) return 'golden';
  return 'night';
}

type Stops = [string, string, string];

// Sky gradients [top, mid, bottom]. Natt is a single OLED-dark family (band is
// ignored) — every channel stays below 0x20 so the panel reads as black.
const NATT_SKIES: Record<SkyKind, Stops> = {
  clear:    ['#04060C', '#070B14', '#0B1220'],
  partly:   ['#05060B', '#090C12', '#10141C'],
  overcast: ['#060708', '#0A0B0D', '#101214'],
  storm:    ['#050607', '#0A0B0E', '#12141A'],
  fog:      ['#08090B', '#0E1013', '#16181C'],
};

const DAG_SKIES: Record<ElevBand, Record<SkyKind, Stops>> = {
  day: {
    clear:    ['#4A85C7', '#8CB8E3', '#D6E7F4'],
    partly:   ['#5E8FC0', '#93B7DB', '#D3E2EE'],
    overcast: ['#8A97A5', '#AEB8C2', '#D5DADF'],
    storm:    ['#4E5A68', '#6E7B89', '#9AA5B0'],
    fog:      ['#A8AFB5', '#C2C7CB', '#DCDFE1'],
  },
  golden: {
    clear:    ['#3E6CA8', '#C98A5E', '#F2C98E'],
    partly:   ['#4A6E9E', '#B98963', '#E8C393'],
    overcast: ['#77808D', '#9C9997', '#C4B4A4'],
    storm:    ['#45505E', '#6B6E75', '#8F8578'],
    fog:      ['#9AA0A8', '#B8B4AE', '#D6CDC0'],
  },
  // A manual dag override at night: dark navy versions (still calm, not black
  // — dag theme implies the user wants brightness).
  night: {
    clear:    ['#101B30', '#1A2A47', '#2A3C5C'],
    partly:   ['#12192A', '#1C2740', '#2B3852'],
    overcast: ['#1A1E26', '#242A34', '#323844'],
    storm:    ['#151820', '#20242E', '#2E323E'],
    fog:      ['#1D2026', '#282C33', '#383C44'],
  },
};

export function skyStops(sky: SkyKind, theme: 'natt' | 'dag', band: ElevBand): Stops {
  return theme === 'natt' ? NATT_SKIES[sky] : DAG_SKIES[band][sky];
}

// ── Forecast parsing ───────────────────────────────────────

export interface ForecastHour {
  ts: number;
  temp: number;
  condition: string;
  precip: number;
  precipProb: number | null;
}

export interface ForecastDay {
  ts: number;
  condition: string;
  low: number | null;
  high: number;
  precipProb: number | null;
}

interface RawEntry {
  datetime?: unknown;
  condition?: unknown;
  temperature?: unknown;
  templow?: unknown;
  precipitation?: unknown;
  precipitation_probability?: unknown;
}

function ts(e: RawEntry): number {
  const t = typeof e.datetime === 'string' ? Date.parse(e.datetime) : NaN;
  return Number.isNaN(t) ? NaN : t;
}

export function parseHourly(raw: unknown): ForecastHour[] {
  if (!Array.isArray(raw)) return [];
  const out: ForecastHour[] = [];
  for (const e of raw as RawEntry[]) {
    if (!e || typeof e !== 'object') continue;
    const t = ts(e);
    if (Number.isNaN(t) || typeof e.temperature !== 'number') continue;
    out.push({
      ts: t,
      temp: e.temperature,
      condition: typeof e.condition === 'string' ? e.condition : 'cloudy',
      precip: typeof e.precipitation === 'number' ? e.precipitation : 0,
      precipProb: typeof e.precipitation_probability === 'number' ? e.precipitation_probability : null,
    });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export function parseDaily(raw: unknown): ForecastDay[] {
  if (!Array.isArray(raw)) return [];
  const out: ForecastDay[] = [];
  for (const e of raw as RawEntry[]) {
    if (!e || typeof e !== 'object') continue;
    const t = ts(e);
    if (Number.isNaN(t) || typeof e.temperature !== 'number') continue;
    out.push({
      ts: t,
      condition: typeof e.condition === 'string' ? e.condition : 'cloudy',
      high: e.temperature,
      low: typeof e.templow === 'number' ? e.templow : null,
      precipProb: typeof e.precipitation_probability === 'number' ? e.precipitation_probability : null,
    });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export function todayRange(days: ForecastDay[]): { low: number; high: number } | null {
  const d = days[0];
  if (!d || d.low === null) return null;
  return { low: d.low, high: d.high };
}

export function weekRange(days: ForecastDay[]): { min: number; max: number } | null {
  if (days.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const d of days) {
    if (d.low !== null && d.low < min) min = d.low;
    if (d.high > max) max = d.high;
    if (d.high < min) min = Math.min(min, d.high);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

// ── Hem hero precipitation hint ────────────────────────────

const WET = new Set(['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'hail']);
const SNOWISH = new Set(['snowy', 'snowy-rainy']);

export function isWetCondition(condition: string): boolean {
  return WET.has(condition);
}

function hhmm(t: number): string {
  return `${String(new Date(t).getHours()).padStart(2, '0')}:00`;
}

/**
 * One-liner about the next precipitation change within 12 h, or null.
 *  - dry now, wet later  → "Regn börjar ~14:00" (or "Snö börjar …")
 *  - wet now, dry later  → "Uppehåll ~16:00"
 */
export function precipHint(hours: ForecastHour[], nowTs: number): string | null {
  const window = hours.filter((h) => h.ts >= nowTs && h.ts <= nowTs + 12 * 3600_000);
  if (window.length === 0) return null;
  const wetNow = isWetCondition(window[0].condition);
  if (wetNow) {
    const dry = window.find((h) => !isWetCondition(h.condition));
    return dry ? `Uppehåll ~${hhmm(dry.ts)}` : null;
  }
  const wet = window.find((h) => isWetCondition(h.condition));
  if (!wet) return null;
  const word = SNOWISH.has(wet.condition) ? 'Snö' : 'Regn';
  return `${word} börjar ~${hhmm(wet.ts)}`;
}

// ── Cloud shader palettes ──────────────────────────────────

/** RGB components 0..1 for the WebGL cloud field, per sky kind × theme. */
export interface CloudColors {
  lit: [number, number, number];
  shade: [number, number, number];
  alpha: number;
}

const NATT_CLOUDS: Record<SkyKind, CloudColors> = {
  clear:    { lit: [0.16, 0.18, 0.23], shade: [0.05, 0.06, 0.09], alpha: 0.75 },
  partly:   { lit: [0.16, 0.18, 0.23], shade: [0.05, 0.06, 0.09], alpha: 0.8 },
  overcast: { lit: [0.13, 0.14, 0.17], shade: [0.04, 0.045, 0.06], alpha: 0.85 },
  storm:    { lit: [0.12, 0.13, 0.16], shade: [0.03, 0.035, 0.05], alpha: 0.9 },
  fog:      { lit: [0.16, 0.17, 0.2], shade: [0.07, 0.08, 0.1], alpha: 0.6 },
};

const DAG_CLOUDS: Record<SkyKind, CloudColors> = {
  clear:    { lit: [1, 1, 1], shade: [0.62, 0.66, 0.72], alpha: 0.92 },
  partly:   { lit: [1, 1, 1], shade: [0.62, 0.66, 0.72], alpha: 0.92 },
  overcast: { lit: [0.82, 0.85, 0.88], shade: [0.45, 0.49, 0.55], alpha: 0.95 },
  storm:    { lit: [0.62, 0.66, 0.72], shade: [0.28, 0.31, 0.37], alpha: 0.95 },
  fog:      { lit: [0.88, 0.89, 0.9], shade: [0.65, 0.67, 0.69], alpha: 0.7 },
};

export function cloudColors(sky: SkyKind, theme: 'natt' | 'dag'): CloudColors {
  return theme === 'natt' ? NATT_CLOUDS[sky] : DAG_CLOUDS[sky];
}

// ── Video background clip selection ────────────────────────

/**
 * Stock-footage loop for a condition, or null to fall back to the shader.
 * Clips are baked by scripts/fetch-weather-clips.sh and served from
 * /local/glass-cards/weather/. Day/night follows the sun band; night clips
 * are natively dark so the natt theme needs no extra treatment for them.
 */
export function clipForScene(condition: string, band: ElevBand): string | null {
  const day = band !== 'night';
  switch (condition) {
    case 'sunny':
    case 'clear-night':
      return day ? 'sunny-day' : 'clear-night';
    case 'partlycloudy':
    case 'windy':
    case 'windy-variant':
      return day ? 'partly-day' : 'clear-night';
    case 'cloudy':
      return day ? 'cloudy-day' : 'cloudy-night';
    case 'rainy':
    case 'pouring':
    case 'lightning':
    case 'lightning-rainy':
    case 'hail':
      return day ? 'storm-day' : 'cloudy-night';
    case 'snowy':
    case 'snowy-rainy':
      return day ? 'snow-day' : 'cloudy-night';
    case 'fog':
      return 'fog';
    default:
      return day ? 'cloudy-day' : 'cloudy-night';
  }
}
