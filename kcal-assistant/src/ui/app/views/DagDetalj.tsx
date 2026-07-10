import { useApi, type DayView } from "../api";
import { ErrorNote } from "../components/Bits";
import { DayBlock } from "../components/DayBlock";

export function DagDetalj({ date }: { date: string }) {
  const { data, error } = useApi<DayView>(`/ui/api/days/${date}`);
  return (
    <>
      <button className="backlink" onClick={() => { location.hash = "#/dagar"; }}>← Alla dagar</button>
      {error ? <ErrorNote message={error} /> : data ? <DayBlock day={data} /> : null}
    </>
  );
}
