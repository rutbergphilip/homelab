import { useState } from "react";
import { sv, useApi, type Product } from "../api";
import { EmptyState, ErrorNote, macroLine } from "../components/Bits";

export function Produkter() {
  const { data, error } = useApi<{ products: Product[] }>("/ui/api/products");
  const [q, setQ] = useState("");
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const needle = q.toLowerCase();
  const hits = data.products.filter(
    (p) => !needle || p.name.toLowerCase().includes(needle) || (p.brand || "").toLowerCase().includes(needle) || p.aliases.some((a) => a.toLowerCase().includes(needle)),
  );
  return (
    <>
      <h2>Produkter · {data.products.length}</h2>
      <input className="search" type="search" placeholder="Sök produkt, alias, märke …" value={q} onChange={(e) => setQ(e.target.value)} />
      {hits.length === 0 ? <EmptyState>Ingen träff.</EmptyState> : null}
      {hits.map((p) => (
        <details className="card" key={p.id}>
          <summary>
            <span>{p.name}</span>
            <span className="leader" />
            <span className="num">{p.per_100g ? `${sv(p.per_100g.kcal, 0)} kcal · P ${sv(p.per_100g.protein)}` : "—"}</span>
          </summary>
          <div className="body">
            {p.brand ? <div className="alias">{p.brand}</div> : null}
            {p.per_100g ? <div className="macro-line">per 100 g: {macroLine(p.per_100g)}</div> : null}
            {p.portions.map((portion, i) => (
              <div className="macro-line" key={i}>
                {portion.grams !== null
                  ? `${portion.name}: ${sv(portion.grams, 0)} g`
                  : `${portion.name}: ${sv(portion.kcal, 0)} kcal · P ${sv(portion.protein)} · F ${sv(portion.fat)} · K ${sv(portion.carbs)}`}
              </div>
            ))}
            {p.aliases.length ? <div className="alias">alias: {p.aliases.join(", ")}</div> : null}
            {p.notes ? <div className="note">{p.notes}</div> : null}
            <div className="pill-flags">
              <span className={`chip ${p.verified ? "ok" : "under"}`}>{p.verified ? "verifierad" : "overifierad"}</span>
              <span className="chip">{p.source}</span>
            </div>
          </div>
        </details>
      ))}
    </>
  );
}
