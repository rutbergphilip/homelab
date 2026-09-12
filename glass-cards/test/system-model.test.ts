import { describe, it, expect } from 'vitest';
import {
  pctTone,
  tempTone,
  zeroTone,
  restartTone,
  volumeTone,
  backupTone,
  certTone,
  nodesTone,
  worstTone,
  overallStatus,
  formatUptime,
  formatAge,
  formatRate,
  formatPct,
  formatTb,
  type SystemSnapshot,
} from '../src/hub/system-model';

const healthy: SystemSnapshot = {
  nodesReady: 3,
  nodesTotal: 3,
  alerts: 0,
  fluxFailing: 0,
  podsUnhealthy: 0,
  restarts1h: 0,
  clusterTemp: 52,
  nasCpuTemp: 48,
  nasNvmeTemp: 63,
  volume1UsedPct: 41,
  volume2UsedPct: 4,
  backupAgeHours: 10,
  certDays: 31,
};

describe('tones', () => {
  it('bands utilisation at the points where a homelab node starts to feel it', () => {
    expect(pctTone(11)).toBe('green');
    expect(pctTone(69.9)).toBe('green');
    expect(pctTone(70)).toBe('amber');
    expect(pctTone(90)).toBe('coral');
  });

  it('bands temperatures at fan-audible and throttle points, not vendor maxima', () => {
    expect(tempTone(48)).toBe('green');
    expect(tempTone(65)).toBe('amber');
    expect(tempTone(80)).toBe('coral');
  });

  it('treats any alert, Flux failure or unhealthy pod as something to act on', () => {
    expect(zeroTone(0)).toBe('green');
    expect(zeroTone(1)).toBe('coral');
  });

  it('lets a couple of restarts be a note and a burst a problem', () => {
    expect(restartTone(0)).toBe('green');
    expect(restartTone(2)).toBe('amber');
    expect(restartTone(5)).toBe('coral');
  });

  it('warns on volumes before ext4 slows down', () => {
    expect(volumeTone(41)).toBe('green');
    expect(volumeTone(80)).toBe('amber');
    expect(volumeTone(90)).toBe('coral');
  });

  it('accepts one missed backup night, not two', () => {
    expect(backupTone(10)).toBe('green');
    expect(backupTone(26)).toBe('green');
    expect(backupTone(27)).toBe('amber');
    expect(backupTone(51)).toBe('coral');
  });

  it('flags certificates cert-manager should already have renewed', () => {
    expect(certTone(31)).toBe('green');
    expect(certTone(13)).toBe('amber');
    expect(certTone(6)).toBe('coral');
  });

  it('calls a two-of-three cluster degraded, not fine', () => {
    expect(nodesTone(3, 3)).toBe('green');
    expect(nodesTone(2, 3)).toBe('coral');
    expect(nodesTone(null, 3)).toBe('neutral');
  });

  it('is neutral for missing readings so an outage never reads as green', () => {
    expect(pctTone(null)).toBe('neutral');
    expect(tempTone(undefined)).toBe('neutral');
    expect(zeroTone(Number.NaN)).toBe('neutral');
    expect(backupTone(null)).toBe('neutral');
  });
});

describe('worstTone', () => {
  it('picks the most severe tone, ignoring unknowns unless nothing is known', () => {
    expect(worstTone(['green', 'amber', 'green'])).toBe('amber');
    expect(worstTone(['green', 'coral', 'amber'])).toBe('coral');
    expect(worstTone(['neutral', 'green'])).toBe('green');
    expect(worstTone(['neutral', 'neutral'])).toBe('neutral');
    expect(worstTone([])).toBe('neutral');
  });
});

describe('overallStatus', () => {
  it('says everything is fine when every reading is inside its band', () => {
    expect(overallStatus(healthy)).toEqual({ tone: 'green', label: 'Allt OK' });
  });

  it('escalates to act-today for an alert, a node down or a full volume', () => {
    expect(overallStatus({ ...healthy, alerts: 1 }).tone).toBe('coral');
    expect(overallStatus({ ...healthy, nodesReady: 2 }).tone).toBe('coral');
    expect(overallStatus({ ...healthy, volume1UsedPct: 93 }).tone).toBe('coral');
    expect(overallStatus({ ...healthy, fluxFailing: 1 }).label).toBe('Åtgärda');
  });

  it('only asks for attention for a stale backup or a warm node', () => {
    expect(overallStatus({ ...healthy, backupAgeHours: 30 })).toEqual({ tone: 'amber', label: 'Håll koll' });
    expect(overallStatus({ ...healthy, nasNvmeTemp: 70 }).tone).toBe('amber');
  });

  it('reports no data rather than OK when nothing is known', () => {
    const empty = Object.fromEntries(Object.keys(healthy).map((k) => [k, null])) as unknown as SystemSnapshot;
    expect(overallStatus(empty)).toEqual({ tone: 'neutral', label: 'Ingen data' });
  });
});

describe('formatting', () => {
  it('shows uptime in the unit a person would say out loud', () => {
    expect(formatUptime(1229)).toBe('51 d');
    expect(formatUptime(2.6)).toBe('2 h 36 min');
    expect(formatUptime(0.3)).toBe('18 min');
    expect(formatUptime(null)).toBe('–');
  });

  it('shows backup age in minutes, hours or days as it grows', () => {
    expect(formatAge(0.4)).toBe('24 min');
    expect(formatAge(10)).toBe('10 h');
    expect(formatAge(51)).toBe('2 d 3 h');
    expect(formatAge(48)).toBe('2 d');
  });

  it('switches transfer rates to kB/s below a tenth of a megabyte', () => {
    expect(formatRate(0.31)).toBe('0,31 MB/s');
    expect(formatRate(0.004)).toBe('4 kB/s');
    expect(formatRate(0)).toBe('0 kB/s');
  });

  it('formats percentages and terabytes the Swedish way', () => {
    expect(formatPct(41.3)).toBe('41 %');
    expect(formatTb(9.29)).toBe('9,3 TB');
    expect(formatTb(0.456)).toBe('456 GB');
    expect(formatTb(null)).toBe('–');
  });
});
