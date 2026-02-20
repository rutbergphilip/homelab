import './cards/glass-background.js';
import './cards/glass-chip.js';

const w = window as unknown as {
  customCards: { type: string; name: string; description: string }[];
};
w.customCards = w.customCards || [];

w.customCards.push(
  { type: 'glass-background', name: 'Glass Background', description: 'Animated gradient background' },
  { type: 'glass-chip', name: 'Glass Chip', description: 'Small status pill' },
);

console.info(
  '%c GLASS CARDS %c v0.1.0 ',
  'color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;',
);
