import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTheme, getStoredOverride, setStoredOverride } from '../src/hub/theme-controller';

describe('resolveTheme', () => {
  it('follows sun when auto', () => {
    expect(resolveTheme(10, 'auto')).toBe('dag');
    expect(resolveTheme(1, 'auto')).toBe('natt');   // below default threshold 4
    expect(resolveTheme(-5, 'auto')).toBe('natt');
  });
  it('honors custom day elevation threshold', () => {
    expect(resolveTheme(5, 'auto', 8)).toBe('natt');
  });
  it('override wins over sun', () => {
    expect(resolveTheme(30, 'natt')).toBe('natt');
    expect(resolveTheme(-10, 'dag')).toBe('dag');
  });
  it('null elevation (sensor unavailable) → natt', () => {
    expect(resolveTheme(null, 'auto')).toBe('natt');
  });
});

describe('override storage', () => {
  beforeEach(() => localStorage.clear());
  it('defaults to auto and round-trips', () => {
    expect(getStoredOverride()).toBe('auto');
    setStoredOverride('dag');
    expect(getStoredOverride()).toBe('dag');
  });
  it('ignores garbage values', () => {
    localStorage.setItem('glass-hub-theme', 'banana');
    expect(getStoredOverride()).toBe('auto');
  });
});
