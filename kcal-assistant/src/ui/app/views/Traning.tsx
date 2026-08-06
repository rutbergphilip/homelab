import { useState } from "react";
import {
  sv,
  useApi,
  type TrainingProgressView,
  type TrainingTopExercise,
  type TrainingView,
  type TrainingWeeklyPoint,
} from "../api";
import { EmptyState, ErrorNote, Tile } from "../components/Bits";
import { makeScale } from "../lib/chart";

// Data comes from claude-db's lyfta domain (synced hourly from the Lyfta
// API); this view is read-only — logging happens in the Lyfta app itself.
export function Traning() {
  const res = useApi<TrainingView>("/ui/api/training");
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const progress = useApi<TrainingProgressView>(
    exerciseId !== null ? `/ui/api/training/${exerciseId}` : null,
    true,
  );

  if (res.error) return <ErrorNote message={res.error} />;
  if (!res.data) return null;
  const data = res.data;
  if (!data.available) {
    return (<><h2>Träning</h2><EmptyState>Ingen kontakt med claude-db ({data.reason}). Träningsdatan bor där — försök igen om en stund.</EmptyState></>);
  }
  if (data.workout_count === 0) {
    return (
      <>
        <h2>Träning</h2>
        <EmptyState>
          {data.configured
            ? "Inga pass synkade ännu — första synken från Lyfta kör inom en timme."
            : "Lyfta är inte kopplat ännu: API-nyckeln (LYFTA_API_KEY) saknas i claude-db."}
        </EmptyState>
      </>
    );
  }

  const latest = data.recent_workouts[0];
  const selected = exerciseId !== null ? data.top_exercises.find((e) => e.exercise_id === exerciseId) : undefined;

  return (
    <>
      <h2>Träning</h2>
      <div className="tiles">
        <Tile
          label="Denna vecka"
          value={`${data.this_week.workouts} pass`}
          sub={`${sv(data.this_week.volume_kg, 0)} kg volym · ${data.this_week.sets} set`}
        />
        {latest ? (
          <Tile
            label="Senaste passet"
            value={latest.title || latest.date}
            sub={`${latest.date}${latest.duration_min !== null ? ` · ${latest.duration_min} min` : ""} · ${sv(latest.volume_kg, 0)} kg`}
          />
        ) : null}
        <Tile
          label="Totalt"
          value={`${data.workout_count} pass`}
          sub={data.last_synced ? `synkad ${data.last_synced.slice(0, 16).replace("T", " ")}` : "aldrig synkad"}
        />
      </div>
      {data.last_error ? <div className="error-banner">Senaste synken misslyckades: {data.last_error}</div> : null}

      <h2>Volym per vecka</h2>
      <VolymChart weekly={data.weekly} />

      <h2>Mest tränade övningar</h2>
      <div className="note">Klicka på en övning för utvecklingen över tid. e1RM = uppskattat 1RM (Epley).</div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Övning</th><th>Pass</th><th>Bästa</th><th>e1RM nu</th><th>e1RM topp</th></tr></thead>
          <tbody>
            {data.top_exercises.map((e) => (
              <ExerciseRow
                key={e.exercise_id}
                exercise={e}
                selected={e.exercise_id === exerciseId}
                onSelect={() => setExerciseId(e.exercise_id === exerciseId ? null : e.exercise_id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selected && progress.data ? (
        progress.data.available && progress.data.points.length >= 2 ? (
          <>
            <h2>{selected.name}</h2>
            <ProgressChart points={progress.data.points} />
            <div className="note">Bästa set per pass — vikt × reps som uppskattat 1RM, senaste {progress.data.days} dagarna.</div>
          </>
        ) : (
          <EmptyState>För få pass med {selected.name} för en kurva ännu.</EmptyState>
        )
      ) : null}
      {progress.error ? <ErrorNote message={progress.error} /> : null}

      <h2>Senaste passen</h2>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Datum</th><th>Pass</th><th>Tid</th><th>Set</th><th>Volym</th></tr></thead>
          <tbody>
            {data.recent_workouts.map((w) => (
              <tr key={w.id}>
                <td>{w.date}</td>
                <td>{w.title || "—"}</td>
                <td>{w.duration_min !== null ? `${w.duration_min} min` : "—"}</td>
                <td>{w.sets}</td>
                <td>{sv(w.volume_kg, 0)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExerciseRow({ exercise: e, selected, onSelect }: { exercise: TrainingTopExercise; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      onClick={onSelect}
      style={{ cursor: "pointer" }}
      aria-selected={selected}
      className={selected ? "row-selected" : undefined}
    >
      <td>{selected ? "▸ " : ""}{e.name}</td>
      <td>{e.sessions}</td>
      <td>{e.best_weight_kg !== null ? `${sv(e.best_weight_kg)} kg` : "—"}</td>
      <td>{e.latest_e1rm_kg !== null ? `${sv(e.latest_e1rm_kg)} kg` : "—"}</td>
      <td>{e.best_e1rm_kg !== null ? `${sv(e.best_e1rm_kg)} kg` : "—"}</td>
    </tr>
  );
}

const W = 640, H = 180, M = { top: 12, right: 52, bottom: 22, left: 10 };

function VolymChart({ weekly }: { weekly: TrainingWeeklyPoint[] }) {
  const max = Math.max(...weekly.map((w) => w.volume_kg), 1);
  const Y = makeScale(0, max, H - M.bottom, M.top);
  const innerW = W - M.left - M.right;
  const slot = innerW / weekly.length;
  const barW = Math.min(slot * 0.6, 36);
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Träningsvolym per vecka">
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={M.left} x2={W - M.right} y1={Y(max * f)} y2={Y(max * f)} stroke="var(--hair)" strokeDasharray="2 4" />
            <text x={W - M.right + 6} y={Y(max * f) + 4} fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">
              {sv(max * f, 0)}
            </text>
          </g>
        ))}
        <line x1={M.left} x2={W - M.right} y1={Y(0)} y2={Y(0)} stroke="var(--hair-2)" />
        {weekly.map((w, i) => {
          const x = M.left + slot * i + (slot - barW) / 2;
          const y = Y(w.volume_kg);
          return (
            <g key={w.week_start}>
              <rect x={x} y={y} width={barW} height={Math.max(Y(0) - y, w.volume_kg > 0 ? 2 : 0)} rx="2" fill="var(--accent)">
                <title>{`v. ${w.week_start}: ${sv(w.volume_kg, 0)} kg · ${w.workouts} pass · ${w.sets} set`}</title>
              </rect>
              {i % 4 === 0 || i === weekly.length - 1 ? (
                <text x={x + barW / 2} y={H - 6} fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)" textAnchor="middle">
                  {w.week_start.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ProgressChart({ points }: { points: Array<{ date: string; e1rm_kg: number | null; best_weight_kg: number | null }> }) {
  const usable = points
    .map((p) => ({ t: Date.parse(p.date), e1rm: p.e1rm_kg, weight: p.best_weight_kg }))
    .filter((p): p is { t: number; e1rm: number; weight: number | null } => p.e1rm !== null);
  if (usable.length < 2) return null;
  const t0 = usable[0]!.t, t1 = usable.at(-1)!.t;
  const values = usable.flatMap((p) => [p.e1rm, ...(p.weight !== null ? [p.weight] : [])]);
  const pad = Math.max(2, (Math.max(...values) - Math.min(...values)) * 0.15);
  const y0 = Math.min(...values) - pad, y1 = Math.max(...values) + pad;
  const X = makeScale(t0, t1, M.left + 6, W - M.right - 6);
  const Y = makeScale(y0, y1, H - M.bottom, M.top);
  const line = usable.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.e1rm).toFixed(1)}`).join("");
  const gridKgs = [0, 1, 2].map((i) => y0 + ((y1 - y0) * i) / 2);
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Uppskattat 1RM över tid">
        {gridKgs.map((kg) => (
          <g key={kg}>
            <line x1={M.left} x2={W - M.right} y1={Y(kg)} y2={Y(kg)} stroke="var(--hair)" strokeDasharray="2 4" />
            <text x={W - M.right + 6} y={Y(kg) + 4} fontSize="10" fill="var(--ink-3)" fontFamily="var(--mono)">
              {sv(kg, 0)}
            </text>
          </g>
        ))}
        {usable.map((p) =>
          p.weight !== null ? (
            <circle key={`w${p.t}`} cx={X(p.t)} cy={Y(p.weight)} r="2.5" fill="var(--ink-3)" opacity="0.6">
              <title>{`${new Date(p.t).toISOString().slice(0, 10)}: tyngsta set ${sv(p.weight)} kg`}</title>
            </circle>
          ) : null,
        )}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {usable.map((p) => (
          <circle key={p.t} cx={X(p.t)} cy={Y(p.e1rm)} r="3" fill="var(--accent)">
            <title>{`${new Date(p.t).toISOString().slice(0, 10)}: e1RM ${sv(p.e1rm)} kg`}</title>
          </circle>
        ))}
        {[usable[0]!, usable.at(-1)!].map((p, i) => (
          <text
            key={i}
            x={X(p.t)}
            y={H - 6}
            fontSize="10"
            fill="var(--ink-3)"
            fontFamily="var(--mono)"
            textAnchor={i === 0 ? "start" : "end"}
          >
            {new Date(p.t).toISOString().slice(0, 10)}
          </text>
        ))}
      </svg>
      <div className="note">Linje = e1RM (bästa set) · prickar = tyngsta vikt</div>
    </div>
  );
}
