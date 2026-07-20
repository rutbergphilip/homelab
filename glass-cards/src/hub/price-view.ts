// Persisted Spot/Allt-in choice for the Energi page (and the Hem strip, which
// mirrors it). Mirrors theme-controller's guarded-localStorage pattern.

import type { PriceView } from './energy-model.js';
import type { HubConfig } from './hub-config.js';

const KEY = 'glass-hub-price-view';

export function getStoredPriceView(): PriceView {
  try {
    return localStorage.getItem(KEY) === 'spot' ? 'spot' : 'allin';
  } catch {
    return 'allin';
  }
}

export function setStoredPriceView(v: PriceView): void {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode etc. — the toggle simply won't persist */
  }
}

/** Per-kWh öre added on top of Tibber total in the Allt-in view. */
export function gridAddOre(cfg: HubConfig | undefined): number {
  return (cfg?.grid?.overforing_ore ?? 0) + (cfg?.grid?.energiskatt_ore ?? 0);
}
