export type HubTheme = 'natt' | 'dag';
export type ThemeOverride = HubTheme | 'auto';

const KEY = 'glass-hub-theme';

export function resolveTheme(
  sunElevation: number | null,
  override: ThemeOverride,
  dayElevation = 4
): HubTheme {
  if (override !== 'auto') return override;
  if (sunElevation === null) return 'natt';
  return sunElevation > dayElevation ? 'dag' : 'natt';
}

export function getStoredOverride(): ThemeOverride {
  const v = localStorage.getItem(KEY);
  return v === 'natt' || v === 'dag' ? v : 'auto';
}

export function setStoredOverride(v: ThemeOverride): void {
  localStorage.setItem(KEY, v);
}
