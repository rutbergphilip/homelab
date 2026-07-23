# Kcal Product Categories (v0.12.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single fixed-vocabulary `category` to products end-to-end (DB → MCP tools → UI) so category-scoped requests ("föreslå ett kvällssnacks") can only ever surface products Philip has categorized accordingly.

**Architecture:** Additive column via the append-only migration array; vocabulary + validator as a single shared constant; partial-update semantics identical to the existing v0.3.1 pattern; behavior contract embedded in MCP tool descriptions; read-only UI gains a chip + client-side filter.

**Tech Stack:** Bun + TypeScript, SQLite (bun:sqlite), zod schemas in `src/tools/schemas.ts`, React 19 UI built by `bun run build:ui`, tests with `bun test` in `kcal-assistant/tests/`.

**Spec:** `docs/superpowers/specs/2026-07-23-kcal-product-categories-design.md`

## Global Constraints

- Work on branch `kcal/categories-v0.12.0`; PR to main; merge is PRE-APPROVED by Philip ("I approve to deploy to main later"). Never push directly to main.
- All work inside `kcal-assistant/` plus the image tag line in `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml`.
- Vocabulary EXACTLY: `snacks, godis, mellis, protein, mejeri, kött/fisk, pålägg, bas, sås/tillbehör, dryck, färdigrätt, frukost`. One category per product, nullable.
- Partial-update semantics on `save_product`: omitted = preserved, `""` = cleared, invalid → Swedish error listing allowed values.
- MCP tool COUNT stays 27 — no new tools, only extended fields/descriptions.
- Migrations are append-only SQL strings in `MIGRATIONS` array (`src/db/migrations.ts`), tracked by `PRAGMA user_version` (currently 6 entries → this adds the 7th).
- All error messages user-facing from tools are Swedish, matching existing guard style.
- Run `bun test` from `kcal-assistant/` after each task; all existing tests must stay green.
- Version bump: `kcal-assistant/package.json` → `0.12.0` AND `deployment.yaml` image tag → `v0.12.0` in the SAME commit (historic gotcha: staging one without the other).

---

### Task 1: Migration + vocabulary + DB layer

**Files:**
- Modify: `kcal-assistant/src/db/migrations.ts` (append 7th entry)
- Create: `kcal-assistant/src/lib/categories.ts`
- Modify: `kcal-assistant/src/db/products.ts` (Product type, save path, searchProducts filter)
- Test: `kcal-assistant/tests/categories.test.ts`

**Interfaces:**
- Produces: `PRODUCT_CATEGORIES: readonly string[]`, `isValidCategory(v: string): boolean`, `categoryError(): string` (the Swedish message listing allowed values) from `src/lib/categories.ts`; `Product.category: string | null`; `searchProducts(db, query, limit?, category?)`.

- [ ] **Step 1: Append migration 7** to the `MIGRATIONS` array in `src/db/migrations.ts`:

```sql
ALTER TABLE products ADD COLUMN category TEXT;
```

(One new array entry, matching the style of existing entries. Append-only — do not touch entries 1–6.)

- [ ] **Step 2: Create `src/lib/categories.ts`**:

```typescript
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
```

- [ ] **Step 3: Write failing tests** in `tests/categories.test.ts` — follow the setup pattern of `tests/meals.test.ts` (in-memory DB + runMigrations). Cases: (a) migration applies and `category` column exists + re-running migrations is a no-op; (b) saving a product with category persists it; (c) update omitting category preserves it; (d) update with `""` clears to NULL; (e) searchProducts with `category` filter returns only matching products; (f) filter with no matches returns empty array. Use the actual exported save/upsert function found in `src/db/products.ts` (read the file; keep its existing signature style — category should ride the same options object as the other partial fields).

- [ ] **Step 4: Run tests, verify the new ones fail** — `cd kcal-assistant && bun test tests/categories.test.ts`.

- [ ] **Step 5: Implement** — `Product` type gains `category: string | null`; the save/upsert path handles category with the exact partial-update semantics the other optional fields use (v0.3.1 pattern is in this file — mirror it); `searchProducts` gains optional `category?: string` appended as `AND category = ?` when provided. Validation with `isValidCategory` happens at the TOOLS layer (Task 2), not in db/ — keep db/ dumb like the rest of the codebase.

- [ ] **Step 6: Run full suite** — `bun test`; all green (new + existing). 

- [ ] **Step 7: Commit** — `git add -A kcal-assistant && git commit -m "feat(kcal): product category column, vocabulary, db layer (migration 7)"`

### Task 2: MCP tools layer + behavior contract

**Files:**
- Modify: `kcal-assistant/src/tools/schemas.ts` (save_product + search_products input schemas)
- Modify: `kcal-assistant/src/tools/products.ts` (wiring, validation, result fields, tool descriptions)
- Modify: `kcal-assistant/src/tools/context.ts` (vocabulary line in get_context)
- Test: `kcal-assistant/tests/categories.test.ts` (extend) or the existing tools-level test file if one covers products — read `tests/` and put tool-layer cases where product tool tests already live.

**Interfaces:**
- Consumes: Task 1's `PRODUCT_CATEGORIES`, `isValidCategory`, `categoryError`, extended `searchProducts`.
- Produces: MCP-visible: `save_product.category` (optional string), `search_products.category` (optional filter), category in `get_product`/`search_products` results, vocabulary in `get_context` output.

- [ ] **Step 1: Failing tests first** (tool layer): invalid category on save → error containing "Ogiltig kategori" and the full vocabulary; valid category round-trips through the tool; search tool passes the filter through; invalid filter value on search → same Swedish error; get_context output contains the vocabulary line.
- [ ] **Step 2: Implement**: zod schemas get `category: z.string().optional()` with descriptions in the established style (Swedish user-facing, English dev-facing — match neighboring fields); tools validate via `isValidCategory` (empty string bypasses validation = clear); results include `category`. Update `save_product`/`search_products` tool descriptions with the behavior contract: *"Kategori styr förslag: när Philip ber om snacks/kvällssnacks, föreslå ENDAST produkter med category 'snacks'; motsvarande för andra kategorier. Finns inga passande — säg det, ersätt aldrig från annan kategori."* Add one compact vocabulary line to get_context (e.g. under preferences: `Produktkategorier: snacks, godis, ...`).
- [ ] **Step 3: `bun test` all green; commit** — `feat(kcal): category in MCP tools + suggestion contract in descriptions`

### Task 3: UI — chip + filter

**Files:**
- Modify: the Produkter view component under `kcal-assistant/src/ui/app/` (locate the products list component; follow the existing Recept search-filter pattern) and `/ui/api/products` handler in `src/ui/api.ts` IF it doesn't already return all product fields (read it — it likely returns full rows; then no API change).

**Interfaces:**
- Consumes: `category` field now present in product rows.

- [ ] **Step 1**: Category chip on each product row (render only when non-null; reuse the existing chip/badge styling used for `verified`/brand markers in that view). Filter `<select>` beside the existing search input: "alla kategorier" (default), the 12 categories, "okategoriserad" (category IS NULL). Client-side filtering composes with the existing text search.
- [ ] **Step 2**: `bun run build:ui` MUST use the existing production build script (`--production` gotcha is baked into it — do not hand-roll a bun build command). Verify the built bundle contains a category string (`grep -c "okategoriserad" src/ui/static/app.js` or wherever the artifact lands per the build script).
- [ ] **Step 3**: `bun test` green (UI has vitest? — run whatever `package.json` test scripts exist); commit — `feat(kcal): category chip + filter in Produkter view`

### Task 4: Release v0.12.0

**Files:**
- Modify: `kcal-assistant/package.json` (version 0.12.0), `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml` (image tag v0.12.0) — SAME commit.

- [ ] **Step 1**: Bump both; commit `release(kcal): v0.12.0 — product categories`; push branch; open PR with summary (spec link, tool changes, migration 7, no breaking changes).
- [ ] **Step 2**: Wait for CI green on the PR (gh pr checks --watch). Merge (squash, per repo precedent) — merge is pre-approved by Philip in this session.
- [ ] **Step 3**: Wait for CI on main to build/push the image, then `task reconcile`; wait for pod `app=kcal-assistant` running `v0.12.0` (note: owned by the `cluster-apps` Kustomization which lags a minute; pod label is `app=kcal-assistant`, NOT app.kubernetes.io/name). Ingress returns 503 for ~10s after Recreate rollouts — wait before verifying.
- [ ] **Step 4**: Verify live: healthz 200; migration applied (exec: sqlite pragma user_version = 7); MCP tools list still 27; category round-trip via a live MCP call if feasible from the pod (or via the /internal parity — NOT exposed there; pod-local sqlite check suffices).

### Task 5: Backfill + review doc (controller-level, after deploy)

- [ ] Controller (not a subagent) categorizes all existing products via the session's Kcal MCP connector (`search_products`/`save_product`) — if the live schema exposes `category` to this session; per-product judgment with Philip's stated examples as anchors (chips ugnsbakade/dipp/dippmix/Nick's glass = snacks; ProPud/kvarg = protein/mejeri, never snacks). Products where the right category is genuinely unclear stay uncategorized and are flagged for Philip.
- [ ] Write grouped review list to `docs/superpowers/specs/2026-07-23-kcal-category-backfill-review.md` (every product under its assigned category + an "okategoriserad/osäker" section), commit to main (docs-only).
- [ ] Final message to Philip: review instructions + reminder to start a NEW claude.ai chat (connector schema caching).

## Self-Review Notes

- Spec coverage: data/MCP/UI/tests/rollout/backfill all mapped to tasks; out-of-scope items absent.
- Exact save-function name in db/products.ts intentionally left as "read the file" — the file's own v0.3.1 partial-update pattern is the binding reference; test code pins behavior regardless of name.
- No placeholder steps; migration SQL, vocabulary module, and behavior-contract text given verbatim.
