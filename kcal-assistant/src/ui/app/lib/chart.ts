export function makeScale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0;
  if (span === 0) return () => r0;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

export function invertScale(d0: number, d1: number, r0: number, r1: number): (r: number) => number {
  const span = r1 - r0;
  if (span === 0) return () => d0;
  return (r) => d0 + ((r - r0) / span) * (d1 - d0);
}

export function tickDates(t0: number, t1: number, n: number): number[] {
  if (n < 2) return [t0];
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(t0 + ((t1 - t0) * i) / (n - 1));
  return out;
}

export interface ActualPt { t: number; kg: number; trend: number }
export interface ProjPt { t: number; kg: number; low: number; high: number }
export type HoverHit =
  | { kind: "actual"; t: number; kg: number; trend: number }
  | { kind: "prognos"; t: number; kg: number; low: number; high: number };

// Nearest by |t - tx| across both series; actual wins ties (<=) so a hover on
// the seam highlights the measured point, not the projection copy of it.
export function nearestHit(tx: number, actual: ActualPt[], proj: ProjPt[]): HoverHit | null {
  let best: HoverHit | null = null;
  let bestD = Infinity;
  for (const p of actual) {
    const d = Math.abs(p.t - tx);
    if (d <= bestD) { bestD = d; best = { kind: "actual", t: p.t, kg: p.kg, trend: p.trend }; }
  }
  for (const p of proj) {
    const d = Math.abs(p.t - tx);
    if (d < bestD) { bestD = d; best = { kind: "prognos", t: p.t, kg: p.kg, low: p.low, high: p.high }; }
  }
  return best;
}
