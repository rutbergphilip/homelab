import { useState } from "react";
import { sv, useApi, type RecipeSummary } from "../api";
import { EmptyState, ErrorNote } from "../components/Bits";

export function Recept() {
  const { data, error } = useApi<{ recipes: RecipeSummary[] }>("/ui/api/recipes");
  const [q, setQ] = useState("");
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const needle = q.toLowerCase();
  const hits = data.recipes.filter((r) => !needle || r.name.toLowerCase().includes(needle) || (r.tags || "").toLowerCase().includes(needle));
  return (
    <>
      <h2>Recept · {data.recipes.length}</h2>
      <input className="search" type="search" placeholder="Sök recept, taggar …" value={q} onChange={(e) => setQ(e.target.value)} />
      {data.recipes.length === 0 ? (
        <EmptyState>Inga recept ännu. Säg åt assistenten: 'spara som recept'.</EmptyState>
      ) : hits.length === 0 ? (
        <EmptyState>Ingen träff.</EmptyState>
      ) : null}
      <div className="rgrid">
        {hits.map((r) => (
          <button key={r.id} className="rcard" onClick={() => { location.hash = `#/recept/${r.id}`; }}>
            <span className="rcard-name">{r.name}</span>
            {r.tags ? <span className="rcard-tags">{r.tags}</span> : null}
            <span className="rcard-foot">
              <span className="num">{r.kcal_per_serving !== null ? `${sv(r.kcal_per_serving, 0)} kcal/port` : "—"}</span>
              {r.total_minutes !== null ? <span className="dim">~{sv(r.total_minutes, 0)} min</span> : null}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
