import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { registerContextTools } from "./tools/context";
import { registerProductTools } from "./tools/products";
import { registerMealTools } from "./tools/meals";
import { registerPreferenceTools } from "./tools/preferences";
import { registerNutritionTools } from "./tools/nutrition";
import { registerStoreTools } from "./tools/store";
import { registerWeightTools } from "./tools/weights";
import { registerRecipeTools } from "./tools/recipes";

// A fresh McpServer per request (stateless Streamable HTTP). The Database is
// the shared singleton — safe because bun:sqlite is synchronous.
export function buildMcpServer(db: Database): McpServer {
  const server = new McpServer({ name: "kcal-assistant", version: "0.1.0" });
  registerContextTools(server, db);
  registerProductTools(server, db);
  registerMealTools(server, db);
  registerPreferenceTools(server, db);
  registerNutritionTools(server);
  registerStoreTools(server);
  registerWeightTools(server, db);
  registerRecipeTools(server, db);
  return server;
}
