import { useMemo, useRef, useState } from "react";
import { invertScale, makeScale, nearestHit, tickDates, type HoverHit } from "../lib/chart";
import { sv, type Forecast, type ForecastPoint, type Weight } from "../api";

const W = 640, H = 240, M = { top: 16, right: 52, bottom: 24, left: 10 };
const DAY = 86_400_000;
const NO_SCENARIOS: Array<{ slot: 0 | 1; curve: ForecastPoint[] }> = [];

export function WeightChart({ series, forecast, ghost = null, scenarios = NO_SCENARIOS }: {
  series: Weight[]; forecast: Forecast | null;
  ghost?: { snapshot_date: string; curve: ForecastPoint[] } | null;
  scenarios?: Array<{ slot: 0 | 1; curve: ForecastPoint[] }>;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<HoverHit | null>(null);

  const g = useMemo(() => {
    const proj = forecast ? forecast.curve : [];
    const anchors = forecast
      ? [forecast.goal?.eta, forecast.weight_at_goal_date?.date].filter((d): d is string => Boolean(d)).map((d) => Date.parse(d))
      : [];
    const horizon = proj.length
      ? anchors.length ? Math.max(...anchors) + 7 * DAY : Date.parse(proj[0]!.date) + 60 * DAY
      : 0;
    const drawn = proj
      .filter((p) => Date.parse(p.date) <= horizon)
      .map((p) => ({ t: Date.parse(p.date), kg: p.kg, low: p.low, high: p.high }));
    const goalKg = forecast?.goal?.weight_kg ?? null;
    const actual = series.map((w) => ({ t: Date.parse(w.date), kg: w.weight_kg, trend: w.trend_kg }));
    const lastActualT = actual.at(-1)?.t ?? 0;
    const ghostPts = ghost
      ? ghost.curve.map((p) => ({ t: Date.parse(p.date), kg: p.kg })).filter((p) => p.t <= lastActualT)
      : [];
    const scenarioPts = scenarios.map((s) => ({
      slot: s.slot,
      pts: s.curve.map((p) => ({ t: Date.parse(p.date), kg: p.kg })).filter((p) => p.t <= horizon),
    }));
    const allT = [
      ...actual.map((p) => p.t), ...drawn.map((p) => p.t),
      ...ghostPts.map((p) => p.t), ...scenarioPts.flatMap((s) => s.pts.map((p) => p.t)),
    ];
    const allKg = [
      ...actual.map((p) => p.kg), ...drawn.flatMap((p) => [p.low, p.high]), ...(goalKg !== null ? [goalKg] : []),
      ...ghostPts.map((p) => p.kg), ...scenarioPts.flatMap((s) => s.pts.map((p) => p.kg)),
    ];
    const x0 = Math.min(...allT), x1 = Math.max(...allT);
    const pad = Math.max(0.4, (Math.max(...allKg) - Math.min(...allKg)) * 0.15);
    const y0 = Math.min(...allKg) - pad, y1 = Math.max(...allKg) + pad;
    const X = makeScale(x0, x1, M.left, W - M.right);
    const Y = makeScale(y0, y1, H - M.bottom, M.top);
    const invX = invertScale(x0, x1, M.left, W - M.right);
    const markers: Array<[number, string]> = [];
    if (forecast?.goal?.eta) markers.push([Date.parse(forecast.goal.eta), "mål"]);
    if (forecast?.weight_at_goal_date) markers.push([Date.parse(forecast.weight_at_goal_date.date), "måldatum"]);
    return { drawn, goalKg, actual, x0, x1, y0, y1, X, Y, invX, markers, horizon, ghostPts };
  }, [series, forecast, ghost, scenarios]);

  const { drawn, goalKg, actual, x0, x1, y0, y1, X, Y, invX, markers, horizon, ghostPts } = g;

  const kgAt = (curve: ForecastPoint[], t: number): number | null => {
    let best: number | null = null, bestD = 4 * DAY;
    for (const p of curve) {
      const d = Math.abs(Date.parse(p.date) - t);
      if (d < bestD) { bestD = d; best = p.kg; }
    }
    return best;
  };

  const scenarioHits = hover
    ? scenarios
        .map((s) => ({ slot: s.slot, kg: kgAt(s.curve, hover.t) }))
        .filter((s): s is { slot: 0 | 1; kg: number } => s.kg !== null)
    : [];

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W; // CSS px -> viewBox units
    setHover(nearestHit(invX(px), actual, drawn));
  };

  const last = series[series.length - 1];
  const gridKgs = [0, 1, 2].map((i) => y0 + ((y1 - y0) * i) / 2);
  const bandD = drawn.length >= 2
    ? drawn.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.high).toFixed(1)}`).join("") +
      [...drawn].reverse().map((p) => `L${X(p.t).toFixed(1)},${Y(p.low).toFixed(1)}`).join("") + "Z"
    : null;
  const projD = drawn.length >= 1 && actual.length >= 1
    ? `M${X(actual[actual.length - 1]!.t).toFixed(1)},${Y(actual[actual.length - 1]!.kg).toFixed(1)}` +
      drawn.map((p) => `L${X(p.t).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("")
    : null;
  const actualD = actual.length >= 2
    ? actual.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.trend).toFixed(1)}`).join("")
    : null;

  // Tooltip box: clamp inside the frame; flip above/below the point.
  const tip = hover ? {
    x: Math.min(Math.max(X(hover.t), M.left + 60), W - M.right - 60),
    y: Math.max(Y(hover.kg) - 14, M.top + 24),
  } : null;

  return (
    <div className="chart-frame">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Viktutveckling och prognos, kg över tid"
           onPointerMove={onPointerMove} onPointerLeave={() => setHover(null)}>
        {gridKgs.map((kg, i) => (
          <g key={i}>
            <line className="gridline" x1={M.left} x2={W - M.right} y1={Y(kg)} y2={Y(kg)} />
            <text className="axis-label" x={W - M.right + 6} y={Y(kg) + 3}>{sv(kg, 1)}</text>
          </g>
        ))}
        {tickDates(x0, x1, 5).map((t, i, arr) => (
          <text key={t} className="axis-label" x={X(t)} y={H - 6}
                textAnchor={i === 0 ? "start" : i === arr.length - 1 ? "end" : "middle"}>
            {new Date(t).toISOString().slice(5, 10)}
          </text>
        ))}
        {bandD ? <path className="forecast-band" d={bandD} /> : null}
        {goalKg !== null ? <line className="goal-line" x1={M.left} x2={W - M.right} y1={Y(goalKg)} y2={Y(goalKg)} /> : null}
        {markers.filter(([t]) => t >= x0 && t <= x1).map(([t, text]) => (
          <g key={text}>
            <line className="marker-line" x1={X(t)} x2={X(t)} y1={M.top} y2={H - M.bottom} />
            <text className="axis-label" x={X(t) + 3} y={M.top + 8}>{text}</text>
          </g>
        ))}
        {ghostPts.length >= 2 ? (
          <path className="ghost-line" d={ghostPts.map((p, i) =>
            `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("")} />
        ) : null}
        {scenarios.map((s) => {
          const pts = s.curve.map((p) => ({ t: Date.parse(p.date), kg: p.kg })).filter((p) => p.t <= horizon);
          return pts.length >= 2 ? (
            <path key={s.slot} className={`scenario-line s${s.slot}`} d={pts.map((p, i) =>
              `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("")} />
          ) : null;
        })}
        {projD ? <path className="forecast-line" d={projD} /> : null}
        {actualD ? <path className="trend-line" d={actualD} /> : null}
        {actual.map((p, i) => (
          <circle key={p.t} className={`trend-dot${i === actual.length - 1 ? " last" : ""}`}
                  cx={X(p.t)} cy={Y(p.kg)} r={i === actual.length - 1 ? 5 : 3.5} />
        ))}
        {last ? (
          <text className="point-label" x={Math.min(X(Date.parse(last.date)), W - M.right - 4)}
                y={Y(last.weight_kg) - 10} textAnchor="end">{sv(last.weight_kg)} kg</text>
        ) : null}
        {hover && tip ? (
          <g className="hover-layer">
            <line className="hover-crosshair" x1={X(hover.t)} x2={X(hover.t)} y1={M.top} y2={H - M.bottom} />
            <circle className="hover-dot" cx={X(hover.t)} cy={Y(hover.kg)} r={4.5} />
            <g transform={`translate(${tip.x},${tip.y})`}>
              <rect className="hover-tip-bg" x={-58} y={-30} width={116} height={34 + scenarioHits.length * 10} rx={2} />
              <text className="hover-tip-date" x={0} y={-19} textAnchor="middle">{new Date(hover.t).toISOString().slice(0, 10)}</text>
              <text className="hover-tip-kg" x={0} y={-7} textAnchor="middle">
                {hover.kind === "actual" ? `${sv(hover.kg)} kg` : `≈ ${sv(hover.kg)} kg`}
              </text>
              {hover.kind === "prognos" ? (
                <text className="hover-tip-band" x={0} y={2} textAnchor="middle">({sv(hover.low)}–{sv(hover.high)})</text>
              ) : null}
              {hover.kind === "actual" ? (
                <text className="hover-tip-band" x={0} y={2} textAnchor="middle">trend {sv(hover.trend)}</text>
              ) : null}
              {scenarioHits.map((s, i) => (
                <text key={s.slot} className="hover-tip-band" x={0} y={13 + i * 10} textAnchor="middle">
                  S{s.slot + 1} ≈ {sv(s.kg)} kg
                </text>
              ))}
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
