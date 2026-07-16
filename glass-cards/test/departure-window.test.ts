import { describe, it, expect } from 'vitest';
import { inDepartureWindow } from '../src/hub/widgets/departure-window';

const d = (s: string) => new Date(s);
describe('inDepartureWindow', () => {
  it('true weekday morning', () => expect(inDepartureWindow(d('2026-07-15T07:30:00'))).toBe(true)); // Wed
  it('false weekday evening', () => expect(inDepartureWindow(d('2026-07-15T18:00:00'))).toBe(false));
  it('false weekend morning', () => expect(inDepartureWindow(d('2026-07-18T07:30:00'))).toBe(false)); // Sat
  it('honors custom window', () => expect(inDepartureWindow(d('2026-07-15T10:00:00'), '09:00', '11:00')).toBe(true));
  it('boundary inclusive', () => expect(inDepartureWindow(d('2026-07-15T06:30:00'))).toBe(true));
});
