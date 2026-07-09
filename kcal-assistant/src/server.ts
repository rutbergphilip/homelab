import { createServer, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { Database } from "bun:sqlite";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildMcpServer } from "./mcp";
import { handleUiApi } from "./ui/api";
import type { UiAuthState } from "./ui/auth";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufB, bufB); // constant-ish time even on length mismatch
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// Static assets: three hardcoded mappings — nothing filesystem-derived from
// the URL, so traversal is impossible by construction.
const STATIC_ROUTES: Record<string, { file: URL; type: string }> = {
  "/ui": { file: new URL("./ui/static/index.html", import.meta.url), type: "text/html; charset=utf-8" },
  "/ui/static/app.css": { file: new URL("./ui/static/app.css", import.meta.url), type: "text/css; charset=utf-8" },
  "/ui/static/app.js": { file: new URL("./ui/static/app.js", import.meta.url), type: "text/javascript; charset=utf-8" },
};

const API_ROUTE = /^\/ui\/api\/[a-z]+(\/[A-Za-z0-9-]+)?$/;

function uiHeaders(res: ServerResponse): void {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:");
}

function uiJson(res: ServerResponse, status: number, body: unknown): void {
  uiHeaders(res);
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

export function createHttpServer(opts: { token: string; db: Database; uiAuth: UiAuthState }): Server {
  return createServer(async (req, res) => {
    try {
      const raw = req.url ?? "/";
      // Global reject of raw-path tricks BEFORE any parsing/dispatch: nothing
      // legitimate in this app uses these sequences. new URL() would silently
      // normalize ".." — rejecting raw keeps CF's edge view and ours identical.
      if (raw.includes("..") || raw.includes("%") || raw.includes("\\") || raw.includes("//")) {
        res.writeHead(404, { "content-type": "application/json" }).end('{"error":"not found"}');
        return;
      }
      const pathname = new URL(raw, "http://internal").pathname;

      if (req.method === "GET" && pathname === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
        return;
      }

      const mcpMatch = pathname.match(/^\/mcp\/([^/?#]+)$/);
      if (mcpMatch && safeEqual(decodeURIComponent(mcpMatch[1]!), opts.token)) {
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

      if (pathname === "/ui" || pathname.startsWith("/ui/")) {
        // Auth first: Cloudflare Access JWT verified server-side, fail closed.
        if (opts.uiAuth.mode === "unconfigured") {
          uiJson(res, 503, { error: "UI-autentisering är inte konfigurerad" });
          return;
        }
        if (opts.uiAuth.mode === "configured") {
          const raw = req.headers[opts.uiAuth.header];
          const header = Array.isArray(raw) ? raw[0] : raw;
          const result = await opts.uiAuth.verify(typeof header === "string" ? header : undefined);
          if (!result.ok) {
            uiJson(res, result.status, { error: result.message });
            return;
          }
        }
        if (req.method !== "GET") {
          uiHeaders(res);
          res.writeHead(405, { allow: "GET" }).end();
          return;
        }
        const staticRoute = STATIC_ROUTES[pathname];
        if (staticRoute) {
          uiHeaders(res);
          res.writeHead(200, { "content-type": staticRoute.type });
          res.end(await Bun.file(staticRoute.file).bytes());
          return;
        }
        if (API_ROUTE.test(pathname)) {
          const { status, body } = handleUiApi(
            opts.db,
            pathname,
            new URL(raw, "http://internal").searchParams,
          );
          uiJson(res, status, body);
          return;
        }
        uiJson(res, 404, { error: "finns inte" });
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
