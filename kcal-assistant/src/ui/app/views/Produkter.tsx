import { useState } from "react";
import { sv, useApi, type Product } from "../api";
import { EmptyState, ErrorNote, macroLine } from "../components/Bits";
import { KvittoSelect, type SelectOption } from "../components/ui/Select";
import { CATEGORY_ALL, CATEGORY_UNCATEGORIZED, filterProducts } from "../lib/products";
import { PRODUCT_CATEGORIES } from "../../../lib/categories";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: CATEGORY_ALL, label: "alla kategorier" },
  ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
  { value: CATEGORY_UNCATEGORIZED, label: "okategoriserad" },
];

export function Produkter() {
  const { data, error } = useApi<{ products: Product[] }>("/ui/api/products");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const hits = filterProducts(data.products, q, category);
  return (
    <>
      <h2>Produkter · {data.products.length}</h2>
      <div className="filter-row">
        <input className="search" type="search" placeholder="Sök produkt, alias, märke …" value={q} onChange={(e) => setQ(e.target.value)} />
        <KvittoSelect ariaLabel="Kategori" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
      </div>
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
              {p.category ? <span className="chip">{p.category}</span> : null}
            </div>
          </div>
        </details>
      ))}
    </>
  );
}
