import { describe, it, expect } from 'vitest';
import { mergeEvents, dedupeKey, startMs, dayLabel, type RawCalEvent } from '../src/hub/calendar-model';

const ev = (over: Partial<RawCalEvent>): RawCalEvent => ({
  summary: 'Middag',
  start: '2026-07-23T18:00:00+02:00',
  end: '2026-07-23T19:00:00+02:00',
  ...over,
});

describe('mergeEvents', () => {
  it('collapses the same event present in both calendars and records both sources', () => {
    const out = mergeEvents({
      'calendar.google': [ev({})],
      'calendar.icloud': [ev({})],
    });
    expect(out).toHaveLength(1);
    expect(out[0].sources.sort()).toEqual(['calendar.google', 'calendar.icloud']);
  });

  it('dedupes across differing timezone offsets for the same instant', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ start: '2026-07-23T18:00:00+02:00' })],
      'calendar.icloud': [ev({ start: '2026-07-23T16:00:00+00:00' })],
    });
    expect(out).toHaveLength(1);
  });

  it('dedupe is case- and whitespace-insensitive on the title', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ summary: ' middag ' })],
      'calendar.icloud': [ev({ summary: 'Middag' })],
    });
    expect(out).toHaveLength(1);
  });

  it('keeps events with the same title at different times', () => {
    const out = mergeEvents({
      'calendar.google': [ev({}), ev({ start: '2026-07-24T18:00:00+02:00' })],
    });
    expect(out).toHaveLength(2);
  });

  it('flags date-only events as all-day and sorts them before timed events that day', () => {
    const out = mergeEvents({
      'calendar.icloud': [ev({}), ev({ summary: 'Semester', start: '2026-07-23', end: '2026-07-24' })],
    });
    expect(out[0].title).toBe('Semester');
    expect(out[0].allDay).toBe(true);
    expect(out[1].allDay).toBe(false);
  });

  it('drops events without summary or start', () => {
    const out = mergeEvents({ 'calendar.x': [ev({ summary: undefined }), ev({ start: undefined })] });
    expect(out).toHaveLength(0);
  });

  it('sorts by start time across calendars', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ summary: 'Sen', start: '2026-07-25T10:00:00+02:00' })],
      'calendar.icloud': [ev({ summary: 'Tidig', start: '2026-07-23T08:00:00+02:00' })],
    });
    expect(out.map((e) => e.title)).toEqual(['Tidig', 'Sen']);
  });
});

describe('dedupeKey / startMs', () => {
  it('truncates timed starts to the minute', () => {
    expect(dedupeKey('X', '2026-07-23T18:00:10+02:00')).toBe(dedupeKey('X', '2026-07-23T18:00:40+02:00'));
  });
  it('keeps all-day keys on the raw date', () => {
    expect(dedupeKey('X', '2026-07-23')).not.toBe(dedupeKey('X', '2026-07-24'));
  });
  it('startMs parses date-only as local midnight', () => {
    expect(startMs('2026-07-23')).toBe(new Date(2026, 6, 23).getTime());
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 6, 22, 12, 0); // wed 22 july
  it('labels today and tomorrow', () => {
    expect(dayLabel('2026-07-22T18:00:00+02:00', now)).toBe('Idag');
    expect(dayLabel('2026-07-23', now)).toBe('Imorgon');
  });
  it('labels later days with weekday + date', () => {
    expect(dayLabel('2026-07-24T09:00:00+02:00', now)).toBe('fre 24/7');
  });
});
