export const hubDashboard = {
  url_path: 'wall-hub',
  title: 'Hub',
  icon: 'mdi:view-dashboard',
  config: {
    title: 'Hub',
    views: [{
      title: 'Hub', type: 'panel', path: 'main',
      cards: [{
        type: 'custom:glass-hub',
        weather_entity: 'weather.forecast_home',
        weather_locations: [
          { entity: 'weather.forecast_home', name: 'Nynäshamn' },
          { entity: 'weather.forecast_stockholm', name: 'Stockholm' },
        ],
        person_entity: 'person.philip_rutberg',
        lights_count_entity: 'sensor.lights_on_count',
        vacuum_entity: 'vacuum.roborock_s8',
        vacuum_controls: {
          status_entity: 'sensor.roborock_s8_status',
          battery_entity: 'sensor.roborock_s8_batteri',
          current_room_entity: 'sensor.roborock_s8_nuvarande_rum',
          full_button: 'button.roborock_s8_full_cleaning',
          room_buttons: [
            { entity: 'button.roborock_s8_living_room', name: 'Vardagsrum' },
            { entity: 'button.roborock_s8_kitchen', name: 'Kök' },
            { entity: 'button.roborock_s8_bedroom', name: 'Sovrum' },
            { entity: 'button.roborock_s8_hall', name: 'Hall' },
          ],
          mop_mode_entity: 'select.roborock_s8_mopplage',
          mop_intensity_entity: 'select.roborock_s8_moppintensitet',
          consumables: [
            { entity: 'sensor.roborock_s8_huvudborste_tid_kvar', name: 'Huvudborste' },
            { entity: 'sensor.roborock_s8_sidoborste_tid_kvar', name: 'Sidoborste' },
            { entity: 'sensor.roborock_s8_filtertid_kvar', name: 'Filter' },
            { entity: 'sensor.roborock_s8_sensortid_kvar', name: 'Sensorer' },
          ],
        },
        price_entity: 'sensor.bryggan_elpris',
        price_series_entity: 'sensor.elpris_timserie',
        co2_entity: 'sensor.electricity_maps_co2_intensitet',
        fossil_entity: 'sensor.electricity_maps_procent_fossila_branslen_i_elnatet',
        // Verified 2026-07-20: Tibber total = (energy+påslag)×moms, no energiskatt → add both fees
        // (diff 33.96 öre vs moms-only 22.37 öre @ 00:00; consistent ~10-13 öre påslag gap across
        // hours, not the ~45 öre energiskatt would add).
        grid: { overforing_ore: 26, energiskatt_ore: 45 },
        disturbances_entity: 'sensor.sl_storningar',
        departures: { next_entity: 'sensor.avgangar_next_departure', list_entity: 'sensor.avgangar_departures' },
        transit: {
          pendeltag: { next_entity: 'sensor.avgangar_next_departure', count_entity: 'sensor.avgangar_departures' },
          bus: { entity: 'sensor.sl_kullstaplan', line: '861', exclude_destination: 'nynäs', label: 'Buss 861 → Slakthuset' },
        },
        // Kök + Sovrum are bonded to the Arc as surround speakers, so they never
        // appear as independent players in HA. If they're ever unbonded, add them
        // back here — the Media page's tabs/grouping UI reactivates automatically:
        //   { entity: 'media_player.kitchen', name: 'Kök' },
        //   { entity: 'media_player.bedroom', name: 'Sovrum' },
        media_players: [
          { entity: 'media_player.arc_sub', name: 'Vardagsrum (Arc)' },
        ],
        kcal: { today_entity: 'sensor.kcal_idag', forecast_entity: 'sensor.kcal_viktprognos', planner_entity: 'sensor.kcal_veckoplan' },
        todo_entity: 'todo.att_gora',
        rooms: [
          { id: 'vardagsrum', name: 'Vardagsrum', icon: 'sofa', main_entity: 'light.vardagsrum',
            default_lights: ['light.vardagsrum', 'light.tv'],
            lights: [ { entity: 'light.vardagsrum', name: 'Taklampa' }, { entity: 'light.tv', name: 'TV-lampa' } ] },
          { id: 'kok', name: 'Kök', icon: 'pot', main_entity: 'light.kok',
            default_lights: ['light.kok'],
            lights: [ { entity: 'light.kok', name: 'Taklampa' }, { entity: 'light.tak_1', name: 'Tak 1' },
                      { entity: 'light.tak_2', name: 'Tak 2' }, { entity: 'light.slinga', name: 'Slinga' },
                      { entity: 'light.koksfonstret', name: 'Köksfönstret' } ] },
          { id: 'sovrum', name: 'Sovrum', icon: 'bed', main_entity: 'light.sovrum',
            default_lights: ['light.sovrum'],
            lights: [ { entity: 'light.sovrum', name: 'Taklampa' }, { entity: 'light.lightstrip', name: 'Lightstrip' },
                      { entity: 'light.sovrumsfonstret', name: 'Fönsterlampa' }, { entity: 'light.spot_1', name: 'Spot 1' },
                      { entity: 'light.spot_2', name: 'Spot 2' }, { entity: 'light.spot_3', name: 'Spot 3' } ] },
          { id: 'hall', name: 'Hall', icon: 'door', main_entity: 'light.hall',
            default_lights: ['light.hall'],
            lights: [ { entity: 'light.hall', name: 'Taklampa' }, { entity: 'light.hall_spot_1', name: 'Spot 1' },
                      { entity: 'light.hall_spot_2', name: 'Spot 2' }, { entity: 'light.hall_spot_3', name: 'Spot 3' } ],
            scenes: [ { entity: 'scene.hall_koppla_av', name: 'Koppla av' }, { entity: 'scene.hall_klart_ljus', name: 'Klart ljus' },
                      { entity: 'scene.hall_concentrate', name: 'Fokus' }, { entity: 'scene.hall_las', name: 'Läs' },
                      { entity: 'scene.hall_nattlampa', name: 'Nattlampa' }, { entity: 'scene.hall_fa_ny_energi', name: 'Ny energi' } ] },
          { id: 'office', name: 'Office', icon: 'desk', main_entity: 'light.office',
            default_lights: ['light.office'],
            lights: [ { entity: 'light.office', name: 'Office' } ],
            scenes: [ { entity: 'scene.office_koppla_av', name: 'Koppla av' }, { entity: 'scene.office_concentrate', name: 'Fokus' },
                      { entity: 'scene.office_las', name: 'Läs' }, { entity: 'scene.office_nattlampa', name: 'Nattlampa' },
                      { entity: 'scene.office_fa_ny_energi', name: 'Ny energi' } ] },
          { id: 'badrum', name: 'Badrum', icon: 'shower', main_entity: 'light.badrum',
            default_lights: ['light.badrum'],
            lights: [ { entity: 'light.badrum', name: 'Taklampa' }, { entity: 'light.spotlight_top', name: 'Spotlight' } ],
            scenes: [ { entity: 'scene.badrum_nattljus', name: 'Nattljus' } ] },
        ],
        // No whole-home Hue scenes exist yet for Kvällsläge / Film (see docs/hue-audit.md).
        // Philip needs to create both in the Hue app (so they also sync to HomeKit), then this
        // array should be filled in as:
        //   scenes: [
        //     { entity: 'scene.<confirmed-id>', name: 'Kvällsläge', icon: 'moon' },
        //     { entity: 'scene.<confirmed-id>', name: 'Film', icon: 'play' },
        //   ],
        scenes: [],
      }],
    }],
  },
};
