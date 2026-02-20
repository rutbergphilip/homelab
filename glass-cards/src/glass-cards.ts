import './cards/glass-background.js';
import './cards/glass-button.js';
import './cards/glass-chip.js';
import './cards/glass-header.js';
import './cards/glass-room-card.js';
import './cards/glass-light-slider.js';

const w = window as unknown as {
  customCards: { type: string; name: string; description: string }[];
};
w.customCards = w.customCards || [];

w.customCards.push(
  { type: 'glass-background', name: 'Glass Background', description: 'Animated gradient background' },
  { type: 'glass-button', name: 'Glass Button', description: 'Toggle/info button' },
  { type: 'glass-chip', name: 'Glass Chip', description: 'Small status pill' },
  { type: 'glass-header', name: 'Glass Header', description: 'Greeting, weather, status chips' },
  { type: 'glass-room-card', name: 'Glass Room Card', description: 'Room with sub-buttons and popup' },
  { type: 'glass-light-slider', name: 'Glass Light Slider', description: 'Brightness slider with glow' },
);

console.info(
  '%c GLASS CARDS %c v0.1.0 ',
  'color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;',
);
