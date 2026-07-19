// Decides what a tap on a room (Hem tile / Ljus section heading) should do.
// Asymmetric by design: any light on → the whole room goes dark; a dark room
// → only the room's default lights come on (fallback: main_entity).

import type { HubRoom } from './hub-config.js';
import type { HassEntity } from '../types.js';

export interface RoomTapPlan {
  service: 'turn_on' | 'turn_off';
  entities: string[];
}

export function roomTapPlan(
  room: HubRoom,
  states: Record<string, HassEntity | undefined>,
): RoomTapPlan {
  const anyOn = room.lights.some((l) => states[l.entity]?.state === 'on');
  if (anyOn) {
    return { service: 'turn_off', entities: room.lights.map((l) => l.entity) };
  }
  const defaults = room.default_lights?.length ? room.default_lights : [room.main_entity];
  return { service: 'turn_on', entities: defaults };
}
