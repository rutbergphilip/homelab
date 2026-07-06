import { createServer, type Server } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { Database } from "bun:sqlite";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildMcpServer } from "./mcp";

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
      if (req.method === "GET" && req.url === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
        return;
      }

      const match = req.url?.match(/^\/mcp\/([^/?#]+)$/);
      if (match && safeEqual(decodeURIComponent(match[1]!), opts.token)) {
        if (req.method !== "POST") {
          res.writeHead(405, { allow: "POST" }).end();
          return;
        }
        // Stateless mode: fresh server + transport per request, plain JSON
        // responses (no SSE), so nginx buffering never gets in the way.
        const mcp = buildMcpServer(opts.db);
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
