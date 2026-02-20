#!/usr/bin/env node
/**
 * Deploy glass-cards to Home Assistant via WebSocket API
 * 1. Register glass-cards.js as a Lovelace resource
 * 2. Create the glass-home dashboard
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HA_URL = 'https://home.rutberg.dev';
const HA_WS_URL = 'wss://home.rutberg.dev/api/websocket';
const TOKEN = readFileSync(resolve(__dirname, '../../.claude/ha-token'), 'utf-8').trim();
const DASHBOARD_YAML = readFileSync(resolve(__dirname, '../../.claude/ha-glass-dashboard.yaml'), 'utf-8');

// Parse YAML manually (simple subset needed)
import { createRequire } from 'module';

let msgId = 1;

function sendMsg(ws, msg) {
  msg.id = msgId++;
  return new Promise((resolve, reject) => {
    const id = msg.id;
    const handler = (event) => {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.success === false) {
          reject(new Error(`HA error: ${JSON.stringify(data.error)}`));
        } else {
          resolve(data);
        }
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify(msg));
  });
}

async function deploy() {
  console.log('Connecting to Home Assistant WebSocket...');

  const ws = new WebSocket(HA_WS_URL);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  // Wait for auth_required
  await new Promise((resolve) => {
    ws.addEventListener('message', function handler(event) {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (data.type === 'auth_required') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    });
  });

  // Authenticate
  ws.send(JSON.stringify({ type: 'auth', access_token: TOKEN }));

  await new Promise((resolve, reject) => {
    ws.addEventListener('message', function handler(event) {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (data.type === 'auth_ok') {
        ws.removeEventListener('message', handler);
        console.log('Authenticated successfully');
        resolve();
      } else if (data.type === 'auth_invalid') {
        reject(new Error('Authentication failed'));
      }
    });
  });

  // Step 1: Register resource
  console.log('\n--- Registering Lovelace resource ---');

  // List existing resources first
  let resources;
  try {
    const res = await sendMsg(ws, {
      type: 'lovelace/resources'
    });
    resources = res.result || [];
    console.log(`Found ${resources.length} existing resources`);
  } catch (e) {
    console.log('Could not list resources, will try to create:', e.message);
    resources = [];
  }

  const glassResource = resources.find(r => r.url && r.url.includes('glass-cards'));
  const resourceUrl = '/local/glass-cards/glass-cards.js?v=' + Date.now();

  if (glassResource) {
    console.log('Updating existing glass-cards resource...');
    try {
      await sendMsg(ws, {
        type: 'lovelace/resources/update',
        resource_id: glassResource.id,
        res_type: 'module',
        url: resourceUrl
      });
      console.log('Resource updated');
    } catch (e) {
      console.log('Update failed, trying delete+create:', e.message);
      await sendMsg(ws, {
        type: 'lovelace/resources/delete',
        resource_id: glassResource.id
      });
      await sendMsg(ws, {
        type: 'lovelace/resources/create',
        res_type: 'module',
        url: resourceUrl
      });
      console.log('Resource recreated');
    }
  } else {
    console.log('Creating new glass-cards resource...');
    await sendMsg(ws, {
      type: 'lovelace/resources/create',
      res_type: 'module',
      url: resourceUrl
    });
    console.log('Resource created');
  }

  // Step 2: Create/update dashboard
  console.log('\n--- Deploying dashboard ---');

  // List existing dashboards
  const dashRes = await sendMsg(ws, {
    type: 'lovelace/dashboards/list'
  });
  const dashboards = dashRes.result || [];
  console.log(`Found ${dashboards.length} existing dashboards`);

  const glassDash = dashboards.find(d => d.url_path === 'glass-home');

  if (!glassDash) {
    console.log('Creating glass-home dashboard...');
    await sendMsg(ws, {
      type: 'lovelace/dashboards/create',
      url_path: 'glass-home',
      title: 'Glass Home',
      icon: 'mdi:diamond-stone',
      require_admin: false,
      mode: 'storage'
    });
    console.log('Dashboard created');
  } else {
    console.log('Dashboard already exists');
  }

  // Step 3: Set dashboard config
  console.log('Setting dashboard configuration...');

  // Parse the YAML config to JSON (simple parser for our known structure)
  const dashboardConfig = parseYamlDashboard(DASHBOARD_YAML);

  await sendMsg(ws, {
    type: 'lovelace/config/save',
    url_path: 'glass-home',
    config: dashboardConfig
  });
  console.log('Dashboard config saved');

  console.log('\n✅ Deployment complete!');
  console.log(`Visit: ${HA_URL}/glass-home/0`);

  ws.close();
  process.exit(0);
}

function parseYamlDashboard(yaml) {
  // We need a proper YAML parser. Let's use a simple approach -
  // build the config object directly since we know the structure
  const config = {
    title: 'Glass Home',
    views: [{
      title: 'Home',
      type: 'panel',
      cards: [{
        type: 'custom:glass-background',
        cards: []
      }]
    }]
  };

  const bgCards = config.views[0].cards[0].cards;

  // Nav bar
  bgCards.push({
    type: 'custom:glass-nav-bar',
    items: [
      { icon: 'mdi:home', label: 'Hem', hash: 'hem' },
      { icon: 'mdi:lightbulb-group', label: 'Lampor', hash: 'lampor' },
      { icon: 'mdi:robot-vacuum', label: 'Dammsugare', hash: 'dammsugare' },
      { icon: 'mdi:flash', label: 'Energi', hash: 'energi' },
      { icon: 'mdi:train', label: 'Tåg', hash: 'tag' }
    ]
  });

  // Header
  bgCards.push({
    type: 'custom:glass-header',
    greeting: true,
    weather_entity: 'weather.forecast_home',
    chips: [
      { chip_type: 'person', entity: 'person.philip_rutberg' },
      { chip_type: 'battery', entity: 'sensor.philip_s_iphone_battery_level' },
      { chip_type: 'lights', entity: 'sensor.lights_on_count' }
    ]
  });

  // Section: Quick access
  bgCards.push({
    type: 'custom:glass-section',
    label: 'Genvägar',
    icon: 'mdi:lightning-bolt'
  });

  // Quick access buttons
  bgCards.push({
    type: 'custom:glass-button',
    entity: 'light.vardagsrum',
    name: 'Alla lampor',
    icon: 'mdi:lightbulb-group',
    tap_action: { action: 'navigate', navigation_path: 'alla-lampor' }
  });

  bgCards.push({
    type: 'custom:glass-button',
    entity: 'vacuum.roborock_s8',
    name: 'Roborock',
    icon: 'mdi:robot-vacuum'
  });

  bgCards.push({
    type: 'custom:glass-button',
    entity: 'sensor.electricity_maps_co2_intensitet',
    name: 'CO2',
    icon: 'mdi:molecule-co2',
    show_state: true,
    tap_action: { action: 'none' }
  });

  bgCards.push({
    type: 'custom:glass-button',
    entity: 'media_player.arc_sub',
    name: 'TV',
    icon: 'mdi:television',
    show_state: true
  });

  // Section: Rooms
  bgCards.push({
    type: 'custom:glass-section',
    label: 'Rum',
    icon: 'mdi:floor-plan'
  });

  // Room cards
  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Vardagsrum',
    icon: 'mdi:sofa',
    entity: 'light.vardagsrum',
    popup_id: 'vardagsrum',
    sub_buttons: [
      { entity: 'light.vardagsrum' },
      { entity: 'light.tv' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Sovrum',
    icon: 'mdi:bed',
    entity: 'light.sovrum',
    popup_id: 'sovrum',
    sub_buttons: [
      { entity: 'light.sovrum' },
      { entity: 'light.lightstrip' },
      { entity: 'light.sovrumsfonstret' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Kök',
    icon: 'mdi:silverware-fork-knife',
    entity: 'light.kok',
    popup_id: 'kok',
    sub_buttons: [
      { entity: 'light.kok' },
      { entity: 'light.tak_1' },
      { entity: 'light.tak_2' },
      { entity: 'light.slinga' },
      { entity: 'light.koksfonstret' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Office',
    icon: 'mdi:monitor',
    entity: 'light.office',
    popup_id: 'office',
    sub_buttons: [
      { entity: 'light.office' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Hall',
    icon: 'mdi:door',
    entity: 'light.hall',
    popup_id: 'hall',
    sub_buttons: [
      { entity: 'light.hall' },
      { entity: 'light.hall_spot_1' },
      { entity: 'light.hall_spot_2' },
      { entity: 'light.hall_spot_3' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-room-card',
    name: 'Badrum',
    icon: 'mdi:shower',
    entity: 'light.badrum',
    popup_id: 'badrum',
    sub_buttons: [
      { entity: 'light.badrum' },
      { entity: 'light.spotlight_top' }
    ]
  });

  // Section: Info
  bgCards.push({
    type: 'custom:glass-section',
    label: 'Information',
    icon: 'mdi:information-outline'
  });

  // Info rows
  bgCards.push({
    type: 'custom:glass-info-row',
    entity: 'sensor.avgangar_next_departure',
    name: 'Nästa tåg',
    icon: 'mdi:train',
    badge_entity: 'sensor.avgangar_departures',
    badge_icon: 'mdi:clock-outline'
  });

  bgCards.push({
    type: 'custom:glass-info-row',
    entity: 'sensor.electricity_maps_procent_fossila_branslen_i_elnatet',
    name: 'Fossilt',
    icon: 'mdi:leaf'
  });

  // Popups
  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'vardagsrum',
    title: 'Vardagsrum',
    icon: 'mdi:sofa',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.vardagsrum', name: 'Taklampa' },
      { type: 'custom:glass-light-slider', entity: 'light.tv', name: 'TV-lampa' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'sovrum',
    title: 'Sovrum',
    icon: 'mdi:bed',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.sovrum', name: 'Taklampa' },
      { type: 'custom:glass-light-slider', entity: 'light.lightstrip', name: 'Lightstrip' },
      { type: 'custom:glass-light-slider', entity: 'light.sovrumsfonstret', name: 'Fönsterlampa' },
      { type: 'custom:glass-light-slider', entity: 'light.spot_1', name: 'Spot 1' },
      { type: 'custom:glass-light-slider', entity: 'light.spot_2', name: 'Spot 2' },
      { type: 'custom:glass-light-slider', entity: 'light.spot_3', name: 'Spot 3' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'kok',
    title: 'Kök',
    icon: 'mdi:silverware-fork-knife',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.kok', name: 'Taklampa' },
      { type: 'custom:glass-light-slider', entity: 'light.tak_1', name: 'Tak 1' },
      { type: 'custom:glass-light-slider', entity: 'light.tak_2', name: 'Tak 2' },
      { type: 'custom:glass-light-slider', entity: 'light.slinga', name: 'Slinga' },
      { type: 'custom:glass-light-slider', entity: 'light.koksfonstret', name: 'Köksfönstret' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'office',
    title: 'Office',
    icon: 'mdi:monitor',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.office', name: 'Office' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'hall',
    title: 'Hall',
    icon: 'mdi:door',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.hall', name: 'Taklampa' },
      { type: 'custom:glass-light-slider', entity: 'light.hall_spot_1', name: 'Spot 1' },
      { type: 'custom:glass-light-slider', entity: 'light.hall_spot_2', name: 'Spot 2' },
      { type: 'custom:glass-light-slider', entity: 'light.hall_spot_3', name: 'Spot 3' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'badrum',
    title: 'Badrum',
    icon: 'mdi:shower',
    cards: [
      { type: 'custom:glass-light-slider', entity: 'light.badrum', name: 'Taklampa' },
      { type: 'custom:glass-light-slider', entity: 'light.spotlight_top', name: 'Spotlight' }
    ]
  });

  bgCards.push({
    type: 'custom:glass-popup',
    hash: 'dammsugare',
    title: 'Dammsugare',
    icon: 'mdi:robot-vacuum',
    cards: [{
      type: 'custom:glass-vacuum-card',
      entity: 'vacuum.roborock_s8',
      name: 'Roborock S8',
      rooms: [
        { name: 'Vardagsrum', room_id: 16 },
        { name: 'Sovrum', room_id: 17 },
        { name: 'Kök', room_id: 18 },
        { name: 'Hall', room_id: 19 },
        { name: 'Badrum', room_id: 20 },
        { name: 'Office', room_id: 21 }
      ]
    }]
  });

  return config;
}

deploy().catch(err => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
