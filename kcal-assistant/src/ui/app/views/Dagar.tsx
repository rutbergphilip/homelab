import { useState } from "react";
import { api, sv, useApi, type DaySummary } from "../api";
import { EmptyState, ErrorNote } from "../components/Bits";

const LIMIT = 30;

export function Dagar() {
  const first = useApi<{ days: DaySummary[]; total: number }>(`/ui/api/days?limit=${LIMIT}&offset=0`);
  const [extra, setExtra] = useState<DaySummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  if (first.error) return <ErrorNote message={first.error} />;
  if (!first.data) return null;
  const days = [...first.data.days, ...extra];
  const loadMore = async () => {
    if (loadingMore) return; // re-entrancy guard: a double-click must not fetch the same page twice
    setLoadingMore(true);
    try {
      const page = await api<{ days: DaySummary[]; total: number }>(`/ui/api/days?limit=${LIMIT}&offset=${days.length}`);
      setExtra((xs) => [...xs, ...page.days]);
    } catch (e) { setErr((e as Error).message); }
    setLoadingMore(false);
  };
  return (
    <>
      <h2>Loggade dagar</h2>
      <div>
        {days.map((day) => (
          <button key={day.date} className="rowlink" onClick={() => { location.hash = `#/dagar/${day.date}`; }}>
            <span className="num">{day.date}</span>
            <span className="dim">{day.day_type}</span>
            <span className="grow" />
            <span className="dim">{day.meal_count} mål</span>
            <span className="num">{sv(day.totals.kcal, 0)} kcal</span>
          </button>
        ))}
        {first.data.total === 0 ? <EmptyState>Inga dagar loggade ännu.</EmptyState> : null}
      </div>
      {err ? <ErrorNote message={err} /> : null}
      {days.length < first.data.total ? <button className="loadmore" disabled={loadingMore} onClick={loadMore}>Visa fler</button> : null}
    </>
  );
}
