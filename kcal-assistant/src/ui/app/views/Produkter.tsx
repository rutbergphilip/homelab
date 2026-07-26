import { useEffect, useRef, useState } from "react";
import { sv, useApi, type Product } from "../api";
import { EmptyState, ErrorNote, LeaderRow } from "../components/Bits";
import { KvittoSelect, type SelectOption } from "../components/ui/Select";
import { CATEGORY_ALL, CATEGORY_UNCATEGORIZED, filterProducts } from "../lib/products";
import { PRODUCT_CATEGORIES } from "../../../lib/categories";
import { monogram } from "../../../lib/image-match";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: CATEGORY_ALL, label: "alla kategorier" },
  ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
  { value: CATEGORY_UNCATEGORIZED, label: "okategoriserad" },
];

const imageUrl = (id: number): string => `/ui/api/products/${id}/image`;

// The plate: a mounted photograph, or a deliberately empty frame. alt="" is
// correct — the product name sits directly below in text, so announcing it
// twice would only add noise for a screen reader.
function Plate({ product, large = false }: { product: Product; large?: boolean }) {
  if (!product.has_image) {
    return (
      <div className={`ptile-plate empty${large ? " large" : ""}`}>
        <span className="ptile-monogram">{monogram(product.name, product.brand)}</span>
      </div>
    );
  }
  return (
    <div className={`ptile-plate${large ? " large" : ""}`}>
      <img src={imageUrl(product.id)} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

function ProductTile({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const verified = product.verified === true || product.verified === 1;
  return (
    <button type="button" className="ptile" onClick={onOpen}>
      <div className="ptile-plate-wrap">
        <Plate product={product} />
        {verified ? null : <span className="ptile-flag" title="overifierade värden">?</span>}
      </div>
      <span className="ptile-body">
        <span className="ptile-name">{product.name}</span>
        <span className="ptile-num">
          {product.per_100g ? `${sv(product.per_100g.kcal, 0)} kcal · P ${sv(product.per_100g.protein)}` : "—"}
        </span>
      </span>
    </button>
  );
}

function ProductDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      // Focus trap: the panel is modal, so Tab must cycle inside it.
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // The panel is modal; letting the grid scroll behind it is disorienting,
    // and on a phone the bottom sheet would drag the page with it.
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = bodyOverflow;
      previous?.focus();
    };
  }, [onClose]);

  const m = product.per_100g;
  const verified = product.verified === true || product.verified === 1;
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer" ref={panel} role="dialog" aria-modal="true" aria-label={product.name}>
        <div className="drawer-head">
          <button type="button" className="drawer-close" ref={closeButton} onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>
        <Plate product={product} large />
        <h3 className="drawer-title">{product.name}</h3>
        {product.brand ? <div className="drawer-brand">{product.brand}</div> : null}

        {m ? (
          <div className="drawer-block">
            <div className="drawer-label">per 100 g</div>
            <LeaderRow label="energi" amount={`${sv(m.kcal, 0)} kcal`} />
            <LeaderRow label="protein" amount={`${sv(m.protein)} g`} />
            <LeaderRow label="fett" amount={`${sv(m.fat)} g`} />
            <LeaderRow label="kolhydrat" amount={`${sv(m.carbs)} g`} />
          </div>
        ) : (
          <div className="drawer-block">
            <div className="drawer-label">per 100 g</div>
            <div className="alias">saknas</div>
          </div>
        )}

        {product.portions.length ? (
          <div className="drawer-block">
            <div className="drawer-label">portioner</div>
            {product.portions.map((portion, i) => (
              <LeaderRow
                key={i}
                label={portion.name}
                amount={
                  portion.grams !== null
                    ? `${sv(portion.grams, 0)} g`
                    : `${sv(portion.kcal, 0)} kcal · P ${sv(portion.protein)}`
                }
              />
            ))}
          </div>
        ) : null}

        {product.aliases.length ? (
          <div className="drawer-block">
            <div className="drawer-label">alias</div>
            <div className="alias">{product.aliases.join(", ")}</div>
          </div>
        ) : null}

        {product.notes ? <div className="note">{product.notes}</div> : null}

        <div className="pill-flags">
          <span className={`chip ${verified ? "ok" : "under"}`}>{verified ? "verifierad" : "overifierad"}</span>
          <span className="chip">{product.source}</span>
          {product.category ? <span className="chip">{product.category}</span> : null}
        </div>
      </div>
    </>
  );
}

export function Produkter() {
  const { data, error } = useApi<{ products: Product[] }>("/ui/api/products");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [openId, setOpenId] = useState<number | null>(null);
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;
  const hits = filterProducts(data.products, q, category);
  // Read from the live list, so a filter change can never leave a stale
  // product in the drawer.
  const open = openId === null ? null : (data.products.find((p) => p.id === openId) ?? null);
  return (
    <>
      <h2>Produkter · {data.products.length}</h2>
      <div className="filter-row">
        <input className="search" type="search" placeholder="Sök produkt, alias, märke …" value={q} onChange={(e) => setQ(e.target.value)} />
        <KvittoSelect ariaLabel="Kategori" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
      </div>
      {hits.length === 0 ? <EmptyState>Ingen träff.</EmptyState> : null}
      <div className="pgrid">
        {hits.map((p) => (
          <ProductTile key={p.id} product={p} onOpen={() => setOpenId(p.id)} />
        ))}
      </div>
      {open ? <ProductDrawer product={open} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
