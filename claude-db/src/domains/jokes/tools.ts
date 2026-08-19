import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { jsonResult, todayStockholm, wrap } from "../../core/tool-util";
import {
  addJoke,
  findJokes,
  getJoke,
  jokeStats,
  knownAudienceTags,
  listContexts,
  logTelling,
  setRetired,
  updateJoke,
} from "./db";

const verdictSchema = z.enum(["safe", "risky", "never"]);

const jokeFields = {
  text: z.string().min(1).describe("The line itself, verbatim, in Philip's own words (Swedish)"),
  translation: z.string().optional().describe("Optional English gloss"),
  activation: z
    .enum(["active", "trigger"])
    .describe("'active' = can be told whenever an opening appears; 'trigger' = inert until the world supplies its precondition (a prop, an ongoing conversation)"),
  type: z.string().optional().describe("Free label: one-liner, prop, callback, ..."),
  risk: z.number().int().min(1).max(5).describe("1 = aimed at self / harmless, 5 = will cause problems"),
  delivery: z
    .string()
    .min(1)
    .describe("How to land it: timing, gesture, deadpan or not, reply-vs-opener. The part memory drops first."),
  notes: z.string().optional().describe("Provenance/background, e.g. why an earlier version was rejected"),
  triggers: z
    .array(z.string())
    .optional()
    .describe("One situation description per entry — the corpus future situation-matching runs against. Write them rich: synonyms, settings, phrasings."),
  context_ratings: z
    .record(z.string(), verdictSchema)
    .optional()
    .describe("Per-context verdict, e.g. {\"puben\":\"safe\",\"jobbfika\":\"risky\"}. Unknown context names are created."),
};

export function registerJokesTools(server: McpServer, db: Database): void {
  server.registerTool(
    "joke_add",
    {
      description:
        "Add a joke to Philip's personal repertoire. Only jokes he actually tells, in his own voice — never bulk imports. " +
        "Always capture delivery notes and at least one trigger description; ask Philip for them if missing.",
      inputSchema: jokeFields,
    },
    wrap((input) => jsonResult(addJoke(db, input))),
  );

  server.registerTool(
    "joke_update",
    {
      description:
        "Patch a joke. `triggers` and `context_ratings`, when provided, REPLACE the existing sets wholesale — " +
        "send the complete new list, not a delta.",
      inputSchema: {
        joke_id: z.number().int(),
        text: jokeFields.text.optional(),
        translation: jokeFields.translation,
        activation: jokeFields.activation.optional(),
        type: jokeFields.type,
        risk: jokeFields.risk.optional(),
        delivery: jokeFields.delivery.optional(),
        notes: jokeFields.notes,
        triggers: jokeFields.triggers,
        context_ratings: jokeFields.context_ratings,
      },
    },
    wrap(({ joke_id, ...patch }) => jsonResult(updateJoke(db, joke_id, patch))),
  );

  server.registerTool(
    "joke_retire",
    {
      description: "Soft-retire a joke (hidden from joke_find by default; history kept). Never deletes.",
      inputSchema: { joke_id: z.number().int() },
    },
    wrap(({ joke_id }) => jsonResult(setRetired(db, joke_id, true))),
  );

  server.registerTool(
    "joke_unretire",
    {
      description: "Bring a retired joke back into rotation.",
      inputSchema: { joke_id: z.number().int() },
    },
    wrap(({ joke_id }) => jsonResult(setRetired(db, joke_id, false))),
  );

  server.registerTool(
    "joke_get",
    {
      description: "One joke with its full telling history.",
      inputSchema: { joke_id: z.number().int() },
    },
    wrap(({ joke_id }) => jsonResult(getJoke(db, joke_id))),
  );

  server.registerTool(
    "joke_find",
    {
      description:
        "THE retrieval tool: returns the whole active repertoire (triggers, delivery, risk, context verdicts, telling stats) " +
        "for YOU to rank against the situation Philip describes. How to use it: " +
        "(1) Match his described situation semantically against each joke's trigger descriptions — the words won't match, the situation should. " +
        "(2) When he asks generically for 'a joke' with no situation, suggest only activation='active' jokes — trigger jokes are inert without their precondition. " +
        "(3) Pass `context` to hide jokes rated 'never' there; treat 'risky' as a warning to relay, and a missing verdict as unknown, not safe. " +
        "(4) Pass `audience` (who's present) to get heard_by per joke — flag repeats instead of suggesting them cold. " +
        "Present matches ranked, each with its delivery note — the note is the point.",
      inputSchema: {
        context: z.string().optional().describe("Context name, e.g. 'puben' — excludes 'never'-rated jokes"),
        audience: z.array(z.string()).optional().describe("Names of people present, for heard-before flags"),
        include_retired: z.boolean().optional(),
      },
    },
    wrap((input) => jsonResult({ jokes: findJokes(db, input), contexts: listContexts(db).map((c) => c.name) })),
  );

  server.registerTool(
    "joke_log_telling",
    {
      description:
        "Log that a joke was told: when, in what context, to whom, and how it landed (1-5). " +
        "Log every real telling — the honest record is the whole point. " +
        "Reuse names from known_audience_tags in the response; ask Philip rather than guessing new spellings.",
      inputSchema: {
        joke_id: z.number().int(),
        told_on: z.string().optional().describe("YYYY-MM-DD, default today (Stockholm)"),
        context: z.string().optional(),
        audience: z.array(z.string()).optional(),
        rating: z.number().int().min(1).max(5).optional().describe("How it landed: 1 = died, 5 = killed"),
        note: z.string().optional().describe("Why it landed/bombed, if worth remembering"),
      },
    },
    wrap(({ joke_id, told_on, context, audience, rating, note }) => {
      const telling = logTelling(db, {
        joke_id,
        told_on: told_on ?? todayStockholm(),
        context,
        audience,
        rating,
        note,
      });
      return jsonResult({
        telling,
        known_audience_tags: knownAudienceTags(db),
        contexts: listContexts(db).map((c) => c.name),
      });
    }),
  );

  server.registerTool(
    "joke_stats",
    {
      description:
        "The honesty report: jokes ranked by how they actually land (not how fond Philip is of them), " +
        "most told, never told, per-context performance, and who has heard what.",
      inputSchema: {},
    },
    wrap(() => jsonResult(jokeStats(db))),
  );
}
