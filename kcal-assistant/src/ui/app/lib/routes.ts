// Route table kept free of JSX so it stays a pure, testable function: hash in,
// which view + how wide out. index.tsx owns the hash → element mapping.

export type ViewWidth = "narrow" | "wide";

export type ViewName =
  | "idag"
  | "vecka"
  | "dagar"
  | "dagDetalj"
  | "produkter"
  | "recept"
  | "receptDetalj"
  | "vikt"
  | "regler";

export interface RouteMatch {
  tab: string;
  view: ViewName;
  width: ViewWidth;
  param?: string;
}

// Width is a property of the ROUTE, not the tab: Recept is a wide card grid
// but a single recipe is a column of prose, and the same split applies to
// Dagar vs one day. Deriving it from `tab` would get both wrong.
const ROUTES: Array<{ pattern: RegExp; tab: string; view: ViewName; width: ViewWidth }> = [
  { pattern: /^#\/idag$/, tab: "idag", view: "idag", width: "narrow" },
  { pattern: /^#\/vecka$/, tab: "vecka", view: "vecka", width: "wide" },
  // Dagar stays narrow deliberately: it is a chronological ledger of leader
  // rows, and stretching it puts the date and its numbers a metre apart with
  // a dotted line between. Width only helps content that becomes a grid.
  { pattern: /^#\/dagar$/, tab: "dagar", view: "dagar", width: "narrow" },
  { pattern: /^#\/dagar\/(\d{4}-\d{2}-\d{2})$/, tab: "dagar", view: "dagDetalj", width: "narrow" },
  { pattern: /^#\/produkter$/, tab: "produkter", view: "produkter", width: "wide" },
  { pattern: /^#\/recept$/, tab: "recept", view: "recept", width: "wide" },
  { pattern: /^#\/recept\/(\d+)$/, tab: "recept", view: "receptDetalj", width: "narrow" },
  { pattern: /^#\/vikt$/, tab: "vikt", view: "vikt", width: "narrow" },
  { pattern: /^#\/regler$/, tab: "regler", view: "regler", width: "narrow" },
];

export function matchRoute(hash: string): RouteMatch | null {
  for (const route of ROUTES) {
    const m = hash.match(route.pattern);
    if (m) {
      return {
        tab: route.tab,
        view: route.view,
        width: route.width,
        ...(m[1] !== undefined && { param: m[1] }),
      };
    }
  }
  return null;
}
