import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { savePreference, deletePreference } from "../db/preferences";
import { jsonResult, wrap } from "./util";

export function registerPreferenceTools(server: McpServer, db: Database): void {
  server.registerTool(
    "save_preference",
    {
      description:
        "Save a standing rule or style preference so it applies in every future conversation (returned by get_context). Pass id to rewrite an existing one. Categories: 'regel' (diet/counting rules), 'stil' (response format), 'mål' (goals).",
      inputSchema: {
        id: z.number().int().optional(),
        content: z.string().min(1).describe("The rule, in Swedish"),
        category: z.enum(["regel", "stil", "mål"]).optional(),
        sort_order: z.number().int().optional(),
      },
    },
    wrap((input) => jsonResult({ preferences: savePreference(db, input) })),
  );

  server.registerTool(
    "delete_preference",
    {
      description: "Retire a standing rule by id. Returns the remaining active preferences.",
      inputSchema: { id: z.number().int() },
    },
    wrap(({ id }) => jsonResult({ preferences: deletePreference(db, id) })),
  );
}
