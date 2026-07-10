import { useEffect, useMemo, useState } from "react";
import { sv, useApi, type Forecast, type ForecastView, type Profile, type Weight } from "../api";
import { EmptyState, ErrorNote, Tile } from "../components/Bits";
import { WeightChart } from "../components/WeightChart";
import { PrognosPanel, forecastQuery, type PrognosParams } from "../components/PrognosPanel";

export function Vikt() {
  const [epoch, setEpoch] = useState(0);
  return <ViktInner key={epoch} onSaved={() => setEpoch((e) => e + 1)} />;
}

const STORAGE_KEY = "kcal.scenarios";

function loadPinned(): PrognosParams[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is PrognosParams =>
      p && (p.source === "targets" || p.source === "recent") && typeof p.overrides === "object" && p.overrides !== null,
    ).slice(0, 2);
  } catch {
    return [];
  }
}

function scenarioLabel(p: PrognosParams): string {
  const parts: string[] = [];
  const o = p.overrides;
  if (o.intake) parts.push(`intag ${o.intake}`);
  if (o.activity) parts.push(`aktivitet ${o.activity.replace(".", ",")}`);
  if (o.goal) parts.push(`mål ${o.goal}`);
  if (o.goal_date) parts.push(`till ${o.goal_date}`);
  if (p.source === "recent") parts.push("senaste 28 d");
  return parts.length ? parts.join(" · ") : "planmål";
}

function ViktInner({ onSaved }: { onSaved: () => void }) {
  const weights = useApi<{ weights: Weight[]; trend: TrendData }>("/ui/api/weights");
  const profileRes = useApi<{ profile: Profile | null }>("/ui/api/profile");
  const [params, setParams] = useState<PrognosParams>({ source: "targets", overrides: {} });
  const [query, setQuery] = useState("source=targets");
  useEffect(() => {
    const t = setTimeout(() => setQuery(forecastQuery(params)), 200);
    return () => clearTimeout(t);
  }, [params]);
  const fc = useApi<ForecastView>(`/ui/api/forecast?${query}`, true);
  const [showGhost, setShowGhost] = useState(false);
  const [pinned, setPinned] = useState<PrognosParams[]>(loadPinned);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned)); }, [pinned]);
  const pin = () => setPinned((prev) => [...prev, params].slice(-2)); // third pin replaces the oldest
  const unpin = (i: number) => setPinned((prev) => prev.filter((_, idx) => idx !== i));
  const s0 = useApi<ForecastView>(pinned[0] ? `/ui/api/forecast?${forecastQuery(pinned[0])}` : null, true);
  const s1 = useApi<ForecastView>(pinned[1] ? `/ui/api/forecast?${forecastQuery(pinned[1])}` : null, true);
  const scenarios = [
    ...(pinned[0] && s0.data?.forecast ? [{ slot: 0 as const, curve: s0.data.forecast.curve }] : []),
    ...(pinned[1] && s1.data?.forecast ? [{ slot: 1 as const, curve: s1.data.forecast.curve }] : []),
  ];
  const canPin = params.source !== "targets" || Object.values(params.overrides).some((v) => v !== undefined && v !== "");

  if (weights.error) return <ErrorNote message={weights.error} />;
  if (profileRes.error) return <ErrorNote message={profileRes.error} />;
  if (!weights.data || !profileRes.data) return null;
  const data = weights.data;
  if (data.weights.length === 0) return (<><h2>Vikt</h2><EmptyState>Inga viktloggar ännu. Säg '82,1 idag' till assistenten.</EmptyState></>);

  const series = [...data.weights].reverse(); // ascending by date
  const forecast = fc.data?.forecast ?? null;
  const ghostData = fc.data?.ghost ?? null;
  const t = data.trend;
  const previewing = Object.keys(params.overrides).length > 0;

  return (
    <>
      <h2>Vikt</h2>
      {(series.length >= 2 || forecast) ? <WeightChart series={series} forecast={forecast} ghost={showGhost ? ghostData : null} scenarios={scenarios} /> : null}
      {ghostData ? (
        <div className="chip-row">
          <button className={`chip${showGhost ? " accent" : ""}`} onClick={() => setShowGhost((v) => !v)}>
            prognos för {Math.round((Date.now() - Date.parse(ghostData.snapshot_date)) / 86_400_000)} d sedan
          </button>
        </div>
      ) : null}
      <div className="tiles">
        {t.latest ? <Tile label="Senast" value={`${sv(t.latest.weight_kg)} kg`} sub={`${t.latest.date}${t.stale ? " · gammal" : ""} · trend ${sv(t.latest.trend_kg)}`} /> : null}
        {t.trend ? (
          <>
            <Tile label="Takt" value={`${sv(t.trend.rate_kg_week)} kg/v`} sub={`${sv(t.trend.delta_kg)} kg / ${sv(t.trend.span_days, 0)} d`} />
            <Tile label="TDEE" value={t.trend.est_tdee !== null ? sv(t.trend.est_tdee, 0) : "—"}
                  sub={t.trend.est_tdee === null ? "ingen intagsdata" : t.trend.uncertain ? "osäker (gles logg)" : `${t.trend.intake_days} intagsdagar`} />
          </>
        ) : t.reason ? <Tile label="Trend" value="—" sub={t.reason} /> : null}
      </div>
      <h2>Prognos</h2>
      <PrognosPanel profile={profileRes.data?.profile ?? null} params={params} setParams={setParams} onSaved={onSaved} onPin={pin} canPin={canPin} />
      {previewing ? <div className="chip-row"><span className="chip accent">förhandsvisning — ej sparad</span></div> : null}
      {pinned.length ? (
        <div className="chip-row">
          {pinned.map((p, i) => {
            const res = i === 0 ? s0 : s1;
            const eta = res.data?.forecast?.goal?.eta;
            return (
              <span key={i} className={`chip scenario-chip s${i}`}>
                {scenarioLabel(p)}{eta ? ` · mål ≈ ${eta}` : ""}
                <button className="chip-x" aria-label="ta bort scenario" onClick={() => unpin(i)}>×</button>
              </span>
            );
          })}
        </div>
      ) : null}
      {fc.error ? <div className="error-banner">Kunde inte hämta prognosen ({fc.error}){fc.data ? " — visar senaste lyckade." : ""}</div> : null}
      {fc.data && !fc.data.forecast ? <EmptyState>Ingen prognos: {fc.data.reason}</EmptyState> : null}
      {forecast ? <PrognosResult f={forecast} /> : null}
      {fc.data?.accuracy ? (
        <>
          <h2>Träffsäkerhet</h2>
          <div className="tiles">
            {fc.data.accuracy.per_age.map((b) => (
              <Tile key={b.days} label={`${b.days} d`} value={`±${sv(b.mae_kg)} kg`}
                    sub={`bias ${b.bias_kg > 0 ? "+" : ""}${sv(b.bias_kg)} kg · ${b.n} prognoser`} />
            ))}
          </div>
          <div className="note">Hur tidigare prognoser träffat trendvikten i efterhand. Positiv bias = prognosen låg för högt.</div>
        </>
      ) : null}
      <h2>Alla vägningar</h2>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Datum</th><th>kg</th><th>Anteckning</th></tr></thead>
          <tbody>
            {data.weights.map((w) => (
              <tr key={w.date}><td>{w.date}</td><td>{sv(w.weight_kg)}</td><td>{w.note || ""}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface TrendData {
  latest: { date: string; weight_kg: number; trend_kg: number } | null;
  stale: boolean;
  reason?: string;
  trend: { delta_kg: number; span_days: number; rate_kg_week: number; est_tdee: number | null; uncertain: boolean; intake_days: number } | null;
}

function PrognosResult({ f }: { f: Forecast }) {
  const byDate = useMemo(() => new Map(f.curve.map((p) => [p.date, p])), [f.curve]);
  const fallback = f.weight_at_goal_date ? f.weight_at_goal_date.date : f.curve[Math.min(30, f.curve.length - 1)]!.date;
  const [picked, setPicked] = useState<string | null>(null);
  const effective = picked ?? fallback;
  const hit = byDate.get(effective);
  return (
    <>
      <div className="tiles">
        {f.goal ? <Tile label="Målvikt" value={`${sv(f.goal.weight_kg)} kg`}
          sub={f.goal.reached ? "uppnådd"
            : f.goal.eta
              ? `nås ≈ ${f.goal.eta}${f.goal.eta_range.earliest ? ` (${f.goal.eta_range.earliest} – ${f.goal.eta_range.latest ?? "senare"})` : ""}`
              : f.goal.reason ?? null} /> : null}
        {f.weight_at_goal_date ? <Tile label="Vid måldatum" value={`≈ ${sv(f.weight_at_goal_date.kg)} kg`} sub={f.weight_at_goal_date.date} /> : null}
        <Tile label="TDEE i kalkylen" value={sv(f.assumptions.tdee_start, 0)} sub={f.assumptions.calibration === "mätdata" ? "kalibrerad mot mätdata" : "formel (Mifflin-St Jeor)"} />
        <Tile label="Intag i kalkylen" value={sv(f.assumptions.intake_kcal, 0)}
              sub={f.assumptions.intake_source === "targets" ? "planmål (dagstypsmix)" : f.assumptions.intake_source === "recent" ? "snitt senaste 28 d" : "angivet"} />
      </div>
      <div className="forecast-picker">
        <span className="label">Uppskattad vikt</span>
        <input type="date" min={f.curve[0]!.date} max={f.curve[f.curve.length - 1]!.date} value={effective}
               onChange={(e) => setPicked(e.target.value)} />
        <span className="num">{hit ? `≈ ${sv(hit.kg)} kg (${sv(hit.low)}–${sv(hit.high)})` : "—"}</span>
      </div>
      {f.notes.length ? <div className="note">{f.notes.join(" · ")}</div> : null}
    </>
  );
}
