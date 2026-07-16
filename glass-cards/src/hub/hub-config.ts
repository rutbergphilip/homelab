import type { LovelaceCardConfig } from '../types.js';

export interface HubRoomLight { entity: string; name: string; }
export interface HubRoomScene { entity: string; name: string; }
export interface HubRoom {
  id: string; name: string; icon: string;
  main_entity: string;              // toggled by room tile long-press
  lights: HubRoomLight[];
  scenes?: HubRoomScene[];          // per-room Hue scenes (Hall/Office/Badrum only)
}
export interface HubConfig extends LovelaceCardConfig {
  pages?: string[];
  weather_entity: string;
  person_entity?: string;
  lights_count_entity?: string;
  vacuum_entity?: string;
  price_entity?: string;            // Tibber (official integration) — current price + level
  price_series_entity?: string;     // Tibber GraphQL REST sensor — today/tomorrow hourly arrays
  co2_entity?: string;
  fossil_entity?: string;
  departures?: { next_entity: string; list_entity: string; window?: { start: string; end: string } };
  rooms: HubRoom[];
  media_players: { entity: string; name: string }[];
  kcal?: { today_entity: string; forecast_entity: string };
  scenes?: { entity: string; name: string; icon: string }[];
  idle_return_s?: number;           // default 120
  day_elevation?: number;           // default 4
}
