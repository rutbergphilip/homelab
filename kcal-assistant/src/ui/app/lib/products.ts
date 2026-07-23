import type { Product } from "../api";

// Sentinel values for the category <select>. Non-empty on purpose — Radix
// Select.Root treats value="" as "nothing selected" (falls back to the
// placeholder), so "alla kategorier" needs its own non-empty sentinel to
// render as the selected item.
export const CATEGORY_ALL = "__all__";
export const CATEGORY_UNCATEGORIZED = "__uncategorized__";

function matchesCategory(p: Product, category: string): boolean {
  if (category === CATEGORY_ALL) return true;
  if (category === CATEGORY_UNCATEGORIZED) return p.category === null;
  return p.category === category;
}

function matchesQuery(p: Product, needle: string): boolean {
  if (!needle) return true;
  return (
    p.name.toLowerCase().includes(needle) ||
    (p.brand || "").toLowerCase().includes(needle) ||
    p.aliases.some((a) => a.toLowerCase().includes(needle))
  );
}

export function matchesProduct(p: Product, needle: string, category: string): boolean {
  return matchesCategory(p, category) && matchesQuery(p, needle);
}

export function filterProducts(products: Product[], query: string, category: string): Product[] {
  const needle = query.toLowerCase();
  return products.filter((p) => matchesProduct(p, needle, category));
}
