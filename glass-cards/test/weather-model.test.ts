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
  cloudColors,
  clipForScene,
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

describe('cloudColors', () => {
  const skies = ['clear', 'partly', 'overcast', 'storm', 'fog'] as const;
  it('returns valid 0..1 components for every sky × theme', () => {
    for (const sky of skies) {
      for (const theme of ['natt', 'dag'] as const) {
        const c = cloudColors(sky, theme);
        for (const v of [...c.lit, ...c.shade, c.alpha]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });
  it('natt clouds stay dim (lit luminance < 0.3), dag clouds are brighter', () => {
    for (const sky of skies) {
      const natt = cloudColors(sky, 'natt');
      const dag = cloudColors(sky, 'dag');
      const lum = (c: readonly number[]) => (c[0] + c[1] + c[2]) / 3;
      expect(lum(natt.lit), sky).toBeLessThan(0.3);
      expect(lum(dag.lit)).toBeGreaterThan(lum(natt.lit));
    }
  });
});

describe('clipForScene', () => {
  it('maps every condition to a clip for day and night', () => {
    for (const c of ALL_CONDITIONS) {
      for (const band of ['day', 'golden', 'night'] as const) {
        const clip = clipForScene(c, band);
        expect(clip, `${c}/${band}`).toMatch(/^[a-z-]+$/);
      }
    }
  });
  it('day/night variants', () => {
    expect(clipForScene('sunny', 'day')).toBe('sunny-day');
    expect(clipForScene('clear-night', 'night')).toBe('clear-night');
    expect(clipForScene('rainy', 'day')).toBe('storm-day');
    expect(clipForScene('rainy', 'night')).toBe('cloudy-night');
    expect(clipForScene('snowy', 'golden')).toBe('snow-day');
    expect(clipForScene('fog', 'night')).toBe('fog');
    expect(clipForScene('banana', 'day')).toBe('cloudy-day');
  });
});
