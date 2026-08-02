import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { jsonResult, wrap } from "../../core/tool-util";
import {
  addItem,
  createCollection,
  deleteCollection,
  deleteItem,
  listCollections,
  queryItems,
  resolveCollection,
  updateItem,
} from "./db";

const refShape = {
  collection_id: z.number().int().optional(),
  collection: z.string().optional().describe("Collection name (case-insensitive)"),
};

const dataSchema = z.record(z.string(), z.unknown());

export function registerCollectionsTools(server: McpServer, db: Database): void {
  server.registerTool(
    "collection_create",
    {
      description:
        "Create a new ad-hoc collection (a named list of JSON items) — for anything Philip wants tracked " +
        "that doesn't have a dedicated domain yet: gift ideas, wines tried, books, whatever. Set item_hint " +
        "to document the fields you intend to use (e.g. {\"title\":\"string\",\"rating\":\"1-10\"}) so future " +
        "chats stay consistent. Check collection_list first to avoid duplicates.",
      inputSchema: {
        name: z.string().min(1).max(60),
        description: z.string().optional(),
        item_hint: z.record(z.string(), z.string()).optional(),
      },
    },
    wrap((input) => jsonResult(createCollection(db, input))),
  );

  server.registerTool(
    "collection_list",
    {
      description: "List all collections with item counts and their item_hint field conventions.",
      inputSchema: {},
    },
    wrap(() => jsonResult(listCollections(db))),
  );

  server.registerTool(
    "collection_delete",
    {
      description: "Delete a collection AND all its items. Irreversible — confirm with Philip first.",
      inputSchema: { ...refShape, confirm: z.literal(true) },
    },
    wrap(({ collection_id, collection }) => {
      const row = resolveCollection(db, { id: collection_id, name: collection });
      deleteCollection(db, row.id);
      return jsonResult({ ok: true, deleted: row.name });
    }),
  );

  server.registerTool(
    "collection_add_item",
    {
      description:
        "Add an item (arbitrary JSON object) to a collection. Follow the collection's item_hint fields when set.",
      inputSchema: { ...refShape, data: dataSchema },
    },
    wrap(({ collection_id, collection, data }) => {
      const row = resolveCollection(db, { id: collection_id, name: collection });
      return jsonResult(addItem(db, row.id, data));
    }),
  );

  server.registerTool(
    "collection_update_item",
    {
      description: "Patch an item's data: shallow merge; set a key to null to delete that key.",
      inputSchema: { item_id: z.number().int(), patch: dataSchema },
    },
    wrap(({ item_id, patch }) => jsonResult(updateItem(db, item_id, patch))),
  );

  server.registerTool(
    "collection_delete_item",
    {
      description: "Delete a single item by id.",
      inputSchema: { item_id: z.number().int() },
    },
    wrap(({ item_id }) => {
      deleteItem(db, item_id);
      return jsonResult({ ok: true, deleted: item_id });
    }),
  );

  server.registerTool(
    "collection_query",
    {
      description:
        "Query a collection's items, newest first. `where` matches exact field values " +
        "(e.g. {\"category\":\"wine\"}), `search` is a case-insensitive substring match across each item's " +
        "whole JSON. Returns total count for pagination.",
      inputSchema: {
        ...refShape,
        where: dataSchema.optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional().describe("Default 50"),
        offset: z.number().int().min(0).optional(),
      },
    },
    wrap(({ collection_id, collection, ...opts }) => {
      const row = resolveCollection(db, { id: collection_id, name: collection });
      return jsonResult(queryItems(db, row.id, opts));
    }),
  );
}
