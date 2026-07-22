import type { LovelaceCardConfig } from '../types.js';

export interface HubRoomLight { entity: string; name: string; }
export interface HubRoomScene { entity: string; name: string; }
export interface HubRoom {
  id: string; name: string; icon: string;
  main_entity: string;              // fallback "default light" for room tap-on
  default_lights?: string[];        // lights turned on by a tap on a dark room
  lights: HubRoomLight[];
  scenes?: HubRoomScene[];          // per-room Hue scenes (Hall/Office/Badrum only)
}
export interface HubGridFees {
  overforing_ore: number;           // elnät överföringsavgift, öre/kWh
  energiskatt_ore: number;          // statlig energiskatt, öre/kWh (set 0 if Tibber total already includes it — see Task 9 gate)
}
export interface HubVacuumControls {
  status_entity: string;            // sensor.roborock_s8_status (rich state text)
  battery_entity: string;           // sensor.roborock_s8_batteri
  current_room_entity?: string;     // sensor.roborock_s8_nuvarande_rum
  full_button: string;              // button.roborock_s8_full_cleaning
  room_buttons: { entity: string; name: string }[];
  mop_mode_entity?: string;         // select.roborock_s8_mopplage
  mop_intensity_entity?: string;    // select.roborock_s8_moppintensitet
  consumables?: { entity: string; name: string }[];
}
export interface HubVolvoConfig {
  name?: string;                   // display name, default "Volvo"
  battery_entity?: string;         // battery charge level %
  range_entity?: string;           // electric range km
  lock_entity?: string;            // lock.<car>...
  charging_entity?: string;        // charging status sensor
  climate_entity?: string;         // switch.* (toggle) or button.* (press) for climatization
  climate_stop_entity?: string;    // optional separate stop button
  odometer_entity?: string;
  doors?: { entity: string; name: string }[]; // binary sensors: on = open
}
export interface HubConfig extends LovelaceCardConfig {
  pages?: string[];
  weather_entity: string;
  weather_locations?: { entity: string; name: string }[]; // popup location pills; first = primary
  person_entity?: string;
  lights_count_entity?: string;
  vacuum_entity?: string;
  vacuum_controls?: HubVacuumControls;
  price_entity?: string;            // Tibber (official integration) — current price + level
  price_series_entity?: string;     // Tibber GraphQL REST sensor — today/tomorrow hourly arrays
  co2_entity?: string;
  fossil_entity?: string;
  grid?: HubGridFees;               // per-kWh add-ons for the "Allt-in" price view
  disturbances_entity?: string;     // sensor.sl_storningar — SL deviations
  departures?: { next_entity: string; list_entity: string; window?: { start: string; end: string } };
  transit?: {
    pendeltag?: { next_entity: string; count_entity: string };
    bus?: { entity: string; line: string; exclude_destination: string; label: string };
  };
  rooms: HubRoom[];
  media_players: { entity: string; name: string }[];
  kcal?: { today_entity: string; forecast_entity: string; planner_entity?: string };
  todo_entity?: string;             // todo.att_gora — shared to-do list
  scenes?: { entity: string; name: string; icon: string }[];
  idle_return_s?: number;           // default 120
  day_elevation?: number;           // default 4
  volvo?: HubVolvoConfig;
}
