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
