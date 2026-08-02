import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { jsonResult, wrap, todayStockholm, isValidDate } from "../../core/tool-util";
import {
  addFragrance,
  buildAcquisitionContext,
  buildContext,
  deletePreference,
  getFragranceDetail,
  listFragrances,
  logWear,
  removeFragrance,
  resolveFragrance,
  saveOffer,
  savePreference,
  saveSnapshot,
  updateFragrance,
  wearHistory,
} from "./db";
import { searchRetailers } from "./retailers";

// The Fragrantica snapshot blob, validated on every save. Scraped by a Claude
// with browser access (the server never calls Fragrantica — their anti-bot
// blocks server-side fetches). Passthrough is deliberate: extra fields a
// future scrape finds useful are kept, the listed core is guaranteed.
const snapshotSchema = z
  .object({
    rating: z.number().min(0).max(5).nullable(),
    rating_count: z.number().int().nullable(),
    accords: z.array(z.object({ name: z.string(), strength: z.number().min(0).max(100).nullable() })),
    notes: z.union([
      z.object({ top: z.array(z.string()), heart: z.array(z.string()), base: z.array(z.string()) }),
      z.object({ uncategorized: z.array(z.string()) }),
    ]),
    seasons: z.record(z.string(), z.number().min(0).max(100).nullable()).nullable(),
    longevity: z.record(z.string(), z.number()).nullable(),
    sillage: z.record(z.string(), z.number()).nullable(),
    gender_vote: z.record(z.string(), z.number()).nullable(),
    price_value: z.record(z.string(), z.number()).nullable(),
    description: z.string().nullable(),
  })
  .passthrough();

const SNAPSHOT_SHAPE_DOC =
  "Snapshot shape: { rating: 0-5|null, rating_count, accords: [{name, strength 0-100|null}], " +
  "notes: {top:[],heart:[],base:[]} or {uncategorized:[]}, seasons: {winter,spring,summer,fall,day,night: %|null}, " +
  "longevity/sillage/gender_vote/price_value: {label: votes}|null, description: string|null }";

const dateSchema = z
  .string()
  .refine(isValidDate, { message: "date must be YYYY-MM-DD" });

const refShape = {
  id: z.number().int().optional().describe("Fragrance id (preferred when known)"),
  name: z.string().optional().describe("Fuzzy match against 'house name', e.g. 'elixir'"),
};

export function registerFragranceTools(server: McpServer, db: Database): void {
  server.registerTool(
    "fragrance_add",
    {
      description:
        "Add a fragrance to Philip's collection. status: owned (default) | wishlist | finished | sold. " +
        "Include the Fragrantica URL when known. If you have browsed the Fragrantica page, pass the scraped " +
        "data as `fragrantica` in the same call. " +
        SNAPSHOT_SHAPE_DOC,
      inputSchema: {
        house: z.string().min(1),
        name: z.string().min(1),
        status: z.enum(["owned", "wishlist", "finished", "sold"]).optional(),
        concentration: z.string().optional().describe("EdT, EdP, Parfum, Elixir ..."),
        size_ml: z.number().positive().optional(),
        year: z.number().int().optional(),
        perfumer: z.string().optional(),
        fragrantica_url: z.string().url().optional(),
        personal_notes: z.string().optional().describe("Philip's own take on it"),
        fragrantica: snapshotSchema.optional(),
      },
    },
    wrap(({ fragrantica, ...input }) =>
      jsonResult(addFragrance(db, input, fragrantica ? JSON.stringify(fragrantica) : undefined)),
    ),
  );

  server.registerTool(
    "fragrance_update",
    {
      description:
        "Update fragrance metadata/status/personal notes by id. Prefer setting status to finished/sold over " +
        "fragrance_remove — history stays intact.",
      inputSchema: {
        id: z.number().int(),
        house: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        status: z.enum(["owned", "wishlist", "finished", "sold"]).optional(),
        concentration: z.string().nullable().optional(),
        size_ml: z.number().positive().nullable().optional(),
        year: z.number().int().nullable().optional(),
        perfumer: z.string().nullable().optional(),
        fragrantica_url: z.string().url().nullable().optional(),
        personal_notes: z.string().nullable().optional(),
      },
    },
    wrap(({ id, ...patch }) => jsonResult(updateFragrance(db, id, patch))),
  );

  server.registerTool(
    "fragrance_remove",
    {
      description:
        "Hard-delete a fragrance AND its wear history. Almost always wrong — use fragrance_update with " +
        "status finished/sold instead. Only for true mistakes (duplicate entry etc).",
      inputSchema: { id: z.number().int(), confirm: z.literal(true) },
    },
    wrap(({ id }) => {
      removeFragrance(db, id);
      return jsonResult({ ok: true, deleted: id });
    }),
  );

  server.registerTool(
    "fragrance_list",
    {
      description: "Compact list of fragrances. Default: whole collection grouped by status.",
      inputSchema: {
        status: z.enum(["owned", "wishlist", "finished", "sold"]).optional(),
      },
    },
    wrap(({ status }) => jsonResult(listFragrances(db, status))),
  );

  server.registerTool(
    "fragrance_get",
    {
      description:
        "Full detail for one fragrance: metadata, complete Fragrantica snapshot (accords, notes pyramid, " +
        "seasons, longevity, sillage, description) and the last 10 wears.",
      inputSchema: refShape,
    },
    wrap((ref) => jsonResult(getFragranceDetail(db, resolveFragrance(db, ref)))),
  );

  server.registerTool(
    "fragrance_save_snapshot",
    {
      description:
        "Save or refresh the Fragrantica data blob for a fragrance (stamps scraped_at). Use after browsing " +
        "the fragrance's Fragrantica page. " +
        SNAPSHOT_SHAPE_DOC,
      inputSchema: { ...refShape, fragrantica: snapshotSchema },
    },
    wrap(({ fragrantica, ...ref }) => {
      const row = resolveFragrance(db, ref);
      const updated = saveSnapshot(db, row.id, JSON.stringify(fragrantica));
      return jsonResult({ ok: true, id: updated.id, scraped_at: updated.fragrantica_scraped_at });
    }),
  );

  server.registerTool(
    "fragrance_log_wear",
    {
      description:
        "Log that Philip wore a fragrance. Date defaults to today (Europe/Stockholm). Capture occasion " +
        "('date night', 'office', 'gym', ...), weather, sprays, how well it worked (rating 1-10) and any " +
        "compliments — this is what makes future recommendations personal.",
      inputSchema: {
        ...refShape,
        worn_on: dateSchema.optional(),
        occasion: z.string().optional(),
        weather: z.string().optional().describe("E.g. 'kallt -5°C', 'varm sommarkväll'"),
        sprays: z.number().int().positive().max(30).optional(),
        rating: z.number().int().min(1).max(10).optional().describe("How well it worked that day"),
        compliments: z.string().optional().describe("Who said what, if anything"),
        notes: z.string().optional(),
      },
    },
    wrap(({ id, name, worn_on, ...rest }) => {
      const row = resolveFragrance(db, { id, name });
      const wear = logWear(db, { fragrance_id: row.id, worn_on: worn_on ?? todayStockholm(), ...rest });
      return jsonResult({ ...wear, fragrance: `${row.house} ${row.name}` });
    }),
  );

  server.registerTool(
    "fragrance_wear_history",
    {
      description:
        "Wear log with filters, plus per-fragrance aggregates (wear count, last worn, avg rating). " +
        "Use to answer 'when did I last wear X', 'what do I reach for at the office', rotation gaps.",
      inputSchema: {
        ...refShape,
        occasion: z.string().optional().describe("Substring filter, e.g. 'date'"),
        since: dateSchema.optional(),
        limit: z.number().int().min(1).max(200).optional().describe("Default 50"),
      },
    },
    wrap(({ id, name, ...filters }) => {
      const fragrance_id = id !== undefined || name !== undefined ? resolveFragrance(db, { id, name }).id : undefined;
      return jsonResult(wearHistory(db, { fragrance_id, ...filters }));
    }),
  );

  server.registerTool(
    "fragrance_save_preference",
    {
      description:
        "Persist a lasting taste preference or buying rule, so future 'what should I buy?' chats know Philip. " +
        "category: gillar (loves: notes/accords/styles), ogillar (dislikes/dealbreakers), regel (rules like " +
        "'inga dupes', 'nischigt till dejter'), budget ('max ~2500 kr per flaska'). Save when Philip expresses " +
        "a durable opinion — not one-off remarks.",
      inputSchema: {
        category: z.enum(["gillar", "ogillar", "regel", "budget"]),
        content: z.string().min(1),
      },
    },
    wrap(({ category, content }) => jsonResult(savePreference(db, category, content))),
  );

  server.registerTool(
    "fragrance_delete_preference",
    {
      description: "Deactivate a preference by id (they're listed in fragrance_acquisition_context).",
      inputSchema: { id: z.number().int() },
    },
    wrap(({ id }) => {
      deletePreference(db, id);
      return jsonResult({ ok: true, deleted: id });
    }),
  );

  server.registerTool(
    "fragrance_search_retailers",
    {
      description:
        "Live-search Swedish perfume retailers server-side and return {retailer, name, brand, price_sek, " +
        "size_ml, url} per hit. Covers ONLY Kicks and Deloox (the ones reachable server-side). Notino, Lyko, " +
        "Parfym.se and Fragrantica block servers — search those YOURSELF with web search when comparing " +
        "prices, and persist good finds with fragrance_save_offer. A retailer entry may carry an `error` " +
        "field; report it casually rather than failing the comparison.",
      inputSchema: {
        query: z.string().min(2).describe("Fragrance name, e.g. 'le male elixir'"),
        limit: z.number().int().min(1).max(10).optional().describe("Max hits per retailer, default 5"),
      },
    },
    wrap(async ({ query, limit }) => jsonResult(await searchRetailers(query, limit ?? 5))),
  );

  server.registerTool(
    "fragrance_save_offer",
    {
      description:
        "Record a retail price/availability find for a fragrance (typically a wishlist candidate). Use after " +
        "fragrance_search_retailers or your own web search of Notino/Lyko/Parfym.se etc. The fragrance must " +
        "exist — add candidates with fragrance_add status=wishlist first.",
      inputSchema: {
        ...refShape,
        retailer: z.string().min(2).describe("kicks, deloox, notino, lyko, parfym.se, ..."),
        price_sek: z.number().positive().optional(),
        size_ml: z.number().positive().optional(),
        url: z.string().url().optional(),
        note: z.string().optional().describe("E.g. 'kampanj -20%', 'slut i lager'"),
      },
    },
    wrap(({ id, name, ...offer }) => {
      const row = resolveFragrance(db, { id, name });
      return jsonResult({ ...saveOffer(db, { fragrance_id: row.id, ...offer }), fragrance: `${row.house} ${row.name}` });
    }),
  );

  server.registerTool(
    "fragrance_acquisition_context",
    {
      description:
        "THE tool for 'what should my next fragrance be?' — one call returns Philip's taste preferences, the " +
        "owned collection profile (top accords, seasons, wear stats incl. ratings), an accord-coverage tally " +
        "(what's overrepresented vs missing), and the wishlist with saved retail offers. Reason from: gaps in " +
        "accord/season coverage, what he actually wears and rates highly, stated preferences and budget. " +
        "Propose specific candidates; for each serious one: fragrance_add as wishlist, scrape its Fragrantica " +
        "page into a snapshot if you can browse, then price it via fragrance_search_retailers + your own web " +
        "search (Notino/Lyko/Parfym.se) and persist with fragrance_save_offer.",
      inputSchema: {},
    },
    wrap(() => jsonResult(buildAcquisitionContext(db, todayStockholm()))),
  );

  server.registerTool(
    "fragrance_context",
    {
      description:
        "THE tool for 'what should I wear?' — one call returns the whole owned collection with Fragrantica " +
        "essentials (rating, accords, notes, season votes, longevity, sillage), Philip's personal notes, and " +
        "wear stats (last worn, occasions, avg rating). Combine with the occasion/weather from the " +
        "conversation to recommend; favor season fit, occasion history and rotation (avoid what was just worn). " +
        "After Philip decides, log it with fragrance_log_wear.",
      inputSchema: {},
    },
    wrap(() => jsonResult(buildContext(db, todayStockholm()))),
  );
}
