import type { HassEntity } from '../types.js';

export function getEntityIcon(entity: HassEntity): string {
  if (entity.attributes.icon) return entity.attributes.icon as string;
  const domain = entity.entity_id.split('.')[0];
  switch (domain) {
    case 'light': return 'mdi:lightbulb';
    case 'vacuum': return 'mdi:robot-vacuum';
    case 'media_player': return 'mdi:speaker';
    case 'person': return 'mdi:account';
    case 'weather': return 'mdi:weather-cloudy';
    case 'sensor': return 'mdi:eye';
    default: return 'mdi:help-circle';
  }
}

export function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    'clear-night': 'mdi:weather-night',
    'cloudy': 'mdi:weather-cloudy',
    'fog': 'mdi:weather-fog',
    'hail': 'mdi:weather-hail',
    'lightning': 'mdi:weather-lightning',
    'lightning-rainy': 'mdi:weather-lightning-rainy',
    'partlycloudy': 'mdi:weather-partly-cloudy',
    'pouring': 'mdi:weather-pouring',
    'rainy': 'mdi:weather-rainy',
    'snowy': 'mdi:weather-snowy',
    'snowy-rainy': 'mdi:weather-snowy-rainy',
    'sunny': 'mdi:weather-sunny',
    'windy': 'mdi:weather-windy',
    'windy-variant': 'mdi:weather-windy-variant',
    'exceptional': 'mdi:alert-circle-outline',
  };
  return icons[condition] ?? 'mdi:weather-cloudy';
}

export function entityDomain(entityId: string): string {
  return entityId.split('.')[0];
}
