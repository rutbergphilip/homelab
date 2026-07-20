# Weather Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apple Weather-grade weather on the wall hub: clock+weather hero on Hem, full-forecast popup (hourly + 7-day, Nynäshamn/Stockholm), and a toggleable animated weather background behind the Hem page.

**Architecture:** Pure logic (condition→scene mapping, sky palettes, forecast parsing, precip hints) lives in `src/hub/weather-model.ts`, vitest-tested. Fetch glue (`weather.get_forecasts` via `hass.callWS`, 15-min cache) and settings (localStorage toggle + debug force-override) are separate small modules. UI: upgraded `hub-clock` hero, new `hub-weather-popup` (transit-popup pattern), new `hub-weather-bg` canvas engine mounted inside `hub-home-page`, wired through `glass-hub`.

**Tech Stack:** Lit 3, TypeScript, Rollup single-bundle, vitest (jsdom). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-20-weather-tracker-design.md`

## Global Constraints

- All UI copy in Swedish (`Animerad bakgrund`, `Regn börjar ~14:00`, `Idag`, `Känns som`).
- Natt theme stays OLED-dark: sky gradients near-black (values in Task 1), dim particles. Never a bright sky in natt.
- Use only existing design tokens (`--hub-*` from `src/styles/tokens.ts`); no new hex values in components outside the sky-palette table in `weather-model.ts`.
- No new npm dependencies. Canvas engine is hand-rolled.
- Imports inside `src/` use explicit `.js` extensions (existing convention). Test files import from `../src/...` without extension.
- Canvas `devicePixelRatio` capped at 1.5. rAF loop must fully stop when Hem is not active, tab hidden, or component disconnected; log `[weather-bg] start` / `[weather-bg] stop` via `console.debug` (verification hooks).
- Debug override: `?weather=<condition>` URL param and `window.__hubForceWeather('<condition>')`.
- localStorage keys: background toggle = `glass-hub-weather-bg` (`'on'`/`'off'`, default on).
- Run tests with `npx vitest run --environment jsdom <file>` (or `npm test` for all).
- Commit after each task with the repo's conventional style: `feat(hub): …`, `test(hub): …`.
- Repo root for all paths: `/Users/philiprutberg/Development/homelab/glass-cards` unless prefixed `docs/` (repo-root homelab).

---

### Task 1: Pure weather model

**Files:**
- Create: `src/hub/weather-model.ts`
- Test: `test/weather-model.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 3–5):
  - `type SkyKind = 'clear' | 'partly' | 'overcast' | 'storm' | 'fog'`
  - `type ElevBand = 'day' | 'golden' | 'night'`
  - `interface SceneSpec { sky: SkyKind; clouds: number; sun: boolean; stars: boolean; rain: number; snow: number; hail: number; lightning: boolean; fog: boolean; wind: number }`
  - `conditionScene(condition: string): SceneSpec`
  - `elevBand(elevation: number | null): ElevBand`
  - `skyStops(sky: SkyKind, theme: 'natt' | 'dag', band: ElevBand): [string, string, string]`
  - `interface ForecastHour { ts: number; temp: number; condition: string; precip: number; precipProb: number | null }`
  - `interface ForecastDay { ts: number; condition: string; low: number | null; high: number; precipProb: number | null }`
  - `parseHourly(raw: unknown): ForecastHour[]`
  - `parseDaily(raw: unknown): ForecastDay[]`
  - `todayRange(days: ForecastDay[]): { low: number; high: number } | null`
  - `weekRange(days: ForecastDay[]): { min: number; max: number } | null`
  - `precipHint(hours: ForecastHour[], nowTs: number): string | null`
  - `isWetCondition(condition: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `test/weather-model.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  conditionScene,
  elevBand,
  skyStops,
  parseHourly,
  parseDaily,
  todayRange,
  weekRange,
  precipHint,
  isWetCondition,
} from '../src/hub/weather-model';

const ALL_CONDITIONS = [
  'sunny', 'clear-night', 'partlycloudy', 'cloudy', 'rainy', 'pouring',
  'snowy', 'snowy-rainy', 'lightning', 'lightning-rainy', 'fog', 'hail',
  'windy', 'windy-variant', 'exceptional',
];

describe('conditionScene', () => {
  it('returns a scene for every HA condition (and unknown falls back)', () => {
    for (const c of [...ALL_CONDITIONS, 'banana', '']) {
      const s = conditionScene(c);
      expect(s.sky, c).toBeTruthy();
      expect(s.clouds).toBeGreaterThanOrEqual(0);
      expect(s.clouds).toBeLessThanOrEqual(1);
    }
  });
  it('sunny: clear sky, sun, no particles', () => {
    const s = conditionScene('sunny');
    expect(s).toMatchObject({ sky: 'clear', sun: true, rain: 0, snow: 0, lightning: false });
  });
  it('clear-night: stars, no sun', () => {
    const s = conditionScene('clear-night');
    expect(s.stars).toBe(true);
    expect(s.sun).toBe(false);
  });
  it('pouring is denser than rainy', () => {
    expect(conditionScene('pouring').rain).toBeGreaterThan(conditionScene('rainy').rain);
  });
  it('snowy-rainy mixes rain and snow', () => {
    const s = conditionScene('snowy-rainy');
    expect(s.rain).toBeGreaterThan(0);
    expect(s.snow).toBeGreaterThan(0);
  });
  it('lightning variants flash; windy blows harder', () => {
    expect(conditionScene('lightning').lightning).toBe(true);
    expect(conditionScene('lightning-rainy').lightning).toBe(true);
    expect(conditionScene('windy').wind).toBeGreaterThan(conditionScene('cloudy').wind);
  });
  it('unknown falls back to cloudy scene', () => {
    expect(conditionScene('banana')).toEqual(conditionScene('cloudy'));
  });
});

describe('elevBand', () => {
  it('maps elevation to bands', () => {
    expect(elevBand(30)).toBe('day');
    expect(elevBand(6)).toBe('golden');
    expect(elevBand(-2)).toBe('golden');
    expect(elevBand(-10)).toBe('night');
    expect(elevBand(null)).toBe('night');
  });
});

describe('skyStops', () => {
  it('returns 3 hex stops for every sky × theme × band', () => {
    const skies = ['clear', 'partly', 'overcast', 'storm', 'fog'] as const;
    const bands = ['day', 'golden', 'night'] as const;
    for (const sky of skies) {
      for (const band of bands) {
        for (const theme of ['natt', 'dag'] as const) {
          const stops = skyStops(sky, theme, band);
          expect(stops).toHaveLength(3);
          for (const s of stops) expect(s).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      }
    }
  });
  it('natt stays OLED-dark: every natt stop is darker than 0x20 per channel avg', () => {
    const skies = ['clear', 'partly', 'overcast', 'storm', 'fog'] as const;
    for (const sky of skies) {
      for (const stop of skyStops(sky, 'natt', 'night')) {
        const v = parseInt(stop.slice(1), 16);
        const avg = (((v >> 16) & 255) + ((v >> 8) & 255) + (v & 255)) / 3;
        expect(avg, `${sky} ${stop}`).toBeLessThan(0x20);
      }
    }
  });
});

const H = (h: number, condition: string, temp = 20, precip = 0): unknown => ({
  datetime: new Date(Date.UTC(2026, 6, 20, h)).toISOString(),
  condition,
  temperature: temp,
  precipitation: precip,
  precipitation_probability: 40,
});

describe('parseHourly', () => {
  it('parses valid entries, skips junk, non-array → []', () => {
    expect(parseHourly(null)).toEqual([]);
    expect(parseHourly('x')).toEqual([]);
    const hours = parseHourly([H(12, 'rainy', 18.4, 0.6), { datetime: 'nope' }, { temperature: 5 }]);
    expect(hours).toHaveLength(1);
    expect(hours[0].temp).toBe(18.4);
    expect(hours[0].condition).toBe('rainy');
    expect(hours[0].precip).toBe(0.6);
    expect(hours[0].precipProb).toBe(40);
  });
});

describe('parseDaily / ranges', () => {
  const raw = [
    { datetime: '2026-07-20T12:00:00Z', condition: 'rainy', temperature: 22, templow: 14, precipitation_probability: 80 },
    { datetime: '2026-07-21T12:00:00Z', condition: 'sunny', temperature: 25, templow: 12 },
    { datetime: '2026-07-22T12:00:00Z', condition: 'cloudy', temperature: 19, templow: 11, precipitation_probability: 10 },
  ];
  it('parses daily entries', () => {
    const days = parseDaily(raw);
    expect(days).toHaveLength(3);
    expect(days[0]).toMatchObject({ condition: 'rainy', high: 22, low: 14, precipProb: 80 });
    expect(days[1].precipProb).toBeNull();
  });
  it('todayRange uses the first day', () => {
    expect(todayRange(parseDaily(raw))).toEqual({ low: 14, high: 22 });
    expect(todayRange([])).toBeNull();
  });
  it('weekRange spans all days', () => {
    expect(weekRange(parseDaily(raw))).toEqual({ min: 11, max: 25 });
    expect(weekRange([])).toBeNull();
  });
});

describe('precipHint', () => {
  const now = Date.UTC(2026, 6, 20, 10);
  it('rain starting soon → "Regn börjar"', () => {
    const hours = parseHourly([H(10, 'cloudy'), H(11, 'cloudy'), H(12, 'rainy'), H(13, 'rainy')]);
    expect(precipHint(hours, now)).toMatch(/^Regn börjar ~\d{2}:00$/);
  });
  it('snow starting soon → "Snö börjar"', () => {
    const hours = parseHourly([H(10, 'cloudy'), H(12, 'snowy')]);
    expect(precipHint(hours, now)).toMatch(/^Snö börjar ~\d{2}:00$/);
  });
  it('raining now, stops later → "Uppehåll"', () => {
    const hours = parseHourly([H(10, 'rainy'), H(11, 'rainy'), H(12, 'cloudy')]);
    expect(precipHint(hours, now)).toMatch(/^Uppehåll ~\d{2}:00$/);
  });
  it('dry all window or raining all window → null', () => {
    expect(precipHint(parseHourly([H(10, 'sunny'), H(11, 'cloudy')]), now)).toBeNull();
    expect(precipHint(parseHourly([H(10, 'rainy'), H(11, 'pouring')]), now)).toBeNull();
    expect(precipHint([], now)).toBeNull();
  });
  it('ignores hours beyond 12h and before now', () => {
    const hours = parseHourly([H(8, 'rainy'), H(10, 'cloudy'), H(23, 'rainy')]);
    expect(precipHint(hours, now)).toBeNull();
  });
});

describe('isWetCondition', () => {
  it('wet vs dry', () => {
    for (const c of ['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'hail'])
      expect(isWetCondition(c), c).toBe(true);
    for (const c of ['sunny', 'cloudy', 'fog', 'windy', 'lightning'])
      expect(isWetCondition(c), c).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/philiprutberg/Development/homelab/glass-cards && npx vitest run --environment jsdom test/weather-model.test.ts`
Expected: FAIL — cannot resolve `../src/hub/weather-model`.

- [ ] **Step 3: Write the implementation**

Create `src/hub/weather-model.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --environment jsdom test/weather-model.test.ts`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add src/hub/weather-model.ts test/weather-model.test.ts
git commit -m "feat(hub): weather-model — scenes, sky palettes, forecast parsing, precip hint"
```

---

### Task 2: Forecast fetch + settings infrastructure

**Files:**
- Modify: `src/types.ts` (add `callWS` to `HomeAssistant`)
- Create: `src/hub/weather-forecast.ts`
- Create: `src/hub/weather-settings.ts`
- Test: `test/weather-infra.test.ts`

**Interfaces:**
- Consumes: `HomeAssistant` from `src/types.ts`.
- Produces (used by Tasks 3–5):
  - `fetchForecasts(hass: HomeAssistant, entityId: string, type: 'hourly' | 'daily'): Promise<unknown[] | null>` — raw forecast array (callers parse with `parseHourly`/`parseDaily`), cached 15 min per `entity:type`, `null` on error.
  - `clearForecastCache(): void` — test/debug helper.
  - `getWeatherBgEnabled(): boolean` / `setWeatherBgEnabled(on: boolean): void` — localStorage `glass-hub-weather-bg`, default `true`.
  - `installForceHook(): void` — reads `?weather=` and defines `window.__hubForceWeather(condition | null)`; both set the override and dispatch `hub-weather-force` on `window`.
  - `getForcedCondition(): string | null`

- [ ] **Step 1: Write the failing test**

Create `test/weather-infra.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchForecasts, clearForecastCache } from '../src/hub/weather-forecast';
import {
  getWeatherBgEnabled,
  setWeatherBgEnabled,
  installForceHook,
  getForcedCondition,
} from '../src/hub/weather-settings';
import type { HomeAssistant } from '../src/types';

function fakeHass(callWS: (msg: unknown) => Promise<unknown>): HomeAssistant {
  return { callWS } as unknown as HomeAssistant;
}

describe('fetchForecasts', () => {
  beforeEach(() => {
    clearForecastCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('calls weather.get_forecasts over WS and unwraps the forecast array', async () => {
    const ws = vi.fn().mockResolvedValue({
      response: { 'weather.forecast_home': { forecast: [{ temperature: 20 }] } },
    });
    const out = await fetchForecasts(fakeHass(ws), 'weather.forecast_home', 'hourly');
    expect(out).toEqual([{ temperature: 20 }]);
    expect(ws).toHaveBeenCalledWith({
      type: 'call_service',
      domain: 'weather',
      service: 'get_forecasts',
      service_data: { type: 'hourly' },
      target: { entity_id: 'weather.forecast_home' },
      return_response: true,
    });
  });

  it('caches per entity+type for 15 minutes', async () => {
    const ws = vi.fn().mockResolvedValue({ response: { 'weather.x': { forecast: [] } } });
    const hass = fakeHass(ws);
    await fetchForecasts(hass, 'weather.x', 'hourly');
    await fetchForecasts(hass, 'weather.x', 'hourly');
    expect(ws).toHaveBeenCalledTimes(1);
    await fetchForecasts(hass, 'weather.x', 'daily');
    expect(ws).toHaveBeenCalledTimes(2);          // different type → new call
    vi.advanceTimersByTime(16 * 60_000);
    await fetchForecasts(hass, 'weather.x', 'hourly');
    expect(ws).toHaveBeenCalledTimes(3);          // TTL expired → refetch
  });

  it('returns null on WS error and does not cache the failure', async () => {
    const ws = vi.fn().mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ response: { 'weather.x': { forecast: [1] } } });
    const hass = fakeHass(ws);
    expect(await fetchForecasts(hass, 'weather.x', 'hourly')).toBeNull();
    expect(await fetchForecasts(hass, 'weather.x', 'hourly')).toEqual([1]);
  });
});

describe('weather-settings', () => {
  beforeEach(() => localStorage.clear());

  it('bg enabled defaults to true and round-trips', () => {
    expect(getWeatherBgEnabled()).toBe(true);
    setWeatherBgEnabled(false);
    expect(getWeatherBgEnabled()).toBe(false);
    setWeatherBgEnabled(true);
    expect(getWeatherBgEnabled()).toBe(true);
  });

  it('force hook: window function sets override and fires event', () => {
    installForceHook();
    const seen: unknown[] = [];
    window.addEventListener('hub-weather-force', (e) => seen.push(e));
    (window as unknown as { __hubForceWeather: (c: string | null) => void })
      .__hubForceWeather('pouring');
    expect(getForcedCondition()).toBe('pouring');
    (window as unknown as { __hubForceWeather: (c: string | null) => void })
      .__hubForceWeather(null);
    expect(getForcedCondition()).toBeNull();
    expect(seen).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --environment jsdom test/weather-infra.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Add `callWS` to the `HomeAssistant` interface**

In `src/types.ts`, after the `callService(...)` member of `interface HomeAssistant`, add:

```ts
  callWS<T>(msg: { type: string } & Record<string, unknown>): Promise<T>;
```

- [ ] **Step 4: Write `src/hub/weather-forecast.ts`**

```ts
import type { HomeAssistant } from '../types.js';

/**
 * One-shot `weather.get_forecasts` over the HA websocket, cached 15 minutes
 * per entity+type. Errors resolve to null (callers degrade gracefully) and
 * are never cached.
 */

const TTL_MS = 15 * 60_000;

interface CacheEntry { at: number; data: unknown[] }
const cache = new Map<string, CacheEntry>();

interface GetForecastsResponse {
  response?: Record<string, { forecast?: unknown[] }>;
}

export async function fetchForecasts(
  hass: HomeAssistant,
  entityId: string,
  type: 'hourly' | 'daily',
): Promise<unknown[] | null> {
  const key = `${entityId}:${type}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  try {
    const resp = await hass.callWS<GetForecastsResponse>({
      type: 'call_service',
      domain: 'weather',
      service: 'get_forecasts',
      service_data: { type },
      target: { entity_id: entityId },
      return_response: true,
    });
    const data = resp?.response?.[entityId]?.forecast ?? [];
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

export function clearForecastCache(): void {
  cache.clear();
}
```

- [ ] **Step 5: Write `src/hub/weather-settings.ts`**

```ts
/**
 * Weather-background toggle (localStorage, same pattern as the theme
 * override) and the debug force-override used for visual verification:
 * `?weather=pouring` or `window.__hubForceWeather('snowy')`.
 */

const BG_KEY = 'glass-hub-weather-bg';

export function getWeatherBgEnabled(): boolean {
  return localStorage.getItem(BG_KEY) !== 'off';
}

export function setWeatherBgEnabled(on: boolean): void {
  localStorage.setItem(BG_KEY, on ? 'on' : 'off');
}

let forced: string | null = null;

export function getForcedCondition(): string | null {
  return forced;
}

export function installForceHook(): void {
  const q = new URLSearchParams(location.search).get('weather');
  if (q) forced = q;
  (window as unknown as { __hubForceWeather: (c: string | null) => void }).__hubForceWeather = (
    c: string | null,
  ) => {
    forced = c;
    window.dispatchEvent(new CustomEvent('hub-weather-force'));
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run --environment jsdom test/weather-infra.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/hub/weather-forecast.ts src/hub/weather-settings.ts test/weather-infra.test.ts
git commit -m "feat(hub): forecast fetch via callWS with 15-min cache; weather bg setting + force hook"
```

---

### Task 3: Weather icons + clock hero upgrade

**Files:**
- Create: `src/hub/widgets/weather-icons.ts`
- Modify: `src/hub/widgets/hub-clock.ts` (full rewrite below)

**Interfaces:**
- Consumes: `fetchForecasts` (Task 2), `parseHourly`, `parseDaily`, `todayRange`, `precipHint` (Task 1), `getForcedCondition` (Task 2).
- Produces:
  - `weatherIcon(condition: string, night: boolean): TemplateResult` from `weather-icons.ts` (used again by the popup in Task 4).
  - `hub-clock` dispatches `hub-weather-open` (bubbles, composed) on tap — handled by `glass-hub` in Task 4.

- [ ] **Step 1: Create `src/hub/widgets/weather-icons.ts`**

Line-style SVGs matching the hub's icon look (viewBox 24, stroke 1.8, `currentColor`):

```ts
import { svg, type TemplateResult } from 'lit';

/** Line-style weather glyphs, 24px viewBox, stroke 1.8, currentColor. */

const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const sun = svg`<svg viewBox="0 0 24 24" ${S}>
  <circle cx="12" cy="12" r="4.2"></circle>
  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M5 19l1.6-1.6M17.4 6.6L19 5"></path>
</svg>`;

const moon = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z"></path>
</svg>`;

const cloud = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 17.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
</svg>`;

const cloudSun = svg`<svg viewBox="0 0 24 24" ${S}>
  <circle cx="17" cy="7" r="2.8"></circle>
  <path d="M17 2.6v1M21.4 7h1M20.1 3.9l-.7.7M20.1 10.1l-.7-.7"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`;

const cloudMoon = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M20.6 8.6a4 4 0 0 1-5-5 4 4 0 1 0 5 5z"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`;

const rain = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M12.5 17.5l-1 2.5M17 17.5l-1 2.5"></path>
</svg>`;

const pour = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M7 16l-1.4 3.6M10.5 16l-1.4 3.6M14 16l-1.4 3.6M17.5 16l-1.4 3.6"></path>
</svg>`;

const snow = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18.2v.01M12 19.6v.01M16 18.2v.01M10 21v.01M14 21v.01" stroke-width="2.4"></path>
</svg>`;

const sleet = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M15.5 17.5l-1 2.5"></path>
  <path d="M11.8 20v.01M17.5 20v.01" stroke-width="2.4"></path>
</svg>`;

const bolt = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
</svg>`;

const boltRain = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
  <path d="M6.6 16.5l-.9 2.3M17 16.5l-.9 2.3"></path>
</svg>`;

const fog = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 12.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.4 7.4"></path>
  <path d="M4.5 15.5h15M6.5 18.5h11M8.5 21.5h7"></path>
</svg>`;

const wind = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M3.5 9h11a2.6 2.6 0 1 0-2.6-2.6"></path>
  <path d="M3.5 13.5h15.2a2.6 2.6 0 1 1-2.6 2.6"></path>
  <path d="M3.5 18h7.4a2.2 2.2 0 1 1-2.2 2.2"></path>
</svg>`;

const hailIcon = svg`<svg viewBox="0 0 24 24" ${S}>
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18v.01M12 18v.01M16 18v.01M10 21v.01M14 21v.01" stroke-width="2.6"></path>
</svg>`;

const MAP: Record<string, { day: TemplateResult; night?: TemplateResult }> = {
  sunny: { day: sun, night: moon },
  'clear-night': { day: moon },
  partlycloudy: { day: cloudSun, night: cloudMoon },
  cloudy: { day: cloud },
  rainy: { day: rain },
  pouring: { day: pour },
  snowy: { day: snow },
  'snowy-rainy': { day: sleet },
  lightning: { day: bolt },
  'lightning-rainy': { day: boltRain },
  fog: { day: fog },
  hail: { day: hailIcon },
  windy: { day: wind },
  'windy-variant': { day: wind },
};

export function weatherIcon(condition: string, night: boolean): TemplateResult {
  const entry = MAP[condition] ?? MAP.cloudy;
  return night && entry.night ? entry.night : entry.day;
}
```

- [ ] **Step 2: Rewrite `src/hub/widgets/hub-clock.ts` as the clock+weather hero**

Replace the file contents with:

```ts
import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { weatherIcon } from './weather-icons.js';
import { fetchForecasts } from '../weather-forecast.js';
import { getForcedCondition } from '../weather-settings.js';
import {
  parseHourly,
  parseDaily,
  todayRange,
  precipHint,
  type ForecastHour,
  type ForecastDay,
} from '../weather-model.js';

const DATE_FMT = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const REFRESH_MS = 15 * 60_000;

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Hem's clock+weather hero. Time and date as before; below them the current
 * temp with condition icon, today's hi/lo, and (when relevant) a one-line
 * precipitation hint. Tapping anywhere opens the weather popup.
 */
export class HubClock extends GlassBaseElement {
  @property({ attribute: false }) weatherEntity!: string;

  @state() private _now = new Date();
  @state() private _hours: ForecastHour[] = [];
  @state() private _days: ForecastDay[] = [];

  private _interval?: number;
  private _forecastTimer?: number;
  private _fetchedFor = '';

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .time {
        font-family: var(--hub-font-display);
        font-weight: 200;
        font-size: clamp(56px, 7vw, 96px);
        letter-spacing: -2px;
        line-height: 1;
        color: var(--hub-text);
      }
      .date {
        font-size: 13px;
        margin-top: 6px;
        color: var(--hub-text-muted);
        font-family: var(--hub-font-body);
      }
      .wx {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      .wx svg {
        width: 30px;
        height: 30px;
        color: var(--hub-text-muted);
      }
      .wx-temp {
        font: 300 30px var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .wx-range {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .hint {
        margin-top: 5px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-teal);
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = new Date();
    }, 30000);
    this._forecastTimer = window.setInterval(() => this._loadForecasts(), REFRESH_MS);
    this.addEventListener('click', this._open);
    window.addEventListener('hub-weather-force', this._onForce);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) clearInterval(this._interval);
    if (this._forecastTimer !== undefined) clearInterval(this._forecastTimer);
    this._interval = this._forecastTimer = undefined;
    this.removeEventListener('click', this._open);
    window.removeEventListener('hub-weather-force', this._onForce);
  }

  updated(changed: PropertyValues): void {
    // First fetch once hass + entity are both available (or entity changed).
    if ((changed.has('hass') || changed.has('weatherEntity')) && this.hass && this.weatherEntity) {
      if (this._fetchedFor !== this.weatherEntity) {
        this._fetchedFor = this.weatherEntity;
        void this._loadForecasts();
      }
    }
  }

  private _onForce = (): void => {
    this.requestUpdate();
  };

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-weather-open', { bubbles: true, composed: true }));
  };

  private async _loadForecasts(): Promise<void> {
    if (!this.hass || !this.weatherEntity) return;
    const [hourly, daily] = await Promise.all([
      fetchForecasts(this.hass, this.weatherEntity, 'hourly'),
      fetchForecasts(this.hass, this.weatherEntity, 'daily'),
    ]);
    if (hourly) this._hours = parseHourly(hourly);
    if (daily) this._days = parseDaily(daily);
  }

  private get _timeStr(): string {
    const hh = String(this._now.getHours()).padStart(2, '0');
    const mm = String(this._now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private get _isNight(): boolean {
    return this.hass?.states['sun.sun']?.state === 'below_horizon';
  }

  render() {
    const entity = this.weatherEntity ? this.getEntity(this.weatherEntity) : undefined;
    const condition = getForcedCondition() ?? entity?.state ?? '';
    const temp = entity?.attributes.temperature;
    const range = todayRange(this._days);
    const hint = precipHint(this._hours, this._now.getTime());
    return html`
      <div class="time">${this._timeStr}</div>
      <div class="date">${capitalize(DATE_FMT.format(this._now))}</div>
      ${entity && typeof temp === 'number'
        ? html`
            <div class="wx">
              ${weatherIcon(condition, this._isNight)}
              <span class="wx-temp">${Math.round(temp)}°</span>
              ${range
                ? html`<span class="wx-range">
                    <span>↑ ${Math.round(range.high)}°</span>
                    <span>↓ ${Math.round(range.low)}°</span>
                  </span>`
                : nothing}
            </div>
            ${hint ? html`<div class="hint">${hint}</div>` : nothing}
          `
        : nothing}
    `;
  }
}

customElements.define('hub-clock', HubClock);
```

- [ ] **Step 3: Typecheck + run full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean typecheck; all existing tests still PASS (no test asserts the old clock weather-suffix format).

- [ ] **Step 4: Commit**

```bash
git add src/hub/widgets/weather-icons.ts src/hub/widgets/hub-clock.ts
git commit -m "feat(hub): clock hero — temp, condition icon, hi/lo, precip hint, tap-to-open"
```

---

### Task 4: Weather popup + glass-hub wiring + config + Stockholm entity

**Files:**
- Create: `src/hub/widgets/hub-weather-popup.ts`
- Modify: `src/hub/hub-config.ts` (add `weather_locations`)
- Modify: `src/hub/glass-hub.ts` (open/close wiring, bg-toggle state, force hook install)
- Modify: `scripts/hub-config.mjs` (add `weather_locations`)

**Interfaces:**
- Consumes: `weatherIcon` (Task 3), `fetchForecasts` (Task 2), `parseHourly`/`parseDaily`/`weekRange` (Task 1), `getWeatherBgEnabled`/`setWeatherBgEnabled`/`installForceHook` (Task 2).
- Produces:
  - `hub-weather-popup` element with props `hass`, `config`, listening pattern identical to `hub-transit-popup`; dispatches `hub-popup-close` and `hub-weather-bg-toggle` (`detail: { on: boolean }`, bubbles, composed).
  - `HubConfig.weather_locations?: { entity: string; name: string }[]`
  - `glass-hub` state `_weatherBgOn: boolean` passed to `hub-home-page` as `.weatherBg` (consumed in Task 5) and `.pageActive` boolean (true when Hem is the settled page).

- [ ] **Step 1: Create the Stockholm weather entity in HA (Met.no config flow via API)**

```bash
cd /Users/philiprutberg/Development/homelab
HA_TOKEN=$(cat .claude/ha-token)
# 1. Start a met.no config flow
FLOW=$(curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/config/config_entries/flow \
  -d '{"handler":"met","show_advanced_options":false}')
echo "$FLOW"   # note "flow_id" and the step schema
FLOW_ID=$(echo "$FLOW" | jq -r .flow_id)
# 2. Submit the location step (field names per the schema echoed above; expected: name/latitude/longitude/elevation)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  "https://home.rutberg.dev/api/config/config_entries/flow/$FLOW_ID" \
  -d '{"name":"Stockholm","latitude":59.3293,"longitude":18.0686,"elevation":28}'
# 3. Verify the entity exists (met.no may take a few seconds to fetch)
sleep 10
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states \
  | jq -r '.[].entity_id' | grep '^weather\.'
```

Expected: `weather.forecast_home` and a new `weather.stockholm` (exact id from the output — use whatever appears; if the flow API rejects the payload, fall back to asking Philip to add the Met.no location "Stockholm" in HA's UI: Inställningar → Enheter & tjänster → Met.no → Lägg till post). Record the exact entity id for Step 5.

- [ ] **Step 2: Add `weather_locations` to `HubConfig`**

In `src/hub/hub-config.ts`, after the `weather_entity: string;` line add:

```ts
  weather_locations?: { entity: string; name: string }[]; // popup location pills; first = primary
```

- [ ] **Step 3: Create `src/hub/widgets/hub-weather-popup.ts`**

```ts
import { html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { weatherIcon } from './weather-icons.js';
import { fetchForecasts } from '../weather-forecast.js';
import { getWeatherBgEnabled, setWeatherBgEnabled } from '../weather-settings.js';
import {
  parseHourly,
  parseDaily,
  weekRange,
  type ForecastHour,
  type ForecastDay,
} from '../weather-model.js';
import type { HubConfig } from '../hub-config.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

const DAY_FMT = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' });
const MAX_HOURS = 24;
const MAX_DAYS = 7;

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Tap-the-clock weather popup: location pills (Nynäshamn/Stockholm), current
 * conditions hero, 24 h hourly strip, Apple-style 7-day list with relative
 * temp-range bars, and the animated-background toggle.
 */
export class HubWeatherPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  @state() private _loc = 0;
  @state() private _hours: ForecastHour[] = [];
  @state() private _days: ForecastDay[] = [];
  @state() private _bgOn = getWeatherBgEnabled();

  private _loadedFor = '';

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 620px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .pills {
        display: flex;
        gap: 6px;
      }
      .pill {
        padding: 7px 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease, border-color 150ms ease;
      }
      .pill.active {
        color: var(--hub-text);
        border-color: var(--hub-text-dim);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg { width: 22px; height: 22px; }

      /* ── Current hero ───────────────────────────────────── */
      .hero {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 4px 0 16px;
      }
      .hero svg {
        width: 52px;
        height: 52px;
        color: var(--hub-text-muted);
      }
      .hero-temp {
        font: 200 56px var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        line-height: 1;
      }
      .hero-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .hero-cond {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }

      .section {
        padding-top: 14px;
        border-top: 1px solid var(--hub-card-border);
      }
      .section + .section { margin-top: 14px; }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 10px;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }

      /* ── Hourly strip ───────────────────────────────────── */
      .hours {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
      }
      .hour {
        flex: 0 0 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-variant-numeric: tabular-nums;
      }
      .hour-t { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
      .hour svg { width: 22px; height: 22px; color: var(--hub-text-muted); }
      .hour-temp { font: 600 14px var(--hub-font-body); color: var(--hub-text); }
      .hour-precip { font: 500 11px var(--hub-font-body); color: var(--hub-teal); min-height: 13px; }

      /* ── Daily list ─────────────────────────────────────── */
      .day-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 40px;
      }
      .day-name {
        width: 44px;
        flex-shrink: 0;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
      }
      .day-row svg { width: 24px; height: 24px; color: var(--hub-text-muted); flex-shrink: 0; }
      .day-prob {
        width: 40px;
        flex-shrink: 0;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-teal);
        font-variant-numeric: tabular-nums;
      }
      .day-lo, .day-hi {
        width: 34px;
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        font-variant-numeric: tabular-nums;
      }
      .day-lo { color: var(--hub-text-dim); text-align: right; }
      .day-hi { color: var(--hub-text); }
      .day-bar {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        position: relative;
        overflow: hidden;
      }
      .day-bar-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--hub-teal), var(--hub-amber));
      }

      /* ── Background toggle ──────────────────────────────── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 44px;
      }
      .toggle-label { font: 500 14px var(--hub-font-body); color: var(--hub-text); }
      .switch {
        position: relative;
        width: 46px;
        height: 28px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        background: var(--hub-track);
        transition: background 200ms ease;
        -webkit-tap-highlight-color: transparent;
      }
      .switch.on { background: var(--hub-amber); }
      .switch::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--hub-card);
        transition: transform 200ms ease;
      }
      .switch.on::after { transform: translateX(18px); }
    `,
  ];

  private get _locations(): { entity: string; name: string }[] {
    const cfg = this.config;
    if (cfg?.weather_locations?.length) return cfg.weather_locations;
    return cfg?.weather_entity ? [{ entity: cfg.weather_entity, name: 'Hem' }] : [];
  }

  updated(changed: PropertyValues): void {
    const entity = this._locations[this._loc]?.entity;
    if (!entity || !this.hass) return;
    if ((changed.has('hass') || changed.has('config')) && this._loadedFor !== entity) {
      void this._load(entity);
    }
  }

  private async _load(entity: string): Promise<void> {
    this._loadedFor = entity;
    const [hourly, daily] = await Promise.all([
      fetchForecasts(this.hass, entity, 'hourly'),
      fetchForecasts(this.hass, entity, 'daily'),
    ]);
    if (this._loadedFor !== entity) return; // location switched mid-flight
    this._hours = hourly ? parseHourly(hourly) : [];
    this._days = daily ? parseDaily(daily) : [];
  }

  private _pickLoc(i: number): void {
    if (i === this._loc) return;
    this._loc = i;
    this._hours = [];
    this._days = [];
    const entity = this._locations[i]?.entity;
    if (entity) void this._load(entity);
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _toggleBg(): void {
    this._bgOn = !this._bgOn;
    setWeatherBgEnabled(this._bgOn);
    this.dispatchEvent(
      new CustomEvent('hub-weather-bg-toggle', {
        detail: { on: this._bgOn },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get _isNight(): boolean {
    return this.hass?.states['sun.sun']?.state === 'below_horizon';
  }

  private _hero(): TemplateResult | typeof nothing {
    const entity = this.getEntity(this._locations[this._loc]?.entity ?? '');
    if (!entity) return nothing;
    const temp = entity.attributes.temperature;
    const feels = entity.attributes.apparent_temperature;
    const wind = entity.attributes.wind_speed;
    const windUnit = (entity.attributes.wind_speed_unit as string) ?? 'km/h';
    return html`
      <div class="hero">
        ${weatherIcon(entity.state, this._isNight)}
        <span class="hero-temp">${typeof temp === 'number' ? Math.round(temp) : '–'}°</span>
        <span class="hero-meta">
          <span class="hero-cond">${this.hass.formatEntityState(entity)}</span>
          ${typeof feels === 'number' ? html`<span>Känns som ${Math.round(feels)}°</span>` : nothing}
          ${typeof wind === 'number' ? html`<span>Vind ${Math.round(wind)} ${windUnit}</span>` : nothing}
        </span>
      </div>
    `;
  }

  private _hourly(): TemplateResult {
    const now = Date.now() - 3600_000; // keep the current (partial) hour
    const hours = this._hours.filter((h) => h.ts >= now).slice(0, MAX_HOURS);
    return html`
      <div class="section">
        <div class="sec-title">Idag</div>
        ${hours.length
          ? html`<div class="hours">
              ${hours.map(
                (h) => html`
                  <div class="hour">
                    <span class="hour-t">${String(new Date(h.ts).getHours()).padStart(2, '0')}</span>
                    ${weatherIcon(h.condition, this._isNight)}
                    <span class="hour-temp">${Math.round(h.temp)}°</span>
                    <span class="hour-precip">${h.precip >= 0.1 ? `${h.precip.toFixed(1)}` : ''}</span>
                  </div>
                `,
              )}
            </div>`
          : html`<div class="empty">Ingen timprognos</div>`}
      </div>
    `;
  }

  private _daily(): TemplateResult {
    const days = this._days.slice(0, MAX_DAYS);
    const range = weekRange(days);
    const span = range ? Math.max(range.max - range.min, 1) : 1;
    return html`
      <div class="section">
        <div class="sec-title">7 dagar</div>
        ${days.length && range
          ? days.map((d, i) => {
              const lo = d.low ?? d.high;
              const left = ((lo - range.min) / span) * 100;
              const width = Math.max(((d.high - lo) / span) * 100, 4);
              return html`
                <div class="day-row">
                  <span class="day-name">${i === 0 ? 'Idag' : capitalize(DAY_FMT.format(new Date(d.ts)))}</span>
                  ${weatherIcon(d.condition, false)}
                  <span class="day-prob">${d.precipProb !== null && d.precipProb >= 20 ? `${Math.round(d.precipProb)}%` : ''}</span>
                  <span class="day-lo">${d.low !== null ? `${Math.round(d.low)}°` : ''}</span>
                  <span class="day-bar">
                    <span class="day-bar-fill" style="left:${left}%;width:${width}%"></span>
                  </span>
                  <span class="day-hi">${Math.round(d.high)}°</span>
                </div>
              `;
            })
          : html`<div class="empty">Ingen veckoprognos</div>`}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const locs = this._locations;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Väder">
          <div class="head">
            <div class="pills">
              ${locs.map(
                (l, i) => html`
                  <button class="pill ${i === this._loc ? 'active' : ''}" @click=${() => this._pickLoc(i)}>
                    ${l.name}
                  </button>
                `,
              )}
            </div>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${CLOSE_ICON}</button>
          </div>
          ${this._hero()}
          ${this._hourly()}
          ${this._daily()}
          <div class="section">
            <div class="toggle-row">
              <span class="toggle-label">Animerad bakgrund</span>
              <button
                class="switch ${this._bgOn ? 'on' : ''}"
                role="switch"
                aria-checked=${this._bgOn}
                aria-label="Animerad bakgrund"
                @click=${() => this._toggleBg()}
              ></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-weather-popup', HubWeatherPopup);
```

- [ ] **Step 4: Wire into `src/hub/glass-hub.ts`**

Apply these exact edits:

1. Imports — after `import './widgets/hub-transit-popup.js';` add:

```ts
import './widgets/hub-weather-popup.js';
```

and after the theme-controller import block add:

```ts
import { getWeatherBgEnabled, setWeatherBgEnabled, installForceHook } from './weather-settings.js';
```

2. State — after `@state() private _openTransit = false;` add:

```ts
  @state() private _openWeather = false;
  @state() private _weatherBgOn = getWeatherBgEnabled();
```

3. `connectedCallback()` — after `this._startKioskDrawerShim();` add:

```ts
    installForceHook();
```

and alongside the other `addEventListener` lines add:

```ts
    this.addEventListener('hub-weather-open', this._onWeatherOpen);
    this.addEventListener('hub-weather-bg-toggle', this._onWeatherBgToggle as EventListener);
```

4. `disconnectedCallback()` — matching removals:

```ts
    this.removeEventListener('hub-weather-open', this._onWeatherOpen);
    this.removeEventListener('hub-weather-bg-toggle', this._onWeatherBgToggle as EventListener);
```

5. Handlers — after `_onTransitOpen` add:

```ts
  private _onWeatherOpen = (): void => {
    this._openWeather = true;
  };

  private _onWeatherBgToggle = (e: CustomEvent<{ on: boolean }>): void => {
    this._weatherBgOn = e.detail?.on ?? getWeatherBgEnabled();
    setWeatherBgEnabled(this._weatherBgOn);
  };
```

6. `_onPopupClose` — add `this._openWeather = false;`.

7. Render — replace the `hem` page branch with:

```ts
              ${id === 'hem'
                ? html`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                    .theme=${this.theme}
                    .weatherBg=${this._weatherBgOn}
                    .pageActive=${pages[this._page] === 'hem'}
                  ></hub-home-page>`
```

8. Popup block — after the `_openTransit` popup render add:

```ts
      ${this._openWeather
        ? html`<hub-weather-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-weather-popup>`
        : nothing}
```

Note: `hub-home-page` doesn't declare `theme`/`weatherBg`/`pageActive` yet — that lands in Task 5. Lit ignores unknown properties set via `.prop=` bindings on defined elements only if declared; setting them early is harmless (they become plain instance fields).

- [ ] **Step 5: Add locations to `scripts/hub-config.mjs`**

After the `weather_entity: 'weather.forecast_home',` line add (using the exact Stockholm entity id from Step 1):

```js
        weather_locations: [
          { entity: 'weather.forecast_home', name: 'Nynäshamn' },
          { entity: 'weather.stockholm', name: 'Stockholm' },
        ],
```

- [ ] **Step 6: Typecheck + full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: clean; all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/hub/widgets/hub-weather-popup.ts src/hub/hub-config.ts src/hub/glass-hub.ts scripts/hub-config.mjs
git commit -m "feat(hub): weather popup — location pills, hourly strip, 7-day bars, bg toggle"
```

---

### Task 5: Animated weather background engine + Hem integration

**Files:**
- Create: `src/hub/widgets/hub-weather-bg.ts`
- Modify: `src/hub/pages/hub-home-page.ts` (mount bg, new props, stacking)

**Interfaces:**
- Consumes: `conditionScene`, `skyStops`, `elevBand`, `SceneSpec` (Task 1); `getForcedCondition` (Task 2); `HubTheme` from `theme-controller.ts`.
- Produces: `hub-weather-bg` element with props `entity: string`, `theme: HubTheme`, `active: boolean` (+ inherited `hass`). Logs `[weather-bg] start` / `[weather-bg] stop` on loop transitions.

- [ ] **Step 1: Create `src/hub/widgets/hub-weather-bg.ts`**

```ts
import { html, css, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import {
  conditionScene,
  skyStops,
  elevBand,
  type SceneSpec,
} from '../weather-model.js';
import { getForcedCondition } from '../weather-settings.js';
import type { HubTheme } from '../theme-controller.js';

const DPR_CAP = 1.5;
const MAX_DT = 0.05; // clamp frame delta (s) so tab-switch jumps don't teleport particles

// Parallax depth layers: far → near.
const DEPTH = [
  { scale: 0.55, alpha: 0.3, speed: 0.6 },
  { scale: 0.8, alpha: 0.55, speed: 0.85 },
  { scale: 1.15, alpha: 0.9, speed: 1.15 },
];

interface Drop { x: number; y: number; layer: number }
interface Flake { x: number; y: number; r: number; phase: number; rot: number; rotSpd: number; layer: number }
interface Stone { x: number; y: number; vy: number; vx: number; r: number; bounced: boolean }
interface Splash { x: number; y: number; r: number; life: number }
interface Cloud { x: number; y: number; scale: number; spd: number; alpha: number }
interface Star { x: number; y: number; r: number; phase: number }

/**
 * Full-bleed animated weather scene behind the Hem page: CSS gradient sky
 * (crossfaded on change) + one particle canvas. The rAF loop runs ONLY while
 * `active` (Hem is the settled page), the document is visible, and the
 * element is connected — transitions are logged for verification.
 */
export class HubWeatherBg extends GlassBaseElement {
  @property({ attribute: false }) entity!: string;
  @property({ attribute: false }) theme: HubTheme = 'natt';
  @property({ attribute: false }) active = false;

  // Two stacked sky layers for gradient crossfades.
  @state() private _skyA = '';
  @state() private _skyB = '';
  @state() private _frontA = true;

  private _canvas?: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;
  private _ro?: ResizeObserver;
  private _w = 0; // CSS px
  private _h = 0;
  private _dpr = 1;

  private _running = false;
  private _raf = 0;
  private _last = 0;
  private _t = 0; // scene clock (s)

  private _scene: SceneSpec = conditionScene('cloudy');
  private _sceneKey = '';

  private _drops: Drop[] = [];
  private _flakes: Flake[] = [];
  private _stones: Stone[] = [];
  private _splashes: Splash[] = [];
  private _clouds: Cloud[] = [];
  private _stars: Star[] = [];
  private _fogOffsets = [0, 0, 0];
  private _cloudSprite?: HTMLCanvasElement;
  private _flakeSprite?: HTMLCanvasElement;
  private _flash = 0; // lightning envelope 0..1
  private _nextFlash = 0;

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .sky {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s ease;
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('hub-weather-force', this._onForce);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('hub-weather-force', this._onForce);
    this._ro?.disconnect();
    this._ro = undefined;
    this._stopLoop();
  }

  firstUpdated(): void {
    this._canvas = this.renderRoot.querySelector('canvas') ?? undefined;
    this._ctx = this._canvas?.getContext('2d') ?? undefined;
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this);
    this._resize();
  }

  updated(changed: PropertyValues): void {
    this._syncScene();
    if (changed.has('active')) this._maybeRun();
  }

  private _onVisibility = (): void => this._maybeRun();
  private _onForce = (): void => this.requestUpdate();

  private get _condition(): string {
    return getForcedCondition() ?? this.getEntity(this.entity)?.state ?? 'cloudy';
  }

  private get _elevation(): number | null {
    const e = this.hass?.states['sun.sun']?.attributes?.elevation;
    return typeof e === 'number' ? e : null;
  }

  // ── Scene lifecycle ──────────────────────────────────────
  private _syncScene(): void {
    const band = elevBand(this._elevation);
    const condition = this._condition;
    const key = `${condition}|${this.theme}|${band}`;
    if (key === this._sceneKey) return;
    this._sceneKey = key;
    this._scene = conditionScene(condition);
    const [top, mid, bot] = skyStops(this._scene.sky, this.theme, band);
    const cssBg = `background:linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bot} 100%)`;
    // Crossfade: paint the back layer, then flip which layer is in front.
    if (this._frontA) {
      this._skyB = cssBg;
      this._frontA = false;
    } else {
      this._skyA = cssBg;
      this._frontA = true;
    }
    this._buildSprites();
    this._buildParticles();
    this._nextFlash = this._t + 2 + Math.random() * 5;
    this._maybeRun();
  }

  private _resize(): void {
    if (!this._canvas) return;
    this._w = this.offsetWidth;
    this._h = this.offsetHeight;
    this._dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this._canvas.width = Math.max(1, Math.round(this._w * this._dpr));
    this._canvas.height = Math.max(1, Math.round(this._h * this._dpr));
    this._buildParticles();
  }

  private get _isNightBand(): boolean {
    return elevBand(this._elevation) === 'night';
  }

  /** Particle counts scale with viewport area (spec counts are per megapixel). */
  private _perMp(n: number): number {
    return Math.round((n * this._w * this._h) / 1_000_000);
  }

  private _buildParticles(): void {
    const s = this._scene;
    const w = this._w;
    const h = this._h;
    if (w === 0 || h === 0) return;
    const rand = Math.random;

    this._drops = Array.from({ length: this._perMp(s.rain) }, () => ({
      x: rand() * w,
      y: rand() * h,
      layer: Math.floor(rand() * DEPTH.length),
    }));
    this._flakes = Array.from({ length: this._perMp(s.snow) }, () => ({
      x: rand() * w,
      y: rand() * h,
      r: 1.5 + rand() * 2.5,
      phase: rand() * Math.PI * 2,
      rot: rand() * Math.PI * 2,
      rotSpd: (rand() - 0.5) * 1.2,
      layer: Math.floor(rand() * DEPTH.length),
    }));
    this._stones = Array.from({ length: this._perMp(s.hail) }, () => ({
      x: rand() * w,
      y: rand() * h,
      vy: 700 + rand() * 300,
      vx: (rand() - 0.5) * 60,
      r: 1.2 + rand() * 1.6,
      bounced: false,
    }));
    const cloudCount = s.clouds > 0 ? Math.round(2 + s.clouds * 5) : 0;
    this._clouds = Array.from({ length: cloudCount }, (_, i) => ({
      x: rand() * w * 1.4 - w * 0.2,
      y: (i / Math.max(cloudCount, 1)) * h * 0.38 + rand() * 30,
      scale: 0.7 + rand() * 0.9,
      spd: 6 + rand() * 10,
      alpha: 0.5 + rand() * 0.5,
    }));
    this._stars = s.stars
      ? Array.from({ length: 90 }, () => ({
          x: rand() * w,
          y: rand() * h * 0.7,
          r: 0.5 + rand() * 1.1,
          phase: rand() * Math.PI * 2,
        }))
      : [];
    this._splashes = [];
  }

  private _buildSprites(): void {
    // Cloud blob: overlapping radial gradients, pre-blurred by their falloff.
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d')!;
    const natt = this.theme === 'natt';
    const stormy = this._scene.sky === 'storm';
    const [r, gg, b] = natt ? [26, 30, 40] : stormy ? [120, 130, 142] : [255, 255, 255];
    for (let i = 0; i < 9; i++) {
      const x = 80 + Math.random() * 352;
      const y = 90 + Math.random() * 80;
      const rad = 55 + Math.random() * 70;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(${r},${gg},${b},${natt ? 0.5 : 0.55})`);
      grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 256);
    }
    this._cloudSprite = c;

    // Snowflake: soft disc + faint arms so rotation is visible.
    const f = document.createElement('canvas');
    f.width = 32;
    f.height = 32;
    const fg = f.getContext('2d')!;
    const disc = fg.createRadialGradient(16, 16, 0, 16, 16, 14);
    disc.addColorStop(0, 'rgba(255,255,255,0.9)');
    disc.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    disc.addColorStop(1, 'rgba(255,255,255,0)');
    fg.fillStyle = disc;
    fg.fillRect(0, 0, 32, 32);
    fg.strokeStyle = 'rgba(255,255,255,0.5)';
    fg.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      fg.save();
      fg.translate(16, 16);
      fg.rotate((i * Math.PI) / 3);
      fg.beginPath();
      fg.moveTo(-7, 0);
      fg.lineTo(7, 0);
      fg.stroke();
      fg.restore();
    }
    this._flakeSprite = f;
  }

  // ── Loop control ─────────────────────────────────────────
  private _maybeRun(): void {
    const hasWork =
      this._scene.rain > 0 || this._scene.snow > 0 || this._scene.hail > 0 ||
      this._scene.clouds > 0 || this._scene.stars || this._scene.sun ||
      this._scene.fog || this._scene.lightning;
    const should =
      this.active && hasWork && this.isConnected && document.visibilityState === 'visible';
    if (should && !this._running) {
      this._running = true;
      this._last = performance.now();
      console.debug('[weather-bg] start');
      this._raf = requestAnimationFrame(this._frame);
    } else if (!should && this._running) {
      this._stopLoop();
    }
  }

  private _stopLoop(): void {
    if (!this._running) return;
    this._running = false;
    cancelAnimationFrame(this._raf);
    console.debug('[weather-bg] stop');
  }

  private _frame = (now: number): void => {
    if (!this._running) return;
    const dt = Math.min((now - this._last) / 1000, MAX_DT);
    this._last = now;
    this._t += dt;
    this._draw(dt);
    this._raf = requestAnimationFrame(this._frame);
  };

  // ── Drawing ──────────────────────────────────────────────
  private _draw(dt: number): void {
    const ctx = this._ctx;
    if (!ctx) return;
    const w = this._w;
    const h = this._h;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (this._stars.length && this._isNightBand) this._drawStars(ctx);
    if (this._scene.sun && !this._isNightBand && this.theme === 'dag') this._drawSun(ctx, w, h);
    this._updateFlash(dt);
    if (this._clouds.length) this._drawClouds(ctx, dt, w, h);
    if (this._scene.fog) this._drawFog(ctx, dt, w, h);
    if (this._drops.length) this._drawRain(ctx, dt, w, h);
    if (this._flakes.length) this._drawSnow(ctx, dt, w, h);
    if (this._stones.length) this._drawHail(ctx, dt, w, h);
    if (this._splashes.length) this._drawSplashes(ctx, dt);
    if (this._flash > 0.01) {
      ctx.fillStyle = `rgba(215,225,255,${this._flash * (this.theme === 'natt' ? 0.22 : 0.3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private _drawStars(ctx: CanvasRenderingContext2D): void {
    for (const s of this._stars) {
      const a = 0.25 + 0.5 * Math.abs(Math.sin(this._t * 0.5 + s.phase));
      ctx.fillStyle = `rgba(200,215,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawSun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w * 0.76;
    const cy = h * 0.2;
    const golden = elevBand(this._elevation) === 'golden';
    const rad = Math.min(w, h) * 0.5;
    const pulse = 0.9 + 0.1 * Math.sin(this._t * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, golden ? `rgba(255,170,90,${0.5 * pulse})` : `rgba(255,214,120,${0.55 * pulse})`);
    grad.addColorStop(0.25, golden ? 'rgba(255,170,90,0.18)' : 'rgba(255,214,120,0.2)');
    grad.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Slow-rotating rays.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this._t * 0.02);
    ctx.fillStyle = golden ? 'rgba(255,170,90,0.05)' : 'rgba(255,214,120,0.06)';
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rad * 1.1, -rad * 0.045);
      ctx.lineTo(rad * 1.1, rad * 0.045);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private _drawClouds(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const sprite = this._cloudSprite;
    if (!sprite) return;
    const wind = this._scene.wind;
    for (const c of this._clouds) {
      c.x += c.spd * wind * dt;
      const cw = 512 * c.scale * 0.9;
      if (c.x - cw / 2 > w) c.x = -cw / 2;
      ctx.globalAlpha = c.alpha * (0.35 + this._scene.clouds * 0.5) + this._flash * 0.3;
      ctx.drawImage(sprite, c.x - cw / 2, c.y - (128 * c.scale) / 2, cw, 256 * c.scale * 0.9);
    }
    ctx.globalAlpha = 1;
  }

  private _drawFog(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const natt = this.theme === 'natt';
    const [r, g, b] = natt ? [40, 44, 52] : [225, 228, 230];
    const alphas = natt ? [0.1, 0.14, 0.18] : [0.16, 0.22, 0.28];
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this._fogOffsets[i] = (this._fogOffsets[i] + dir * (4 + i * 3) * dt + w) % w;
      const y = h * (0.35 + i * 0.22);
      const grad = ctx.createLinearGradient(0, y - 70, 0, y + 70);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${alphas[i]})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      // Two copies for a seamless wrap.
      ctx.fillRect(this._fogOffsets[i] - w, y - 70, w, 140);
      ctx.fillRect(this._fogOffsets[i], y - 70, w, 140);
    }
  }

  private _drawRain(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const wind = this._scene.wind;
    const natt = this.theme === 'natt';
    const baseSpd = this._scene.rain > 150 ? 1500 : 1150; // pouring falls harder
    const baseLen = this._scene.rain > 150 ? 30 : 20;
    ctx.lineCap = 'round';
    for (const d of this._drops) {
      const L = DEPTH[d.layer];
      const spd = baseSpd * L.speed;
      const drift = 60 * wind * L.speed;
      d.y += spd * dt;
      d.x += drift * dt;
      if (d.y > h) {
        d.y = -baseLen;
        d.x = Math.random() * w;
        if (d.layer === 2 && Math.random() < 0.25) {
          this._splashes.push({ x: d.x, y: h - 4 - Math.random() * 8, r: 1, life: 1 });
        }
      }
      if (d.x > w) d.x -= w;
      const len = baseLen * L.scale;
      const slant = (drift / spd) * len;
      ctx.strokeStyle = natt
        ? `rgba(150,170,200,${L.alpha * 0.45})`
        : `rgba(235,242,250,${L.alpha * 0.6})`;
      ctx.lineWidth = 1 * L.scale;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - slant, d.y - len);
      ctx.stroke();
    }
  }

  private _drawSnow(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const sprite = this._flakeSprite;
    if (!sprite) return;
    const wind = this._scene.wind;
    for (const f of this._flakes) {
      const L = DEPTH[f.layer];
      f.y += 55 * L.speed * dt;
      f.x += Math.sin(f.phase + this._t * 0.8) * 20 * wind * dt;
      f.rot += f.rotSpd * dt;
      if (f.y > h + 6) {
        f.y = -6;
        f.x = Math.random() * w;
      }
      if (f.x > w + 6) f.x = -6;
      if (f.x < -6) f.x = w + 6;
      const size = f.r * 4 * L.scale;
      ctx.save();
      ctx.globalAlpha = L.alpha * (this.theme === 'natt' ? 0.7 : 0.95);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private _drawHail(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const natt = this.theme === 'natt';
    ctx.fillStyle = natt ? 'rgba(190,205,225,0.7)' : 'rgba(250,252,255,0.9)';
    for (const s of this._stones) {
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      if (s.y > h) {
        if (!s.bounced && Math.random() < 0.5) {
          s.bounced = true;
          s.vy = -s.vy * 0.35;
          s.y = h;
        } else {
          s.y = -4;
          s.x = Math.random() * w;
          s.vy = 700 + Math.random() * 300;
          s.bounced = false;
        }
      } else if (s.bounced) {
        s.vy += 1600 * dt; // gravity pulls the bounce back down
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawSplashes(ctx: CanvasRenderingContext2D, dt: number): void {
    const natt = this.theme === 'natt';
    for (const sp of this._splashes) {
      sp.r += 50 * dt;
      sp.life -= 5 * dt;
      if (sp.life <= 0) continue;
      ctx.strokeStyle = natt
        ? `rgba(150,170,200,${sp.life * 0.2})`
        : `rgba(235,242,250,${sp.life * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    this._splashes = this._splashes.filter((sp) => sp.life > 0);
  }

  private _updateFlash(dt: number): void {
    if (!this._scene.lightning) {
      this._flash = 0;
      return;
    }
    if (this._t >= this._nextFlash) {
      this._flash = 1;
      // Occasional quick double-flash, otherwise a 4–12 s lull.
      this._nextFlash = this._t + (Math.random() < 0.3 ? 0.15 : 4 + Math.random() * 8);
    } else {
      this._flash = Math.max(0, this._flash - dt / 0.4) ** 1.5;
    }
  }

  render() {
    return html`
      <div class="sky" style="${this._skyA};opacity:${this._frontA ? 1 : 0}"></div>
      <div class="sky" style="${this._skyB};opacity:${this._frontA ? 0 : 1}"></div>
      <canvas></canvas>
    `;
  }
}

customElements.define('hub-weather-bg', HubWeatherBg);
```

- [ ] **Step 2: Mount in `src/hub/pages/hub-home-page.ts`**

1. Imports — add:

```ts
import '../widgets/hub-weather-bg.js';
import type { HubTheme } from '../theme-controller.js';
```

2. Props — after `@property({ attribute: false }) config!: HubConfig;` add:

```ts
  @property({ attribute: false }) theme: HubTheme = 'natt';
  @property({ attribute: false }) weatherBg = false;
  @property({ attribute: false }) pageActive = false;
```

3. Styles — in the `:host` block add `position: relative;`, and in the `.page` block add:

```css
        position: relative;
        z-index: 1;
```

4. Render — immediately after the opening `return html\`` and before `<div class="page">`, add:

```ts
      ${this.weatherBg
        ? html`<hub-weather-bg
            .hass=${this.hass}
            .entity=${cfg.weather_entity}
            .theme=${this.theme}
            .active=${this.pageActive}
          ></hub-weather-bg>`
        : nothing}
```

(`nothing` is already imported in this file.)

- [ ] **Step 3: Typecheck + full test suite + build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: all clean; `dist/glass-cards.js` builds.

- [ ] **Step 4: Commit**

```bash
git add src/hub/widgets/hub-weather-bg.ts src/hub/pages/hub-home-page.ts
git commit -m "feat(hub): animated weather background — parallax rain/snow/clouds/sun/lightning/fog canvas engine"
```

---

### Task 6: Build, deploy, smoke-check

**Files:**
- Modify (generated): `dist/glass-cards.js`

- [ ] **Step 1: Full verification commands**

```bash
cd /Users/philiprutberg/Development/homelab/glass-cards
npx tsc --noEmit && npm test && npm run build
```

Expected: typecheck clean, all vitest suites PASS, bundle built.

- [ ] **Step 2: Deploy bundle + dashboard config**

```bash
./scripts/upload.sh          # kubectl cp bundle into the HA pod
node scripts/deploy.mjs hub  # push wall-hub dashboard config (now includes weather_locations)
```

Expected: both scripts exit 0.

- [ ] **Step 3: Commit the rebuilt bundle**

```bash
git add dist/
git commit -m "chore(hub): rebuild bundle — weather tracker"
```

---

### Task 7: Chrome visual verification (mandatory quality gate)

No files — this is the "Apple-grade or homemade?" pass from the spec. Use the claude-in-chrome tools (load via ToolSearch first). Remember the HA service-worker gotcha: after deploy, bypass cache/hard-reload before judging anything.

- [ ] **Step 1: Baseline load**

Open `https://home.rutberg.dev/wall-hub/main?kiosk=true` in a new tab. Hard-reload to bypass the service worker. Verify: Hem renders, clock hero shows temp + icon + hi/lo, animated background visible for the real current condition.

- [ ] **Step 2: Condition sweep — natt**

Ensure natt theme (theme toggle or `localStorage.setItem('glass-hub-theme','natt')` + reload). For each condition, navigate to `…?kiosk=true&weather=<c>` (or run `window.__hubForceWeather('<c>')` via the javascript tool) with `<c>` in:
`sunny, clear-night, partlycloudy, cloudy, rainy, pouring, snowy, snowy-rainy, lightning, lightning-rainy, fog, hail, windy` — screenshot each and judge:
- Sky stays OLED-dark (near-black, never bright at night).
- Particles have visible depth (far layers fainter/smaller/slower than near).
- Rain slants and streaks; pouring is clearly heavier than rainy; splashes at the bottom.
- Snow drifts sinusoidally, flakes rotate; clouds drift smoothly; lightning flashes light the clouds; fog bands crawl.
- Nothing looks uniform, gridded, linear, or "particle-demo".

Iterate on `hub-weather-bg.ts` (counts, speeds, alphas, palettes) until every condition passes the bar, redeploying via Task 6 steps between iterations.

- [ ] **Step 3: Condition sweep — dag**

Switch theme to dag and repeat the sweep. Additional checks: sunny shows sun bloom + slow rays; golden-hour tint appears when sun elevation is between −4° and 10°; storm skies are moody but readable behind the cards.

- [ ] **Step 4: Popup functional pass**

Clear the force override (`window.__hubForceWeather(null)` or drop the param). Tap the clock hero:
- Popup opens with Nynäshamn selected; hourly strip shows ~24 entries with sane temps; 7-day list shows range bars whose widths/positions are consistent with lo/hi values.
- Tap Stockholm pill → data reloads and differs plausibly from Nynäshamn.
- Scrim tap and × both close it.

- [ ] **Step 5: Toggle + persistence pass**

- Turn `Animerad bakgrund` off → Hem background reverts to plain theme surface immediately (component unmounted — verify no `<hub-weather-bg>` in DOM via javascript tool).
- Reload page → still off. Turn on → animation returns; reload → still on.

- [ ] **Step 6: Lifecycle + interaction pass**

- Open console, filter `[weather-bg]`. Swipe Hem → Ljus: a `stop` line must appear. Swipe back: `start`. Hide the tab (switch tabs) and return: stop/start pair.
- Swipe horizontally starting over the animated background → deck swipes; vertical scroll on an overflowing page still scrolls (axis lock intact).
- Watch for jank: swipe animation and light-slider drags must stay smooth while rain/pouring runs.

- [ ] **Step 7: Record results**

Summarize pass/fail per condition (with iteration notes) in the final report to Philip. Any condition that still looks homemade is a blocker, not a footnote.

---

## Self-review notes

- Spec coverage: hero (T3), popup incl. locations + toggle (T4), Stockholm entity (T4·S1), bg engine + Hem-only mount + unmount-when-off (T5), settings persistence (T2/T4), debug forcing (T2/T5), vitest pure-logic (T1/T2), Chrome pass (T7), deploy (T6). Radar/automations/multi-location-UI beyond 2 pills: out of scope per spec.
- Popup backdrop "subtle condition sky": covered by the scrim blur over the live animated background when the bg is on; no separate popup sky layer (YAGNI — revisit only if the Chrome pass finds the popup feels detached).
- Type consistency checked: `SceneSpec`/`skyStops`/`ForecastHour`/`ForecastDay` signatures identical across tasks; `hub-weather-open`/`hub-weather-bg-toggle`/`hub-popup-close` event names consistent between clock, popup, and glass-hub.
