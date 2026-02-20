import type { HassEntity } from '../types.js';

export function countEntitiesOn(
  entities: Record<string, HassEntity>,
  entityIds: string[]
): number {
  return entityIds.filter((id) => entities[id]?.state === 'on').length;
}

export function isEntityOn(
  entities: Record<string, HassEntity>,
  entityId: string
): boolean {
  return entities[entityId]?.state === 'on';
}

export function getBrightness(entity: HassEntity | undefined): number {
  if (!entity || entity.state !== 'on') return 0;
  const brightness = entity.attributes.brightness as number | undefined;
  return brightness ? Math.round((brightness / 255) * 100) : 100;
}

export function formatEntityValue(entity: HassEntity | undefined): string {
  if (!entity) return 'Otillganglig';
  const unit = entity.attributes.unit_of_measurement as string | undefined;
  return unit ? `${entity.state} ${unit}` : entity.state;
}

export function getRoomStatus(
  entities: Record<string, HassEntity>,
  entityIds: string[]
): string {
  const onCount = countEntitiesOn(entities, entityIds);
  if (onCount === 0) return 'Av';
  if (onCount === 1) return 'Pa';
  return `${onCount} lampor pa`;
}
