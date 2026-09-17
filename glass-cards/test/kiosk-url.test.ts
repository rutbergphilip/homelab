import { describe, it, expect } from 'vitest';
import { nextKioskSearch } from '../src/hub/kiosk-url';

describe('nextKioskSearch', () => {
  it('enters fullscreen on a wide screen with ?kiosk=true', () => {
    expect(nextKioskSearch('', false, false)).toBe('kiosk=true');
  });
  it('leaves fullscreen on a wide screen by dropping ?kiosk', () => {
    expect(nextKioskSearch('?kiosk=true', true, false)).toBe('');
  });
  it('leaves fullscreen on a phone by opting out of the mobile settings', () => {
    expect(nextKioskSearch('', true, true)).toBe('disable_km');
  });
  it('drops an explicit ?kiosk too when leaving fullscreen on a phone', () => {
    expect(nextKioskSearch('?kiosk=true', true, true)).toBe('disable_km');
  });
  it('re-enters fullscreen on a phone by removing the opt-out, no ?kiosk needed', () => {
    expect(nextKioskSearch('?disable_km', false, true)).toBe('');
  });
  it('preserves unrelated params', () => {
    expect(nextKioskSearch('?weather=rainy', false, false)).toBe('weather=rainy&kiosk=true');
    expect(nextKioskSearch('?weather=rainy&kiosk=true', true, true)).toBe('weather=rainy&disable_km');
  });
});
