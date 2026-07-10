import { useApi, sv, type OverviewView } from "../api";
import { Tile, ErrorNote } from "../components/Bits";
import { DayBlock } from "../components/DayBlock";

export function Idag() {
  const { data, error } = useApi<OverviewView>("/ui/api/overview");
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const t = data.trend;
  return (
    <>
      <DayBlock day={data.day} />
      {t.latest ? (
        <>
          <h2>Vikt</h2>
          <div className="tiles">
            <Tile label="Senast" value={`${sv(t.latest.weight_kg)} kg`} sub={t.latest.date} />
            {t.trend ? <Tile label="Takt" value={`${sv(t.trend.rate_kg_week)} kg/v`} sub={`${sv(t.trend.delta_kg)} kg på ${sv(t.trend.span_days, 0)} d`} /> : null}
            {t.trend && t.trend.est_tdee !== null ? <Tile label="TDEE" value={sv(t.trend.est_tdee, 0)} sub={t.trend.uncertain ? "osäker (gles logg)" : "baklängesräknad"} /> : null}
          </div>
        </>
      ) : null}
      <h2>Veckosnitt</h2>
      <div className="tiles">
        <Tile label="Dagar loggade" value={`${data.week.days_logged} / 7`} sub={`${data.week.start_date} – ${data.week.end_date}`} />
        {data.week.avg_logged ? (
          <>
            <Tile label="Snitt kcal" value={sv(data.week.avg_logged.kcal, 0)} sub={`mål ${sv(data.week.avg_target_kcal, 0)}`} />
            <Tile label="Snitt protein" value={`${sv(data.week.avg_logged.protein)} g`} sub="över loggade dagar" />
          </>
        ) : null}
      </div>
    </>
  );
}
