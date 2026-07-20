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
