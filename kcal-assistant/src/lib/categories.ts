// En kategori per produkt — rollen produkten spelar för Philip, inte livsmedelstaxonomi.
export const PRODUCT_CATEGORIES = [
  "snacks", "godis", "mellis", "protein", "mejeri", "kött/fisk",
  "pålägg", "bas", "sås/tillbehör", "dryck", "färdigrätt", "frukost",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isValidCategory(v: string): v is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(v);
}

export function categoryError(): string {
  return `Ogiltig kategori. Tillåtna värden: ${PRODUCT_CATEGORIES.join(", ")}.`;
}
