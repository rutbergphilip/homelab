import { svg, type TemplateResult } from 'lit';

/** Line-style weather glyphs, 24px viewBox, stroke 1.8, currentColor. */

const sun = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4.2"></circle>
  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M5 19l1.6-1.6M17.4 6.6L19 5"></path>
</svg>`;

const moon = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z"></path>
</svg>`;

const cloud = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 17.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
</svg>`;

const cloudSun = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="17" cy="7" r="2.8"></circle>
  <path d="M17 2.6v1M21.4 7h1M20.1 3.9l-.7.7M20.1 10.1l-.7-.7"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`;

const cloudMoon = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.6 8.6a4 4 0 0 1-5-5 4 4 0 1 0 5 5z"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`;

const rain = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M12.5 17.5l-1 2.5M17 17.5l-1 2.5"></path>
</svg>`;

const pour = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M7 16l-1.4 3.6M10.5 16l-1.4 3.6M14 16l-1.4 3.6M17.5 16l-1.4 3.6"></path>
</svg>`;

const snow = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18.2v.01M12 19.6v.01M16 18.2v.01M10 21v.01M14 21v.01" stroke-width="2.4"></path>
</svg>`;

const sleet = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M15.5 17.5l-1 2.5"></path>
  <path d="M11.8 20v.01M17.5 20v.01" stroke-width="2.4"></path>
</svg>`;

const bolt = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
</svg>`;

const boltRain = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
  <path d="M6.6 16.5l-.9 2.3M17 16.5l-.9 2.3"></path>
</svg>`;

const fog = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 12.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.4 7.4"></path>
  <path d="M4.5 15.5h15M6.5 18.5h11M8.5 21.5h7"></path>
</svg>`;

const wind = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.5 9h11a2.6 2.6 0 1 0-2.6-2.6"></path>
  <path d="M3.5 13.5h15.2a2.6 2.6 0 1 1-2.6 2.6"></path>
  <path d="M3.5 18h7.4a2.2 2.2 0 1 1-2.2 2.2"></path>
</svg>`;

const hailIcon = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
