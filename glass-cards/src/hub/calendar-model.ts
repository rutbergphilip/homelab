import type { HomeAssistant } from '../types.js';

/**
 * Merged Apple+Google agenda. Events are fetched per-entity via
 * calendar.get_events (WS, return_response), merged, and deduped: an invite
 * that lands in both accounts appears once, with both entities in `sources`.
 */

export interface RawCalEvent {
  summary?: string;
  start?: string; // ISO datetime with offset, or YYYY-MM-DD for all-day
  end?: string;
}

export interface HubCalEvent {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  sources: string[];
}

/** Date-only starts parse as LOCAL midnight (new Date('YYYY-MM-DD') would be UTC). */
export function startMs(start: string): number {
  if (!start.includes('T')) {
    const [y, m, d] = start.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return new Date(start).getTime();
}

/** Same normalized title + same instant (minute precision) ⇒ duplicate. */
export function dedupeKey(summary: string, start: string): string {
  const t = summary.trim().toLowerCase();
  if (!start.includes('T')) return `${t}|${start}`;
  return `${t}|${Math.floor(new Date(start).getTime() / 60000)}`;
}

export function mergeEvents(byEntity: Record<string, RawCalEvent[]>): HubCalEvent[] {
  const map = new Map<string, HubCalEvent>();
  for (const [entity, events] of Object.entries(byEntity)) {
    for (const ev of events ?? []) {
      if (!ev?.summary || !ev.start) continue;
      const key = dedupeKey(ev.summary, ev.start);
      const hit = map.get(key);
      if (hit) {
        if (!hit.sources.includes(entity)) hit.sources.push(entity);
        continue;
      }
      map.set(key, {
        title: ev.summary.trim(),
        start: ev.start,
        end: ev.end ?? ev.start,
        allDay: !ev.start.includes('T'),
        sources: [entity],
      });
    }
  }
  return [...map.values()].sort((a, b) => startMs(a.start) - startMs(b.start));
}

const WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tors', 'fre', 'lör'];

/** "Idag" / "Imorgon" / "fre 24/7" for an event start, relative to `now`. */
export function dayLabel(start: string, now: Date): string {
  const d = new Date(startMs(start));
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const evDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((evDay - day0) / 86_400_000);
  if (diff === 0) return 'Idag';
  if (diff === 1) return 'Imorgon';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

const TTL_MS = 5 * 60_000;
let cache: { key: string; at: number; data: HubCalEvent[] } | null = null;

interface GetEventsResponse {
  response?: Record<string, { events?: RawCalEvent[] }>;
}

export async function fetchMergedEvents(
  hass: HomeAssistant,
  entities: string[],
  days = 7,
): Promise<HubCalEvent[] | null> {
  if (!entities.length) return [];
  const key = entities.join(',');
  if (cache && cache.key === key && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const start = new Date();
    const end = new Date(start.getTime() + days * 86_400_000);
    const resp = await hass.callWS<GetEventsResponse>({
      type: 'call_service',
      domain: 'calendar',
      service: 'get_events',
      service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() },
      target: { entity_id: entities },
      return_response: true,
    });
    const byEntity: Record<string, RawCalEvent[]> = {};
    for (const id of entities) byEntity[id] = resp?.response?.[id]?.events ?? [];
    const merged = mergeEvents(byEntity);
    cache = { key, at: Date.now(), data: merged };
    return merged;
  } catch {
    return null;
  }
}

export function clearCalendarCache(): void {
  cache = null;
}
