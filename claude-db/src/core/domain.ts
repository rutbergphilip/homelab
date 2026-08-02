import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";

// The extensibility contract: a domain is a folder exporting one of these.
// Adding a domain to the platform = appending it to DOMAINS in registry.ts.
export interface Domain {
  // URL segment (/mcp/<token>/<name>) and tool prefix (<name>_*). Lowercase,
  // no separators — it appears verbatim in connector URLs and tool names.
  name: string;
  description: string;
  // Append-only SQL, versioned per domain in schema_migrations. Index 0 is
  // version 1. Never edit a shipped entry; append a new one.
  migrations: string[];
  register(server: McpServer, db: Database): void;
}
