// Pure logic behind the System page — thresholds, tones and formatting kept out
// of the components so they are testable without a browser (same split as
// health-model / energy-model).
//
// Data source: the sensor.homelab_* REST sensors in Home Assistant, which read
// Prometheus' homelab:* recording rules (one definition shared with Grafana and
// alerting). Missing entities render as "–", never as 0 — a NAS that is off
// must not look like a NAS with 0 % load.

import { numericState } from './health-model.js';

export type SystemTone = 'green' | 'amber' | 'coral' | 'neutral';

export { numericState };

/** Utilisation in percent: comfortable, busy, saturated. */
export function pctTone(pct: number | null | undefined): SystemTone {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 'neutral';
  if (pct < 70) return 'green';
  if (pct < 90) return 'amber';
  return 'coral';
}

/**
 * Package / NVMe temperatures. 65 °C is where the NAS fans become audible in the
 * living room; 80 °C is where Intel starts throttling — both are thresholds that
 * mean something to the household, not vendor maxima.
 */
export function tempTone(celsius: number | null | undefined): SystemTone {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return 'neutral';
  if (celsius < 65) return 'green';
  if (celsius < 80) return 'amber';
  return 'coral';
}

/** Counters where zero is the only good answer (alerts, Flux failures, unhealthy pods). */
export function zeroTone(count: number | null | undefined): SystemTone {
  if (count === null || count === undefined || Number.isNaN(count)) return 'neutral';
  return count > 0 ? 'coral' : 'green';
}

/** Restarts: a couple in an hour is a note, a burst is a problem. */
export function restartTone(count: number | null | undefined): SystemTone {
  if (count === null || count === undefined || Number.isNaN(count)) return 'neutral';
  if (count === 0) return 'green';
  if (count < 5) return 'amber';
  return 'coral';
}

/** Volume fill. 80 % leaves room for a season pack; 90 % is where ext4 slows. */
export function volumeTone(usedPct: number | null | undefined): SystemTone {
  if (usedPct === null || usedPct === undefined || Number.isNaN(usedPct)) return 'neutral';
  if (usedPct < 80) return 'green';
  if (usedPct < 90) return 'amber';
  return 'coral';
}

/**
 * Backup age. The snapshot runs at 04:00, so anything under 26 h means the last
 * night worked; two missed nights is when it matters.
 */
export function backupTone(hours: number | null | undefined): SystemTone {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return 'neutral';
  if (hours <= 26) return 'green';
  if (hours <= 50) return 'amber';
  return 'coral';
}

/** Certificate runway. cert-manager renews at 30 days out; under 14 something is stuck. */
export function certTone(days: number | null | undefined): SystemTone {
  if (days === null || days === undefined || Number.isNaN(days)) return 'neutral';
  if (days >= 14) return 'green';
  if (days >= 7) return 'amber';
  return 'coral';
}

/** Nodes ready vs total: all or nothing — a two-of-three cluster is degraded, not fine. */
export function nodesTone(ready: number | null, total: number | null): SystemTone {
  if (ready === null || total === null) return 'neutral';
  return ready >= total ? 'green' : 'coral';
}

const RANK: Record<SystemTone, number> = { neutral: 0, green: 1, amber: 2, coral: 3 };

/** The worst of several tones; neutral (unknown) never outranks a real reading. */
export function worstTone(tones: SystemTone[]): SystemTone {
  let worst: SystemTone = 'neutral';
  for (const t of tones) if (RANK[t] > RANK[worst]) worst = t;
  return worst;
}

export interface SystemSnapshot {
  nodesReady: number | null;
  nodesTotal: number | null;
  alerts: number | null;
  fluxFailing: number | null;
  podsUnhealthy: number | null;
  restarts1h: number | null;
  clusterTemp: number | null;
  nasCpuTemp: number | null;
  nasNvmeTemp: number | null;
  volume1UsedPct: number | null;
  volume2UsedPct: number | null;
  backupAgeHours: number | null;
  certDays: number | null;
}

export interface OverallStatus {
  tone: SystemTone;
  label: string;
}

/**
 * One verdict for the Hem chip and the page header. Coral is reserved for
 * things that need a hand today (an alert, a node down, Flux stuck, a full
 * volume); amber for things to keep an eye on; green says "nothing to do".
 * With no readings at all the status is neutral, not green — silence is not
 * health.
 */
export function overallStatus(s: SystemSnapshot): OverallStatus {
  const tone = worstTone([
    nodesTone(s.nodesReady, s.nodesTotal),
    zeroTone(s.alerts),
    zeroTone(s.fluxFailing),
    zeroTone(s.podsUnhealthy),
    restartTone(s.restarts1h),
    tempTone(s.clusterTemp),
    tempTone(s.nasCpuTemp),
    tempTone(s.nasNvmeTemp),
    volumeTone(s.volume1UsedPct),
    volumeTone(s.volume2UsedPct),
    backupTone(s.backupAgeHours),
    certTone(s.certDays),
  ]);
  switch (tone) {
    case 'coral':
      return { tone, label: 'Åtgärda' };
    case 'amber':
      return { tone, label: 'Håll koll' };
    case 'green':
      return { tone, label: 'Allt OK' };
    default:
      return { tone, label: 'Ingen data' };
  }
}

const ONE_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const TWO_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 });

/** 1229 h → "51 d", 2.6 h → "2 h 36 min", 0.3 h → "18 min". */
export function formatUptime(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours) || hours < 0) return '–';
  if (hours >= 48) return `${Math.floor(hours / 24)} d`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

/** 10.0 h → "10 h", 0.4 h → "24 min", 51 h → "2 d 3 h". */
export function formatAge(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours) || hours < 0) return '–';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${ONE_DEC.format(hours)} h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours - d * 24);
  return h === 0 ? `${d} d` : `${d} d ${h} h`;
}

/** 0.31 MB/s → "0,31 MB/s"; 0.004 → "4 kB/s"; 0 → "0 kB/s". */
export function formatRate(mbps: number | null | undefined): string {
  if (mbps === null || mbps === undefined || Number.isNaN(mbps) || mbps < 0) return '–';
  if (mbps < 0.1) return `${Math.round(mbps * 1000)} kB/s`;
  return `${TWO_DEC.format(mbps)} MB/s`;
}

/** Whole-number percent with the Swedish unit spacing. */
export function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return '–';
  return `${Math.round(pct)} %`;
}

/** 9.29 TB → "9,3 TB"; 0.46 TB → "456 GB". */
export function formatTb(tb: number | null | undefined): string {
  if (tb === null || tb === undefined || Number.isNaN(tb)) return '–';
  if (tb < 1) return `${Math.round(tb * 1000)} GB`;
  return `${ONE_DEC.format(tb)} TB`;
}
