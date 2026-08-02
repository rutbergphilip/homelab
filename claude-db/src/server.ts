import { createServer, type Server } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { Database } from "bun:sqlite";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { DOMAINS, buildMcpServer, findDomain } from "./core/registry";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufB, bufB); // constant-ish time even on length mismatch
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function createHttpServer(opts: { token: string; db: Database }): Server {
  return createServer(async (req, res) => {
    try {
      const raw = req.url ?? "/";
      // Global reject of raw-path tricks BEFORE any parsing/dispatch: nothing
      // legitimate in this app uses these sequences (the token is hex, domain
      // names are [a-z0-9]). Rejecting raw keeps CF's edge view and ours
      // identical — new URL() would silently normalize "..".
      if (raw.includes("..") || raw.includes("%") || raw.includes("\\") || raw.includes("//")) {
        res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
        return;
      }
      const pathname = new URL(raw, "http://internal").pathname;

      if (req.method === "GET" && pathname === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" }).end(
          JSON.stringify({ ok: true, domains: DOMAINS.map((d) => d.name) }),
        );
        return;
      }

      // /mcp/<token>            → all domains
      // /mcp/<token>/<domain>   → that domain's tools only
      const mcpMatch = pathname.match(/^\/mcp\/([^/?#]+)(?:\/([a-z0-9]+))?$/);
      if (mcpMatch && safeEqual(mcpMatch[1]!, opts.token)) {
        const domains = mcpMatch[2] === undefined ? DOMAINS : [findDomain(mcpMatch[2])].filter((d) => d !== undefined);
        if (domains.length === 0) {
          res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
          return;
        }
        if (req.method !== "POST") {
          res.writeHead(405, { allow: "POST" }).end();
          return;
        }
        // Stateless mode: fresh server + transport per request, plain JSON
        // responses (no SSE), so nginx buffering never gets in the way.
        const mcp = buildMcpServer(opts.db, domains);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        res.on("close", () => {
          void transport.close();
          void mcp.close();
        });
        await mcp.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      // Everything else 404s, including claude.ai's /.well-known/oauth-*
      // probes — a clean 404 is how it concludes the connector is no-auth.
      // Never echo the URL back: it may contain a mistyped token.
      res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
    } catch (error) {
      console.error("request failed:", error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" }).end('{"error":"internal"}');
      } else {
        res.end();
      }
    }
  });
}
