# claude-db — Fragrance Acquisition Advisor (v0.2.0)

**Date:** 2026-08-02
**Status:** Approved (continuation of the claude-db platform; user delegated approval)
**Builds on:** `2026-08-02-claude-db-mcp-platform-design.md`

## Purpose

Let Philip ask Claude "what should my next fragrance be?" and get an answer grounded in
(a) his taste (stated preferences + wear ratings), (b) collection gaps, and (c) live
retail prices in Sweden. Adds 5 tools to the fragrance domain.

## Retailer feasibility (probed 2026-08-02)

| Retailer | Server-side? | How |
|---|---|---|
| Kicks.se | ✅ | `GET /internal/search/quicksearch?searchtext=<q>` — clean JSON: name, brand, priceText ("2 625 kr"), product URL |
| Deloox.se | ✅ | `GET /api/search?keyword=<q>` — HTML suggest fragment (name + product URL); price via product page's schema.org JSON-LD (`"@type":"Offer"... "price":"2213.00"`) |
| Notino.se | ❌ 403 bot-wall | Claude's own web search; persist finds via `fragrance_save_offer` |
| Fragrantica | ❌ bot-wall (known) | Claude browser scrape (existing snapshot flow) |
| Lyko / Parfym.se | ❌ no stable endpoint found | Claude's own web search + `fragrance_save_offer` |

The tool description encodes this split so any Claude knows which retailers it must
search itself.

## Schema (fragrance migration 2, append-only)

```sql
fragrance_preferences (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('gillar','ogillar','regel','budget')),
  content TEXT NOT NULL,          -- "älskar boozy/vanilj på vintern", "max ~2500 kr", ...
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

fragrance_offers (
  id INTEGER PRIMARY KEY,
  fragrance_id INTEGER NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL,         -- 'kicks', 'deloox', 'notino', ...
  url TEXT,
  price_sek REAL,
  size_ml REAL,
  note TEXT,                      -- "kampanj -20%", "endast testers"
  found_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Offers attach to `fragrances` rows — candidates enter as `status: wishlist` first
(existing flow), which keeps one identity per fragrance across snapshots, offers and an
eventual purchase (status flip to owned).

## New tools (5 → fragrance domain totals 14)

| Tool | Purpose |
|---|---|
| `fragrance_save_preference` | Persist taste/rules: gillar / ogillar / regel / budget |
| `fragrance_delete_preference` | Remove one by id (deactivate) |
| `fragrance_search_retailers` | Live search Kicks + Deloox in parallel (6s timeout each, per-retailer graceful failure). Returns `{retailer, name, brand, price_sek, size_ml?, url}`; description tells Claude to cover Notino/Lyko/Parfym.se via its own web search |
| `fragrance_save_offer` | Persist a price find (any retailer incl. web-searched ones) on a fragrance |
| `fragrance_acquisition_context` | One-call advisor payload: active preferences, owned collection (accords/seasons/wear stats), accord-coverage tally, wishlist with offers, today's date. Description guides: find gaps vs preferences/seasons → propose candidates → wishlist + snapshot + offers |

`fragrance_get` also gains offers in its detail payload.

## Implementation notes

- `src/domains/fragrance/retailers.ts`: thin `fetch` (browser UA, `AbortSignal.timeout(6000)`)
  + pure parse functions (`parseKicks`, `parseDelooxSuggest`, `parseDelooxProductLd`,
  `parsePriceSek`, `parseSizeMl`) so tests run on fixtures, no network.
- Deloox price flow: suggest → top 3 product URLs → fetch each page's JSON-LD in
  parallel. Worst case ~4 requests, all inside the 6s budget.
- A retailer that errors returns `{retailer, error}` instead of failing the tool.
- Prices stored raw as found; no currency conversion (SEK only).

## Testing

Fixture-based parser tests (Kicks JSON, Deloox suggest HTML, JSON-LD, price/size
strings) + db tests for preferences/offers/acquisition context. No live HTTP in CI.

## Success criteria

1. "Vad ska jag köpa härnäst?" in claude.ai → one `fragrance_acquisition_context` call
   returns preferences + collection profile + wishlist w/ prices.
2. `fragrance_search_retailers("le male elixir")` from the live cluster returns real
   Kicks + Deloox hits with SEK prices.
3. Preferences and offers persist across chats.
