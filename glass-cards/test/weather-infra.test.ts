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
