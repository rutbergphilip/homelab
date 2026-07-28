import { useState } from "react";
import { sv, useApi, type RecipeSummary } from "../api";
import { EmptyState, ErrorNote } from "../components/Bits";

export function Recept() {
  const { data, error } = useApi<{ recipes: RecipeSummary[] }>("/ui/api/recipes");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"namn" | "betyg">("namn");
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const needle = q.toLowerCase();
  const hits = data.recipes.filter((r) => !needle || r.name.toLowerCase().includes(needle) || (r.tags || "").toLowerCase().includes(needle));
  // betyg: högst först, obetygsatta sist (namnordning inom samma betyg)
  const sorted =
    sort === "namn"
      ? hits
      : [...hits].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name, "sv"));
  return (
    <>
      <h2>Recept · {data.recipes.length}</h2>
      <input className="search" type="search" placeholder="Sök recept, taggar …" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chip-row">
        {(["namn", "betyg"] as const).map((key) => (
          <button key={key} className={`chip${sort === key ? " accent" : ""}`} onClick={() => setSort(key)}>
            {key}
          </button>
        ))}
      </div>
      {data.recipes.length === 0 ? (
        <EmptyState>Inga recept ännu. Säg åt assistenten: 'spara som recept'.</EmptyState>
      ) : hits.length === 0 ? (
        <EmptyState>Ingen träff.</EmptyState>
      ) : null}
      <div className="rgrid">
        {sorted.map((r) => (
          <button key={r.id} className="rcard" onClick={() => { location.hash = `#/recept/${r.id}`; }}>
            <span className="rcard-name">{r.name}</span>
            {r.tags ? <span className="rcard-tags">{r.tags}</span> : null}
            <span className="rcard-foot">
              <span className="num">{r.kcal_per_serving !== null ? `${sv(r.kcal_per_serving, 0)} kcal/port` : "—"}</span>
              {r.total_minutes !== null ? <span className="dim">~{sv(r.total_minutes, 0)} min</span> : null}
              {r.rating !== null ? <span className="rcard-rating num">★ {sv(r.rating, 1)}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
