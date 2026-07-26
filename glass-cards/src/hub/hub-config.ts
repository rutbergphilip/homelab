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
export interface HubCalendarConfig {
  entities: string[];    // all calendars merged into the agenda
  create_entity: string; // calendar that receives new events
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
/**
 * Hälsa page wiring. Oura owns recovery and activity; Withings owns the body
 * (Oura measures no weight), so the split is by capability, not preference.
 * `history_entity` is sensor.kcal_halsa — the 14-day series a Lovelace card
 * cannot fetch for itself; everything else is read live so the wall panel is
 * never a poll interval behind.
 */
export interface HubHealthConfig {
  history_entity?: string;
  oura?: {
    sleep_score_entity?: string;
    sleep_duration_entity?: string;
    time_in_bed_entity?: string;
    deep_entity?: string;
    rem_entity?: string;
    light_entity?: string;
    awake_entity?: string;
    efficiency_entity?: string;
    latency_entity?: string;
    bedtime_start_entity?: string;
    bedtime_end_entity?: string;
    readiness_score_entity?: string;
    hrv_entity?: string;
    resting_hr_entity?: string;
    temp_deviation_entity?: string;
    hrv_balance_entity?: string;
    sleep_regularity_entity?: string;
    resting_hr_score_entity?: string;
    activity_score_entity?: string;
    steps_entity?: string;
    active_kcal_entity?: string;
    total_kcal_entity?: string;
    target_kcal_entity?: string;
    high_met_entity?: string;
    medium_met_entity?: string;
    low_met_entity?: string;
    battery_entity?: string;
    workouts_today_entity?: string;
    workout_type_entity?: string;
    workout_kcal_entity?: string;
    workout_duration_entity?: string;
    workout_at_entity?: string;
  };
  withings?: {
    weight_entity?: string;
    fat_pct_entity?: string;
    fat_mass_entity?: string;
    lean_mass_entity?: string;
    muscle_entity?: string;
    bone_entity?: string;
    heart_rate_entity?: string;
    workout_type_entity?: string;
    workout_kcal_entity?: string;
    workout_duration_entity?: string;
  };
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
  health?: HubHealthConfig;
  todo_entity?: string;             // todo.att_gora — shared to-do list
  calendar?: HubCalendarConfig;
  scenes?: { entity: string; name: string; icon: string }[];
  idle_return_s?: number;           // default 120
  day_elevation?: number;           // default 4
  volvo?: HubVolvoConfig;
}
