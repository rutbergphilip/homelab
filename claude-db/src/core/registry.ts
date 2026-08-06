import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import type { Domain } from "./domain";
import { fragranceDomain } from "../domains/fragrance";
import { collectionsDomain } from "../domains/collections";
import { lyftaDomain } from "../domains/lyfta";

// Adding a new domain to the platform is this one line plus its folder.
export const DOMAINS: Domain[] = [fragranceDomain, collectionsDomain, lyftaDomain];

const NAME_RE = /^[a-z][a-z0-9]*$/;
for (const d of DOMAINS) {
  // Names are URL segments and tool prefixes; "_" is reserved for core.
  if (!NAME_RE.test(d.name)) throw new Error(`Invalid domain name: ${d.name}`);
}
if (new Set(DOMAINS.map((d) => d.name)).size !== DOMAINS.length) {
  throw new Error("Duplicate domain names in registry");
}

export function findDomain(name: string): Domain | undefined {
  return DOMAINS.find((d) => d.name === name);
}

// A fresh McpServer per request (stateless Streamable HTTP). The Database is
// the shared singleton — safe because bun:sqlite is synchronous.
export function buildMcpServer(db: Database, domains: Domain[]): McpServer {
  const server = new McpServer({ name: "claude-db", version: "0.3.0" });
  for (const domain of domains) {
    domain.register(server, db);
  }
  return server;
}
