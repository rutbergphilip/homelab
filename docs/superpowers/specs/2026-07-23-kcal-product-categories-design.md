# Kcal Product Categories — Design

**Date:** 2026-07-23
**Status:** Approved by Philip (verbally, incl. deploy-to-main authorization; he is away — autonomous execution)
**Target:** kcal-assistant v0.12.0

## Goal

Every product gets exactly **one category** from a fixed Swedish list, so the claude.ai chat can answer "föreslå ett kvällssnacks" from *Philip's* definition of snacks (chips ugnsbakade, dipp med dippmix, Nick's glass...) and can **never** suggest a non-snack (ProPud, plain kvarg) for a snack request.

## Decisions (from brainstorm)

- **One category per product** (Philip first chose multi-tags, then reversed to single category — final).
- Category semantics = **the role the product plays for Philip**, not food taxonomy (Nick's glass → `snacks`).
- Fixed vocabulary, single constants list in code:
  `snacks, godis, mellis, protein, mejeri, kött/fisk, pålägg, bas, sås/tillbehör, dryck, färdigrätt, frukost`
- Nullable column; NULL renders as "okategoriserad". Unknown value on write → Swedish validation error listing allowed values.
- **Backfill:** after deploy, Claude bulk-categorizes all existing products via MCP `save_product`; Philip reviews a grouped list and corrects. (Executed by the deploying session if the live tool schema allows; otherwise left as a prepared chat task.)

## Scope

### Data
- Migration 7: `ALTER TABLE products ADD COLUMN category TEXT` (nullable, no default).
- Vocabulary constant + validator shared by MCP and any future writer.

### MCP (additive, no breaking changes; tool count unchanged at 27)
- `save_product`: optional `category` — partial-update semantics identical to v0.3.1 (omitted = preserved, `""` = cleared, invalid → Swedish error naming allowed values).
- `get_product`, `search_products`: include `category` in results.
- `search_products`: new optional `category` filter (exact match against vocabulary; invalid → same validation error).
- `get_context`: expose the category vocabulary (one compact line) so the chat always knows legal values.
- **Tool descriptions carry the behavior contract** (durable layer per v0.3.1 learning): snacks/kvällssnacks requests → suggest ONLY `category: "snacks"` products; if none fit, say so — never substitute from another category. Same principle applies generally: a category-scoped request stays inside that category.

### UI (KCAL·DB, read-only as established)
- Produkter: category chip per row; filter select beside the existing search (client-side, "alla" default, "okategoriserad" option). No UI writes — category edits go via MCP, consistent with the UI single-write policy (profile/plan only).

### Tests
- Migration applies + is idempotent on re-run.
- save_product: category set / preserved-when-omitted / cleared-on-empty / rejected-when-invalid (Swedish message).
- search_products category filter incl. no-match and invalid value.
- Regression pin: resolveItem / recipe / meal flows unaffected by the new column.

## Out of scope
- Multi-tags (explicitly reversed), category editing in UI, category-based targets/statistics, ICA auto-categorization.

## Rollout
1. Feature branch → PR → merge to main (pre-approved) → CI builds `rutbergphilip/kcal-assistant:v0.12.0` → Flux deploys. Bump `package.json` version AND `deployment.yaml` tag in the same PR (known gotcha).
2. Verify live: healthz, `/mcp` tools list, category round-trip via MCP.
3. Backfill: categorize all ~70 products; output grouped review list to `docs/superpowers/specs/2026-07-23-kcal-category-backfill-review.md` for Philip.
4. Philip: new claude.ai chat (connector caches tool schemas per conversation) + corrects any miscategorizations in chat.
